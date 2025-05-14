
# Blackjack Bot

A simple blackjack bot for XMTP group chats.

## Setup

1. Install dependencies: `npm install`

2. Generate XMTP keys: `npm run gen:keys`

3. Start the bot: `npm start`

## Environment Variables

- `WALLET_KEY`: Private key of the wallet
- `ENCRYPTION_KEY`: Encryption key for the local database
- `XMTP_ENV`: XMTP environment (dev/production)

## Commands

- `/join <amount>` - Join the game with specified buy-in amount
- `/bet <amount>` - Place a bet
- `/hit` - Request another card
- `/stand` - Stand with current hand
- `/start` - Start a new game round
