# Age of Empires II Discord Taunt Bot

A Discord bot that plays classic Age of Empires II taunts in voice channels. Simply type a number (1-105) in chat while in a voice channel, or tag someone to play a taunt in their channel!

## Features

- 🎮 Plays all 105 classic AOE2 taunts
- 🔊 Automatically joins voice channels
- 👥 **NEW**: Tag users to play taunts in their voice channel
- ⚙️ Configurable mention feature via environment variables
- ⚡ Quick response - just type a number!
- 🤖 Automatically disconnects after playing
- 🛡️ Comprehensive input validation and error handling
- 📁 Built-in file existence checking

## Usage

The bot supports two ways to play taunts:

### Method 1: Play in Your Own Channel
1. Join a voice channel in your Discord server
2. Type any number from 1 to 105 in a text channel
3. The bot will join your voice channel and play the corresponding taunt!

**Example:**
```
42
```

### Method 2: Tag Someone Else
You can play taunts in other users' voice channels by mentioning them:

**Examples:**
```
42 @username
@username 42
```

The bot will:
- Check if the mentioned user exists and is in a voice channel
- Join their voice channel and play the taunt
- Handle all errors gracefully with helpful messages

**Perfect for:**
- Taunting friends in different voice channels
- Responding to someone without having to join their channel
- Remote taunting during games!

> **Note:** The mention feature can be enabled/disabled via the `ENABLE_DISCORD_MENTIONS` environment variable.

## Popular Taunts

Some classic AOE2 taunts to try:
- `1` - "Yes"
- `2` - "No" 
- `14` - "Start the game already!"
- `22` - "Quit touching me!"
- `30` - "Wololo"

## Setup

### Prerequisites
- Node.js (v16.9.0 or higher)
- npm or yarn
- A Discord bot token
- AOE2 taunt audio files (.ogg format, numbered 1-105)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ohinde/aoe-discord-bot.git
cd aoe-discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_discord_bot_token_here
ENABLE_DISCORD_MENTIONS=true
```

### Setting up the Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Invite the bot to your server with the following permissions:
   - Send Messages
   - Connect to Voice Channels
   - Speak in Voice Channels
   - Use Voice Activity

### Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DISCORD_TOKEN` | Required | Your Discord bot token |
| `ENABLE_DISCORD_MENTIONS` | `false` | Enable/disable user tagging feature |

### Running the Bot

Start the bot:
```bash
node index.js
```

You should see:
```
Logged in as YourBotName#1234
```

## File Structure

```
aoe2-discord-taunt-bot/
├── index.js          # Main bot code
├── package.json      # Dependencies and scripts
├── .env             # Environment variables (not tracked)
├── .gitignore       # Git ignore file
├── taunts/          # Directory for taunt audio files (not tracked)
│   ├── 1.ogg       # "Yes"
│   ├── 2.ogg       # "No"
│   ├── 30.ogg      # "Wololo"
│   └── ...         # All taunts 1-105
└── README.md        # This file
```

## Dependencies

- `discord.js` - Discord API wrapper
- `@discordjs/voice` - Voice connection handling  
- `dotenv` - Environment variable management

## Troubleshooting

### Bot doesn't respond to numbers:
- **Basic usage**: Make sure you're in a voice channel when typing
- **Tagging usage**: Ensure the mentioned user exists and is in a voice channel
- Verify the bot has proper permissions in your server
- Check that taunt files exist in the `taunts/` folder with correct naming (1.ogg, 2.ogg, etc.)

### "Taunt file not found" error:
- Ensure audio files are in `.ogg` format
- Check file names match exactly: `1.ogg`, `2.ogg`, ..., `105.ogg`
- Verify files are in the `taunts/` directory relative to your bot script
- Make sure you have all taunt files you want to use (bot will tell you which ones are missing)

### Audio doesn't play:
- Verify the bot has "Speak" permission in voice channels
- Check that your audio files aren't corrupted
- Ensure the voice channel isn't full or restricted

### Mention feature not working:
- Check that `ENABLE_DISCORD_MENTIONS=true` in your `.env` file
- Verify the mentioned user exists on the server
- Ensure the mentioned user is currently in a voice channel
- Use the correct format: `number @user` or `@user number`

### Connection errors:
- Verify your `DISCORD_TOKEN` is correct in the `.env` file
- Check that the bot is invited to your server with required permissions
- Ensure your bot token hasn't expired or been regenerated

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Wololo!** 🏰