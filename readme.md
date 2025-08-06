# Age of Empires II Discord Taunt Bot

A Discord bot that plays classic Age of Empires II taunts in voice channels. Simply type a number (1-105) in chat while in a voice channel, and the bot will join and play the corresponding taunt!

## Features

- 🎮 Plays all 105 classic AOE2 taunts
- 🔊 Automatically joins your voice channel
- ⚡ Quick response - just type a number!
- 🤖 Automatically disconnects after playing
- 🛡️ Input validation and error handling

## Setup

### Prerequisites

- Node.js (v16.9.0 or higher)
- npm or yarn
- A Discord bot token
- AOE2 taunt audio files (.ogg format)

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
```

4. **Get AOE2 taunt files** (see section below)

### Getting AOE2 Taunt Files

**Important:** This repository does not include the AOE2 taunt audio files due to copyright restrictions.

To use this bot, you'll need to extract the taunt files from your own copy of Age of Empires II:

1. **If you own AOE2: Definitive Edition:**
   - Navigate to your AOE2 installation folder
   - Look for audio files in the game's data directory
   - Convert to `.ogg` format if needed

2. **Alternative methods:**
   - Use game modding tools to extract audio
   - Record the taunts yourself from the game
   - Find community-created taunt packs

3. **File setup:** 
   - Create a `taunts/` folder in the project root
   - Name files as `1.ogg`, `2.ogg`, etc. (numbers 1-105)
   - Your folder structure should look like:
   ```
   taunts/
   ├── 1.ogg
   ├── 2.ogg
   ├── 3.ogg
   └── ... (up to 105.ogg)
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

## Usage

1. Start the bot:
```bash
node index.js
```

2. Join a voice channel in your Discord server

3. Type any number from 1 to 105 in a text channel

4. The bot will join your voice channel and play the corresponding taunt!

## Popular Taunts

Some classic AOE2 taunts to try:
- `1` - "Yes"
- `2` - "No"
- `11` - Monk conversion sound (classic!)
- `14` - "Start the game already!"
- `30` - "Wololo" (the famous monk sound)

## File Structure

```
aoe2-discord-taunt-bot/
├── index.js          # Main bot code
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (not tracked)
├── .gitignore        # Git ignore file
├── taunts/           # Directory for taunt audio files (not tracked)
│   ├── 1.ogg         # User-provided AOE2 taunt files
│   ├── 2.ogg
│   └── ...
└── README.md         # This file
```

## Dependencies

- `discord.js` - Discord API wrapper
- `@discordjs/voice` - Voice connection handling
- `dotenv` - Environment variable management

## Troubleshooting

**Bot doesn't respond to numbers:**
- Make sure you're in a voice channel when typing
- Verify the bot has proper permissions
- Check that taunt files exist in the `taunts/` folder

**Audio doesn't play:**
- Ensure audio files are in `.ogg` format
- Check file names match the pattern (1.ogg, 2.ogg, etc.)
- Verify the bot has "Speak" permission in voice channels
- Make sure you have all taunt files (1-105) in the `taunts/` folder

**Missing taunt files:**
- See the "Getting AOE2 Taunt Files" section above
- Ensure you own a legal copy of Age of Empires II

**Connection errors:**
- Make sure your `DISCORD_TOKEN` is correct in the `.env` file
- Check that the bot is invited to your server

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
