const fs = require('fs');
const path = require('path');

// Create a mock function that we can control
const mockMessageHandler = jest.fn();

// Mock discord.js and @discordjs/voice before importing our main module
const mockUser = {
    tag: 'TestBot#1234',
    setPresence: jest.fn()
};

const mockClient = {
    once: jest.fn(),
    on: jest.fn((event, handler) => {
        if (event === 'messageCreate') {
            mockMessageHandler.mockImplementation(handler);
        }
    }),
    login: jest.fn(),
    user: mockUser
};

const mockVoiceChannel = {
    id: 'voice123',
    name: 'Test Voice Channel'
};

const mockMember = {
    voice: {
        channel: mockVoiceChannel
    },
    displayName: 'TestUser'
};

const mockGuild = {
    id: 'guild123',
    members: {
        cache: {
            get: jest.fn()
        }
    },
    voiceAdapterCreator: jest.fn()
};

const mockMessage = {
    author: {
        bot: false,
        id: 'user123'
    },
    content: '',
    guild: mockGuild,
    member: mockMember,
    reply: jest.fn(),
    reference: null,
    channel: {
        messages: {
            fetch: jest.fn()
        }
    }
};

const mockConnection = {
    subscribe: jest.fn(),
    destroy: jest.fn()
};

const mockPlayer = {
    play: jest.fn(),
    on: jest.fn()
};

const mockAudioResource = {};

// Setup Discord.js mocks
jest.mock('discord.js', () => ({
    Client: jest.fn(() => mockClient),
    GatewayIntentBits: {
        Guilds: 1,
        GuildMessages: 2,
        MessageContent: 4,
        GuildVoiceStates: 8
    },
    ActivityType: {
        Playing: 0
    }
}));

jest.mock('@discordjs/voice', () => ({
    joinVoiceChannel: jest.fn(() => mockConnection),
    createAudioPlayer: jest.fn(() => mockPlayer),
    createAudioResource: jest.fn(() => mockAudioResource),
    AudioPlayerStatus: {
        Idle: 'idle'
    }
}));

jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Mock fs module
jest.mock('fs');

// Import the module to trigger initialization
require('../index.js');

describe('AOE Discord Bot Tests', () => {
    const originalEnv = process.env;
    
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        
        // Reset mock implementations
        mockMessage.content = '';
        mockMessage.reference = null;
        mockMessage.member = mockMember;
        mockMessage.reply.mockResolvedValue();
        mockGuild.members.cache.get.mockReturnValue(mockMember);
        mockMessage.channel.messages.fetch.mockResolvedValue(mockMessage);
        fs.existsSync.mockReturnValue(true);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Message Pattern Recognition', () => {
        test('should match standard taunt pattern (numbers only)', () => {
            const STANDARD_PATTERN = /^\d+$/;
            
            expect('42'.match(STANDARD_PATTERN)).toBeTruthy();
            expect('1'.match(STANDARD_PATTERN)).toBeTruthy();
            expect('105'.match(STANDARD_PATTERN)).toBeTruthy();
            expect('42a'.match(STANDARD_PATTERN)).toBeNull();
            expect('a42'.match(STANDARD_PATTERN)).toBeNull();
            expect('4 2'.match(STANDARD_PATTERN)).toBeNull();
            expect(''.match(STANDARD_PATTERN)).toBeNull();
        });

        test('should match mention pattern (number + user mention)', () => {
            const MENTION_PATTERN = /^(\d+)\s+<@!?(\d+)>$|^<@!?(\d+)>\s+(\d+)$/;
            
            expect('42 <@123456>'.match(MENTION_PATTERN)).toBeTruthy();
            expect('42 <@!123456>'.match(MENTION_PATTERN)).toBeTruthy();
            expect('<@123456> 42'.match(MENTION_PATTERN)).toBeTruthy();
            expect('<@!123456> 42'.match(MENTION_PATTERN)).toBeTruthy();
            expect('42<@123456>'.match(MENTION_PATTERN)).toBeNull();
            expect('42  <@123456>'.match(MENTION_PATTERN)).toBeTruthy(); // This actually matches with \\s+
        });

        test('should ignore bot messages', async () => {
            mockMessage.author.bot = true;
            mockMessage.content = '42';
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should handle standard taunt when user is in voice channel', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should reply with error when user not in voice channel', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = null;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith(
                'You need to be in a voice channel to play a taunt, or mention someone who is in a voice channel.'
            );
        });

        test('should handle mention taunt when mentions are enabled', async () => {
            process.env.ENABLE_DISCORD_MENTIONS = 'true';
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@123456>';
            mockMessage.reference = null;
            mockGuild.members.cache.get.mockReturnValue(mockMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockGuild.members.cache.get).toHaveBeenCalledWith('123456');
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should handle reverse mention taunt format', async () => {
            process.env.ENABLE_DISCORD_MENTIONS = 'true';
            mockMessage.author.bot = false;
            mockMessage.content = '<@123456> 42';
            mockMessage.reference = null;
            mockGuild.members.cache.get.mockReturnValue(mockMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockGuild.members.cache.get).toHaveBeenCalledWith('123456');
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should reply with error when mentioned user does not exist', async () => {
            process.env.ENABLE_DISCORD_MENTIONS = 'true';
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@123456>';
            mockMessage.reference = null;
            mockGuild.members.cache.get.mockReturnValue(null);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Could not find the mentioned user.');
        });

        test('should reply with error when mentioned user not in voice channel', async () => {
            process.env.ENABLE_DISCORD_MENTIONS = 'true';
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@123456>';
            mockMessage.reference = null;
            const mentionedMember = { ...mockMember, voice: { channel: null }, displayName: 'MentionedUser' };
            mockGuild.members.cache.get.mockReturnValue(mentionedMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('MentionedUser is not in a voice channel.');
        });

        test('should ignore mention taunt when mentions are disabled', async () => {
            // Set it back to disabled for this test  
            delete process.env.ENABLE_DISCORD_MENTIONS;
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@123456>';
            mockMessage.member.voice.channel = null;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith(
                'You need to be in a voice channel to play a taunt, or mention someone who is in a voice channel.'
            );
        });

        test('should handle reply taunt when replying to a message', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.reference = { messageId: 'msg123' };
            const referencedMessage = { author: { id: 'user456' } };
            mockMessage.channel.messages.fetch.mockResolvedValue(referencedMessage);
            const referencedMember = { ...mockMember, displayName: 'ReferencedUser' };
            mockGuild.members.cache.get.mockReturnValue(referencedMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.channel.messages.fetch).toHaveBeenCalledWith('msg123');
            expect(mockGuild.members.cache.get).toHaveBeenCalledWith('user456');
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should handle error when referenced message author not found', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.reference = { messageId: 'msg123' };
            const referencedMessage = { author: { id: 'user456' } };
            mockMessage.channel.messages.fetch.mockResolvedValue(referencedMessage);
            mockGuild.members.cache.get.mockReturnValue(null);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Could not find the user you replied to.');
        });

        test('should handle error when referenced user not in voice channel', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.reference = { messageId: 'msg123' };
            const referencedMessage = { author: { id: 'user456' } };
            mockMessage.channel.messages.fetch.mockResolvedValue(referencedMessage);
            const referencedMember = { ...mockMember, voice: { channel: null }, displayName: 'ReferencedUser' };
            mockGuild.members.cache.get.mockReturnValue(referencedMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('ReferencedUser is not in a voice channel.');
        });

        test('should handle error when referenced message cannot be fetched', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.reference = { messageId: 'msg123' };
            mockMessage.channel.messages.fetch.mockRejectedValue(new Error('Message not found'));
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Could not find the message you replied to.');
        });
    });

    describe('Taunt Number Validation', () => {
        test('should accept valid taunt numbers (1-105)', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '1';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '1.ogg'));
            expect(mockMessage.reply).not.toHaveBeenCalledWith('Taunt number must be between 1 and 105.');
        });

        test('should accept taunt number 105', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '105';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '105.ogg'));
            expect(mockMessage.reply).not.toHaveBeenCalledWith('Taunt number must be between 1 and 105.');
        });

        test('should reject taunt number 0', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '0';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Taunt number must be between 1 and 105.');
        });

        test('should reject taunt number 106', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '106';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Taunt number must be between 1 and 105.');
        });

        test('should reject negative taunt numbers', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '-1';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            // This won't match the standard pattern, so it should be ignored
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });
    });

    describe('File System Operations', () => {
        test('should check if taunt file exists', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            fs.existsSync.mockReturnValue(true);
            
            await mockMessageHandler(mockMessage);
            
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should reply with error when taunt file does not exist', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            fs.existsSync.mockReturnValue(false);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith(`Taunt file not found: ${path.join('./taunts', '42.ogg')}`);
        });
    });

    describe('Voice Connection and Audio Playback', () => {
        const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
        
        test('should create voice connection with correct parameters', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(joinVoiceChannel).toHaveBeenCalledWith({
                channelId: mockVoiceChannel.id,
                guildId: mockGuild.id,
                adapterCreator: mockGuild.voiceAdapterCreator
            });
        });

        test('should create audio player and resource', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(createAudioPlayer).toHaveBeenCalled();
            expect(createAudioResource).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should start playing audio and subscribe to connection', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockPlayer.play).toHaveBeenCalledWith(mockAudioResource);
            expect(mockConnection.subscribe).toHaveBeenCalledWith(mockPlayer);
        });

        test('should set up audio player idle event handler', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockPlayer.on).toHaveBeenCalledWith('idle', expect.any(Function));
        });

        test('should disconnect when audio finishes playing', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            // Get the idle event handler and call it
            const idleHandler = mockPlayer.on.mock.calls.find(call => call[0] === 'idle')[1];
            idleHandler();
            
            expect(mockConnection.destroy).toHaveBeenCalled();
        });

        test('should handle voice connection errors', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '42';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            // Mock console.error to suppress the error output
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            joinVoiceChannel.mockImplementationOnce(() => {
                throw new Error('Connection failed');
            });
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('An error occurred while connecting to the voice channel.');
            
            // Restore console.error
            consoleSpy.mockRestore();
        });
    });

    describe('Bot Initialization', () => {
        const { Client } = require('discord.js');
        const dotenv = require('dotenv');
        
        test('should create Discord client with correct intents', () => {
            expect(Client).toHaveBeenCalledWith({
                intents: [1, 2, 4, 8] // GatewayIntentBits values
            });
        });

        test('should set up ready event handler', () => {
            expect(mockClient.once).toHaveBeenCalledWith('ready', expect.any(Function));
        });

        test('should set up message event handler', () => {
            expect(mockClient.on).toHaveBeenCalledWith('messageCreate', expect.any(Function));
        });

        test('should login with Discord token', () => {
            expect(mockClient.login).toHaveBeenCalledWith(process.env.DISCORD_TOKEN);
        });

        test('should load dotenv configuration', () => {
            expect(dotenv.config).toHaveBeenCalled();
        });

        test('should set bot presence when ready', () => {
            // Simulate the ready event
            const readyHandler = mockClient.once.mock.calls.find(call => call[0] === 'ready');
            if (readyHandler && readyHandler[1]) {
                readyHandler[1]();
                
                expect(mockUser.setPresence).toHaveBeenCalledWith({
                    activities: [{ name: 'Age of Empires II', type: 0 }],
                    status: 'dnd'
                });
            }
        });
    });

    describe('Environment Configuration', () => {
        test('should respect ENABLE_DISCORD_MENTIONS environment variable', async () => {
            // Test when disabled (undefined or false)
            delete process.env.ENABLE_DISCORD_MENTIONS;
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@123456>';
            mockMessage.member.voice.channel = null;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockGuild.members.cache.get).not.toHaveBeenCalled();
            expect(mockMessage.reply).toHaveBeenCalledWith(
                'You need to be in a voice channel to play a taunt, or mention someone who is in a voice channel.'
            );
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should ignore non-numeric messages', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = 'hello world';
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).not.toHaveBeenCalled();
            expect(fs.existsSync).not.toHaveBeenCalled();
        });

        test('should ignore empty messages', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '';
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).not.toHaveBeenCalled();
        });

        test('should handle messages with leading/trailing whitespace', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '  42  ';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(fs.existsSync).toHaveBeenCalledWith(path.join('./taunts', '42.ogg'));
        });

        test('should handle large taunt numbers gracefully', async () => {
            mockMessage.author.bot = false;
            mockMessage.content = '999999';
            mockMessage.member.voice.channel = mockVoiceChannel;
            mockMessage.reference = null;
            
            await mockMessageHandler(mockMessage);
            
            expect(mockMessage.reply).toHaveBeenCalledWith('Taunt number must be between 1 and 105.');
        });

        test('should handle mention parsing with alternate user ID formats', async () => {
            process.env.ENABLE_DISCORD_MENTIONS = 'true';
            mockMessage.author.bot = false;
            mockMessage.content = '42 <@!123456>';
            mockMessage.reference = null;
            mockGuild.members.cache.get.mockReturnValue(mockMember);
            
            await mockMessageHandler(mockMessage);
            
            expect(mockGuild.members.cache.get).toHaveBeenCalledWith('123456');
        });
    });
});