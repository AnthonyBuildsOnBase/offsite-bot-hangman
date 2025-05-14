
import { Client, DecodedMessage, Group } from "@xmtp/node-sdk";
import { isSameString, log } from "./helpers/utils.js";
import BlackjackGame from "./blackjack.js";

const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 10000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listenForMessages(client: Client) {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      log(`Starting message stream... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      const stream = await client.conversations.streamAllMessages();
      log("Message stream started successfully. Waiting for messages...");

      const blackjackGames = new Map<string, BlackjackGame>();

      for await (const message of stream) {
        if (shouldSkip(message, client)) {
          continue;
        }

        const content = message.content as string;
        
        // Handle greetings
        if (content.toLowerCase() === 'hi') {
          const conversation = message.conversation;
          if (conversation) {
            await conversation.send('Hello! 👋');
          }
          continue;
        }

        // Handle game commands
        if (content.startsWith('/')) {
          const group = message.conversation as Group;
          let game = blackjackGames.get(group.id);

          if (!game) {
            game = new BlackjackGame(group);
            blackjackGames.set(group.id, game);
          }

          await game.handleCommand(message);
        }
      }

      retryCount = 0;

    } catch (streamError: unknown) {
      retryCount++;
      log(`Stream error (Attempt ${retryCount}/${MAX_RETRIES}): ${streamError instanceof Error ? streamError.message : String(streamError)}`);

      if (retryCount < MAX_RETRIES) {
        log(`Waiting ${RETRY_DELAY_MS / 1000} seconds before retrying stream...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }
}

function shouldSkip(message: DecodedMessage<any> | undefined, client: Client) {
  if (!message) {
    return true;
  }
  return isSameString(message.senderInboxId, client.inboxId) || message.contentType?.typeId !== "text";
}
