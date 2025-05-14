
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
<video width="100%" controls>
  <source src="Screen%20Recording%202025-05-14%20at%204.04.23%20PM.mov" type="video/mp4">
  Your browser does not support the video tag.
</video>

[Download demo video (MOV)](demo.mov)

*Note: If the video doesn't load, you can also view the GIF demo below:*

![Hangman Bot Demo](attached_assets/Screen%20Recording%202025-05-14%20at%204.04.23%20PM.gif)
