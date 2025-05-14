
# Hangman Bot

A multiplayer Hangman game bot for XMTP group chats.

## Setup

1. Install dependencies: `npm install`

2. Generate XMTP keys: `npm run gen:keys`

3. Start the bot: `npm start`

## Environment Variables

- `WALLET_KEY`: Private key of the wallet
- `ENCRYPTION_KEY`: Encryption key for the local database
- `XMTP_ENV`: XMTP environment (dev/production)

## Game Commands

- `/join` - Join the game
- `/starthangman` - Start a new game
- `/guess <letter>` - Guess a letter
- `/guessword <word>` - Guess the entire word
- `/leaderboard` - Show scores
- `/score` - Show your current score
- `/help` - Display all available commands

## Demo Video
![Hangman Bot Demo](attached_assets/Screen%20Recording%202025-05-14%20at%204.04.23%20PM.gif)
