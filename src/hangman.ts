
import { Group, DecodedMessage } from "@xmtp/node-sdk";
import { Game, Player } from "./game.js";

interface HangmanPlayer extends Player {
  score: number;
}

export class HangmanGame extends Game {
  private word: string = "";
  private display: string[] = [];
  private guessedLetters: Set<string> = new Set();
  private incorrectGuesses: number = 0;
  private active: boolean = false;
  private scores: Map<string, number> = new Map();
  
  private readonly WORDS = [
    "PYTHON", "JAVASCRIPT", "TYPESCRIPT", "PROGRAMMING", "COMPUTER",
    "DEVELOPER", "SOFTWARE", "CODING", "ALGORITHM", "DATABASE"
  ];

  constructor(group: Group) {
    super(group);
  }

  async handleCommand(message: DecodedMessage): Promise<void> {
    const content = message.content as string;
    const sender = message.senderAddress as string;
    const [command, ...args] = content.toLowerCase().split(" ");

    switch (command) {
      case "/starthangman":
        await this.startGame();
        break;
      case "/guess":
        if (args.length === 1) {
          await this.handleGuess(sender, args[0]);
        }
        break;
      case "/guessword":
        if (args.length === 1) {
          await this.handleWordGuess(sender, args[0]);
        }
        break;
      case "/leaderboard":
        await this.showLeaderboard();
        break;
      case "/join":
        await this.handleJoin(sender);
        break;
    }
  }

  private async startGame(): Promise<void> {
    this.word = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    this.display = Array(this.word.length).fill("_");
    this.guessedLetters.clear();
    this.incorrectGuesses = 0;
    this.active = true;

    await this.group.send(
      "New game started!\n" +
      `Word: ${this.display.join(" ")}\n` +
      `Incorrect guesses allowed: ${6 - this.incorrectGuesses}`
    );
  }

  private async handleGuess(address: string, letter: string): Promise<void> {
    if (!this.active) {
      await this.group.send("No active game. Use /starthangman to start a new game.");
      return;
    }

    letter = letter.toUpperCase();
    if (this.guessedLetters.has(letter)) {
      await this.group.send(`Letter ${letter} has already been guessed!`);
      return;
    }

    this.guessedLetters.add(letter);
    if (this.word.includes(letter)) {
      for (let i = 0; i < this.word.length; i++) {
        if (this.word[i] === letter) {
          this.display[i] = letter;
        }
      }
      this.updateScore(address, 5);
      await this.group.send(`Correct guess! +5 points\nWord: ${this.display.join(" ")}`);
    } else {
      this.incorrectGuesses++;
      this.updateScore(address, -3);
      await this.group.send(
        `Wrong guess! -3 points\n` +
        `Word: ${this.display.join(" ")}\n` +
        `Incorrect guesses: ${this.incorrectGuesses}/6`
      );
    }

    await this.checkGameEnd(address);
  }

  private async handleWordGuess(address: string, guess: string): Promise<void> {
    if (!this.active) {
      await this.group.send("No active game. Use /starthangman to start a new game.");
      return;
    }

    if (guess.toUpperCase() === this.word) {
      this.display = this.word.split("");
      this.updateScore(address, 30); // 20 for correct guess + 10 bonus
      await this.group.send(`Correct word guess! +30 points\nThe word was: ${this.word}`);
      this.active = false;
    } else {
      this.incorrectGuesses++;
      this.updateScore(address, -10);
      await this.group.send(
        `Wrong word guess! -10 points\n` +
        `Word: ${this.display.join(" ")}\n` +
        `Incorrect guesses: ${this.incorrectGuesses}/6`
      );
      await this.checkGameEnd(address);
    }
  }

  private async checkGameEnd(address: string): Promise<void> {
    if (!this.display.includes("_")) {
      await this.group.send(`Congratulations! The word was: ${this.word}`);
      this.active = false;
    } else if (this.incorrectGuesses >= 6) {
      await this.group.send(`Game Over! The word was: ${this.word}`);
      this.active = false;
    }
  }

  private updateScore(address: string, points: number): void {
    const currentScore = this.scores.get(address) || 0;
    this.scores.set(address, currentScore + points);
  }

  private async showLeaderboard(): Promise<void> {
    const sortedScores = Array.from(this.scores.entries())
      .sort(([, a], [, b]) => b - a);
    
    const leaderboard = sortedScores
      .map(([addr, score], index) => `${index + 1}. ${addr}: ${score} points`)
      .join("\n");

    await this.group.send(
      "🏆 Leaderboard 🏆\n" +
      (leaderboard || "No scores yet!")
    );
  }

  protected async handleJoin(address: string): Promise<void> {
    if (!this.scores.has(address)) {
      this.scores.set(address, 0);
    }
    await this.group.send(`${address} joined the game! Current score: 0`);
  }
}
