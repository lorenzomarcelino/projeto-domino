export interface Player {
  id: string;
  socketId: string;
  name: string;
  team?: number;
}

export interface Tile {
  left: number;
  right: number;
  isDouble: boolean;
}

export interface TeamAssignment {
  team1: Player[];
  team2: Player[];
}

export interface GameState {
  hand: Tile[];
  currentPlayer: Player;
  table: Tile[];
  scores: { [key: number]: number };
  roundNumber: number;
  tilesLeft: { [key: string]: number };
} 