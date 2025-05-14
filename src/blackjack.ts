import { Group, DecodedMessage } from "@xmtp/node-sdk";
import { log } from "./helpers/utils.js";

interface Player {
  address: string;
  hand: string[];
  total: number;
}

class BlackjackGame {
  private players: Map<string, Player>;
  private deck: string[];
  private dealerHand: string[];
  private group: Group;

  constructor(group: Group) {
    this.players = new Map();
    this.deck = this.createDeck();
    this.dealerHand = [];
    this.group = group;
  }

  private createDeck(): string[] {
    const suits = ['♠', '♣', '♥', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    return this.shuffle(deck);
  }

  private shuffle(deck: string[]): string[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  async handleCommand(message: DecodedMessage): Promise<void> {
    const content = message.content as string;
    const command = content.toLowerCase();
    const sender = message.senderAddress as string;

    switch (command) {
      case '/join':
        await this.handleJoin(sender);
        break;
      case '/hit':
        await this.handleHit(sender);
        break;
      case '/stand':
        await this.handleStand(sender);
        break;
      case '/start':
        await this.startGame();
        break;
    }
  }

  private async handleJoin(address: string): Promise<void> {
    this.players.set(address, {
      address,
      hand: [],
      total: 0
    });

    await this.group.send(`${address} joined the game`);
  }

  private async startGame(): Promise<void> {
    this.deck = this.createDeck();
    this.dealerHand = [this.deck.pop()!, this.deck.pop()!];

    for (const [address, player] of this.players) {
      player.hand = [this.deck.pop()!, this.deck.pop()!];
      player.total = this.calculateTotal(player.hand);
      await this.group.send(`${address} cards: ${player.hand.join(', ')} (Total: ${player.total})`);
    }

    await this.group.send(`Dealer shows: ${this.dealerHand[0]}`);
  }

  private calculateTotal(hand: string[]): number {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      const value = card.slice(0, -1);
      if (value === 'A') {
        aces++;
        total += 11;
      } else if (['K', 'Q', 'J'].includes(value)) {
        total += 10;
      } else {
        total += parseInt(value);
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  private async handleHit(address: string): Promise<void> {
    const player = this.players.get(address);
    if (!player) return;

    const card = this.deck.pop()!;
    player.hand.push(card);
    player.total = this.calculateTotal(player.hand);

    await this.group.send(`${address} drew ${card} (Total: ${player.total})`);

    if (player.total > 21) {
      await this.group.send(`${address} busted!`);
      await this.handleStand(address);
    }
  }

  private async handleStand(address: string): Promise<void> {
    const player = this.players.get(address);
    if (!player) return;

    // Check if all players have finished
    const allStood = Array.from(this.players.values()).every(p => p.total >= 21 || p.hand.length === 0);

    if (allStood) {
      await this.resolveDealerHand();
      await this.determineWinners();
    }
  }

  private async resolveDealerHand(): Promise<void> {
    let dealerTotal = this.calculateTotal(this.dealerHand);
    await this.group.send(`Dealer's hidden card: ${this.dealerHand[1]}`);

    while (dealerTotal < 17) {
      const card = this.deck.pop()!;
      this.dealerHand.push(card);
      dealerTotal = this.calculateTotal(this.dealerHand);
      await this.group.send(`Dealer drew ${card} (Total: ${dealerTotal})`);
    }
  }

  private async determineWinners(): Promise<void> {
    const dealerTotal = this.calculateTotal(this.dealerHand);

    for (const [address, player] of this.players) {
      if (player.total > 21) {
        await this.group.send(`${address} lost`);
      } else if (dealerTotal > 21 || player.total > dealerTotal) {
        await this.group.send(`${address} won!`);
      } else if (player.total === dealerTotal) {
        await this.group.send(`${address} tied`);
      } else {
        await this.group.send(`${address} lost`);
      }

      player.hand = [];
    }
  }
}

export default BlackjackGame;