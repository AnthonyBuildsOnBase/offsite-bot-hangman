
import { Client, DecodedMessage, Group } from "@xmtp/node-sdk";
import { isSameString, log } from "./helpers/utils.js";
import { Game } from "./game.js";
import { HangmanGame } from "./hangman.js";

const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 10000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listenForMessages(client: Client) {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      log(
        `Starting message stream... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );
      const stream = await client.conversations.streamAllMessages();
      log("Message stream started successfully. Waiting for messages...");

      const blackjackGames = new Map<string, Game>();

      for await (const message of stream) {
        log(`Received message: ${message?.content}`);

        if (shouldSkip(message, client)) {
          log("Skipping message - either from self or wrong content type");
          continue;
        }

        const content = message.content as string;

        // Handle help command
        if (content.toLowerCase() === "/help") {
          log("Processing help command...");
          try {
            const conversationId = message?.conversationId;
            if (!conversationId) {
              log("Error: Conversation ID not found in message");
              continue;
            }

            const conversation = await client.conversations.getConversationById(conversationId);
            if (!conversation) {
              log(`Error: Could not find conversation for message ${message?.id} with conversationId ${conversationId}`);
              continue;
            }
            await conversation.send(
              "🎮 Hangman Commands:\n" +
                "/join - Join the game\n" +
                "/starthangman - Start a new game\n" +
                "/guess <letter> - Guess a letter\n" +
                "/guessword <word> - Guess the entire word\n" +
                "/leaderboard - Show scores",
            );
            log("Help message sent successfully");
          } catch (error) {
            log(`Error sending help message: ${error}`);
          }
          continue;
        }

        // Handle greetings
        if (content.toLowerCase() === "hi") {
          const conversation = message.conversation;
          if (conversation) {
            await conversation.send("Hello! 👋");
          }
          continue;
        }

        // Handle game commands
        if (content.startsWith("/")) {
          const conversationId = message?.conversationId;
          if (!conversationId) {
            log("Error: Conversation ID not found in message");
            continue;
          }

          const conversation = await client.conversations.getConversationById(conversationId);
          if (!conversation) {
            log(`Error: Could not find conversation for message ${message?.id}`);
            continue;
          }

          if (!conversation.isGroup) {
            await conversation.send("This game can only be played in group chats!");
            continue;
          }
          const group = conversation as Group;
          const isActive = await conversation.isActive();

          let game = blackjackGames.get(group.id);

          if (!game) {
            game = new HangmanGame(group);
            blackjackGames.set(group.id, game);
            await group.send("Hangman game ready! Use /join to join the game and /starthangman to begin.");
            continue;
          }

          await game.handleCommand(message);
        }
      }

      retryCount = 0;
    } catch (streamError: unknown) {
      retryCount++;
      log(
        `Stream error (Attempt ${retryCount}/${MAX_RETRIES}): ${streamError instanceof Error ? streamError.message : String(streamError)}`,
      );

      if (retryCount < MAX_RETRIES) {
        log(
          `Waiting ${RETRY_DELAY_MS / 1000} seconds before retrying stream...`,
        );
        await sleep(RETRY_DELAY_MS);
      }
    }
  }
}

function shouldSkip(message: DecodedMessage<any> | undefined, client: Client) {
  if (!message) {
    return true;
  }
  return (
    isSameString(message.senderInboxId, client.inboxId) ||
    message.contentType?.typeId !== "text"
  );
}
