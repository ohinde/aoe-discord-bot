const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Configure dotenv to load environment variables from .env file
dotenv.config();

// Create a new Discord client instance
const client = new Client({
    // Add required intents for bot functionality
    intents: [
        GatewayIntentBits.Guilds,           // Allows joining servers
        GatewayIntentBits.GuildMessages,    // Allows reading messages
        GatewayIntentBits.MessageContent,   // Allows accessing message content
        GatewayIntentBits.GuildVoiceStates, // Allows joining voice channels
    ],
});

// Define the path where AOE2 taunt audio files (.ogg) are stored
const TAUNTS_PATH = './taunts';
// Define a regex pattern to match standard taunt messages
const STANDARD_PATTERN= /^\d+$/;
// Define a regex pattern to match taunt messages with user mentions
const MENTION_PATTERN = /^(\d+)\s+<@!?(\d+)>$|^<@!?(\d+)>\s+(\d+)$/;

// Event listener for when the bot successfully connects to Discord
client.once('ready', () => {
    // Log successful login with bot's username
    console.log(`Logged in as ${client.user.tag}`);
    
    // Set presence status and activity
    client.user.setPresence({
        activities: [{ name: `Age of Empires II`, type: ActivityType.Playing }],
        status: 'dnd',
    });
});

// Event listener for when a message is created in any server the bot is in
client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Get the message content without leading/trailing whitespace
    const trimmedMessage = message.content.trim();

    // Check for taunt with mention format: "taunt_number @user" or "@user taunt_number"
    const mentionTauntMatch = trimmedMessage.match(MENTION_PATTERN);
    
    // If the message matches the mention taunt pattern and mentions are enabled
    if (mentionTauntMatch && process.env.ENABLE_DISCORD_MENTIONS === 'true') {
        // Extract taunt number and user ID from the match
        const tauntNumber = parseInt(mentionTauntMatch[1] || mentionTauntMatch[4]);
        const targetUserId = mentionTauntMatch[2] || mentionTauntMatch[3];
        
        // Get the mentioned user's member object
        const targetMember = message.guild.members.cache.get(targetUserId);
        
        // Check if the mentioned user exists in the server
        if (!targetMember) {
            await message.reply('Could not find the mentioned user.');
            return;
        }

        // Check if the mentioned user exists and is in a voice channel
        if (!targetMember.voice.channel) {
            await message.reply(`${targetMember.displayName} is not in a voice channel.`);
            return;
        }
        
        // Play the taunt in the target user's voice channel
        await playTaunt(message, tauntNumber, targetMember.voice.channel);
        
        return;
    }
    
    // Check for reply with taunt number format: reply to a message with just a number
    if (message.reference && trimmedMessage.match(STANDARD_PATTERN)) {
        try {
            // Fetch the original message being replied to
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            
            // Get the member object of the original message author
            const referencedMember = message.guild.members.cache.get(referencedMessage.author.id);
            
            // Check if the referenced user exists in the server
            if (!referencedMember) {
                await message.reply('Could not find the user you replied to.');
                return;
            }
            
            // Check if the referenced user is in a voice channel
            if (!referencedMember.voice.channel) {
                await message.reply(`${referencedMember.displayName} is not in a voice channel.`);
                return;
            }
            
            // Convert the message to an integer for taunt number
            const tauntNumber = parseInt(trimmedMessage);
            
            // Play the taunt in the referenced user's voice channel
            await playTaunt(message, tauntNumber, referencedMember.voice.channel);
            
            return;
        } catch (error) {
            console.error('Error fetching referenced message:', error);
            await message.reply('Could not find the message you replied to.');
            return;
        }
    }
    
    // Check if message contains only digits and user is in voice channel
    if (trimmedMessage.match(STANDARD_PATTERN) == null) return;
    
    // Check if the message sender is in a voice channel
    if (!message.member.voice.channel) {
        await message.reply('You need to be in a voice channel to play a taunt, or mention someone who is in a voice channel.');
        return;
    }

    // Convert the message to an integer for taunt number
    const tauntNumber = parseInt(trimmedMessage);

    // Play the taunt in the sender's voice channel
    await playTaunt(message, tauntNumber, message.member.voice.channel);
});

// Function to play a taunt audio file in a specified voice channel
async function playTaunt(message, tauntNumber, targetChannel) {
    // Validate taunt number is within AOE2's taunt range (1-105)
    if (tauntNumber > 105 || tauntNumber < 1) {
        await message.reply('Taunt number must be between 1 and 105.');
        return;
    }
    
    // Construct the file path for the requested taunt audio file
    const tauntFile = path.join(TAUNTS_PATH, `${tauntNumber}.ogg`);

    // Check if the taunt file exists
    if (!fs.existsSync(tauntFile)) {
        await message.reply(`Taunt file not found: ${tauntFile}`);
        return;
    }

    try {
        // Create voice connection to the user's current voice channel
        const connection = joinVoiceChannel({
            channelId: targetChannel.id,     // Target voice channel ID
            guildId: message.guild.id,                      // Server ID
            adapterCreator: message.guild.voiceAdapterCreator, // Voice adapter for audio
        });
        
        // Create audio player and resource for the taunt file
        const player = createAudioPlayer();
        const taunt = createAudioResource(tauntFile);
        
        // Start playing the taunt audio
        player.play(taunt);
        connection.subscribe(player);
        
        // Disconnect from voice channel when audio finishes playing
        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });
        
    } catch (error) {
        console.error(error);
        // Send error message as reply if voice connection fails
        await message.reply('An error occurred while connecting to the voice channel.');
    }
}

// Login to Discord using the bot token from environment variables
client.login(process.env.DISCORD_TOKEN);