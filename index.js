const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
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
    // Ignore messages from bots or users not in a voice channel
    if (message.author.bot || !message.member.voice.channel) return;
    
    // Get the message content without leading/trailing whitespace
    const trimmedMessage = message.content.trim();
    
    // Check if message contains only digits (taunt numbers)
    if (trimmedMessage.match(/^\d+$/) == null) return;
    
    // Convert the message to an integer for taunt number
    const tauntNumber = parseInt(trimmedMessage);
    
    // Validate taunt number is within AOE2's taunt range (1-105)
    if (tauntNumber > 105 || tauntNumber < 1) return;
    
    // Construct the file path for the requested taunt audio file
    const tauntFile = path.join(TAUNTS_PATH, `${tauntNumber}.ogg`);
    
    try {
        // Create voice connection to the user's current voice channel
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,     // Target voice channel ID
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
});

// Login to Discord using the bot token from environment variables
client.login(process.env.DISCORD_TOKEN);