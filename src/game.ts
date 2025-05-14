
import { Group, DecodedMessage } from "@xmtp/node-sdk";

export interface Player {
  address: string;
}

export abstract class Game {
  protected players: Map<string, Player>;
  protected group: Group;

  constructor(group: Group) {
    this.players = new Map();
    this.group = group;
  }

  abstract handleCommand(message: DecodedMessage): Promise<void>;

  protected async handleJoin(address: string): Promise<void> {
    if (!this.players.has(address)) {
      this.players.set(address, { address });
      await this.group.send(`${address} joined the game`);
    }
  }
}
