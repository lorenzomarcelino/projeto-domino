import { v4 as uuidv4 } from 'uuid';

// Types
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

export interface Move {
  playerId: string;
  tile: Tile;
  end: 'left' | 'right';
}

export interface TeamAssignment {
  team1: Player[];
  team2: Player[];
}

// Game class
export class Game {
  private players: Player[] = [];
  private teams: { [key: number]: Player[] } = { 1: [], 2: [] };
  private playerHands: { [key: string]: Tile[] } = {};
  private table: Tile[] = [];
  private remainingTiles: Tile[] = [];
  private currentPlayerIndex: number = 0;
  private gameStarted: boolean = false;
  private roundNumber: number = 1;
  private scores: { [key: number]: number } = { 1: 0, 2: 0 };
  private passCount: number = 0;
  private lastWinningTeam: number | null = null;
  private consecutiveDraws: number = 0;
  private pointMultiplier: number = 1;
  
  constructor() {
    this.initializeTiles();
  }
  
  // Initialize all 28 dominoes
  private initializeTiles() {
    this.remainingTiles = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        this.remainingTiles.push({
          left: i,
          right: j,
          isDouble: i === j
        });
      }
    }
  }
  
  // Shuffle the tiles
  private shuffleTiles() {
    for (let i = this.remainingTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.remainingTiles[i], this.remainingTiles[j]] = [this.remainingTiles[j], this.remainingTiles[i]];
    }
  }
  
  // Deal tiles to players
  private dealTiles() {
    // Reset hands
    this.playerHands = {};
    this.players.forEach(player => {
      this.playerHands[player.id] = [];
    });
    
    // Shuffle tiles
    this.shuffleTiles();
    
    // Deal 7 tiles to each player
    this.players.forEach(player => {
      this.playerHands[player.id] = this.remainingTiles.splice(0, 6);
    });
    
    // Save 4 tiles as remaining
    // The remaining tiles array now has 4 tiles (28 - 6*4 = 4)
  }
  
  // Add player to the game
  public addPlayer(socketId: string, playerName: string) {
    // Don't allow empty or very short names
    if (!playerName || playerName.trim().length < 2) {
      return { success: false, message: 'Nome muito curto. Use pelo menos 2 caracteres.' };
    }
    
    // Limit name length
    if (playerName.trim().length > 20) {
      return { success: false, message: 'Nome muito longo. Use no máximo 20 caracteres.' };
    }
    
    // Check if the game is already full
    if (this.players.length >= 4) {
      return { success: false, message: 'Sala cheia. Tente novamente mais tarde.' };
    }
    
    // Check if player already exists with this socket ID
    const existingPlayerBySock = this.players.find(p => p.socketId === socketId);
    if (existingPlayerBySock) {
      return { success: false, message: 'Você já está conectado com outro nome.' };
    }
    
    // Check if the name is already taken (case insensitive)
    if (this.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      return { success: false, message: 'Este nome já está em uso. Escolha outro.' };
    }
    
    // Create new player
    const player: Player = {
      id: uuidv4(),
      socketId,
      name: playerName.trim()
    };
    
    // Add player
    this.players.push(player);
    
    // Assign teams if we have all 4 players
    if (this.players.length === 4) {
      this.assignTeams();
    }
    
    return { success: true, player };
  }
  
  // Assign players to teams randomly
  private assignTeams() {
    // Shuffle players
    const shuffledPlayers = [...this.players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    
    // Assign first two to team 1, last two to team 2
    this.teams = { 1: [], 2: [] };
    
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const teamNumber = i < 2 ? 1 : 2;
      shuffledPlayers[i].team = teamNumber;
      this.teams[teamNumber].push(shuffledPlayers[i]);
    }
  }
  
  // Remove player from the game
  public removePlayer(socketId: string) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      const player = this.players[index];
      this.players.splice(index, 1);
      
      // Remove from teams
      if (player.team) {
        this.teams[player.team] = this.teams[player.team].filter(p => p.id !== player.id);
      }
      
      // If game was started, reset it
      if (this.gameStarted) {
        this.gameStarted = false;
        this.scores = { 1: 0, 2: 0 };
        this.roundNumber = 1;
      }
    }
  }
  
  // Update player socket ID for reconnection
  public updatePlayerSocketId(playerId: string, newSocketId: string): boolean {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = newSocketId;
      return true;
    }
    return false;
  }
  
  // Start the game
  public startGame() {
    if (this.players.length !== 4) {
      return { success: false, message: 'Need 4 players to start' };
    }
    
    if (this.gameStarted) {
      return { success: false, message: 'Game already started' };
    }
    
    this.gameStarted = true;
    this.scores = { 1: 0, 2: 0 };
    this.roundNumber = 1;
    this.consecutiveDraws = 0;
    this.pointMultiplier = 1;
    
    // Deal tiles
    this.dealTiles();
    
    // Find player with highest double or highest tile
    this.determineFirstPlayer();
    
    return { success: true };
  }
  
  // Determine first player based on highest double
  private determineFirstPlayer() {
    this.table = [];
    
    // If we have a previous winning team (not in first round and not after a draw)
    if (this.roundNumber > 1 && this.lastWinningTeam !== null && this.consecutiveDraws === 0) {
      // Get one of the players from the winning team
      const winningTeamPlayers = this.teams[this.lastWinningTeam];
      
      // Randomly select one of them
      const randomIndex = Math.floor(Math.random() * winningTeamPlayers.length);
      const selectedPlayer = winningTeamPlayers[randomIndex];
      
      // Find the index of this player in the players array
      this.currentPlayerIndex = this.players.findIndex(p => p.id === selectedPlayer.id);
      return;
    }
    
    // For first round or after a draw, check for highest double
    let highestDouble = -1;
    let playerWithHighestDouble = -1;
    
    // Look for the highest double
    this.players.forEach((player, index) => {
      const hand = this.playerHands[player.id];
      hand.forEach(tile => {
        if (tile.isDouble && tile.left > highestDouble) {
          highestDouble = tile.left;
          playerWithHighestDouble = index;
        }
      });
    });
    
    // If no double, find highest tile
    if (playerWithHighestDouble === -1) {
      let highestTileValue = -1;
      
      this.players.forEach((player, index) => {
        const hand = this.playerHands[player.id];
        hand.forEach(tile => {
          const tileValue = tile.left + tile.right;
          if (tileValue > highestTileValue) {
            highestTileValue = tileValue;
            playerWithHighestDouble = index;
          }
        });
      });
    }
    
    this.currentPlayerIndex = playerWithHighestDouble;
  }
  
  // Make a move
  public makeMove(playerId: string, tileIndex: number, tableEnd: 'left' | 'right') {
    if (!this.gameStarted) {
      return { success: false, message: 'Game not started' };
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    const hand = this.playerHands[playerId];
    if (tileIndex < 0 || tileIndex >= hand.length) {
      return { success: false, message: 'Invalid tile index' };
    }
    
    const tile = hand[tileIndex];
    
    // Check if the move is valid
    if (!this.isValidMove(tile, tableEnd)) {
      return { success: false, message: 'Invalid move' };
    }
    
    // Add tile to the table
    if (tableEnd === 'left') {
      // Might need to flip the tile
      if (this.table.length > 0 && tile.right !== this.table[0].left) {
        const flipped = { left: tile.right, right: tile.left, isDouble: tile.isDouble };
        this.table.unshift(flipped);
      } else {
        this.table.unshift(tile);
      }
    } else {
      // Might need to flip the tile
      if (this.table.length > 0 && tile.left !== this.table[this.table.length - 1].right) {
        const flipped = { left: tile.right, right: tile.left, isDouble: tile.isDouble };
        this.table.push(flipped);
      } else {
        this.table.push(tile);
      }
    }
    
    // Remove the tile from player's hand
    hand.splice(tileIndex, 1);
    
    // Reset pass count
    this.passCount = 0;
    
    // Store the move for replay
    const lastMove: Move = { playerId, tile, end: tableEnd };
    
    // Move to next player
    this.moveToNextPlayer();
    console.log('[DEBUG] Novo jogador da vez:', this.getCurrentPlayer());
    
    return { 
      success: true,
      lastMove
    };
  }
  
  // Check if a move is valid
  private isValidMove(tile: Tile, tableEnd: 'left' | 'right'): boolean {
    // If table is empty, any tile is valid
    if (this.table.length === 0) {
      return true;
    }
    
    if (tableEnd === 'left') {
      const leftmostTile = this.table[0];
      return tile.left === leftmostTile.left || tile.right === leftmostTile.left;
    } else {
      const rightmostTile = this.table[this.table.length - 1];
      return tile.left === rightmostTile.right || tile.right === rightmostTile.right;
    }
  }
  
  // Pass turn
  public passTurn(playerId: string) {
    if (!this.gameStarted) {
      return { success: false, message: 'Game not started' };
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }
    
    // Check if the player can actually make a move
    const hand = this.playerHands[playerId];
    const canMove = hand.some(tile => this.isValidMove(tile, 'left') || this.isValidMove(tile, 'right'));
    
    if (canMove) {
      return { success: false, message: 'You have a valid move available' };
    }
    
    // Increment pass count
    this.passCount++;
    
    // Move to next player
    this.moveToNextPlayer();
    
    return { success: true };
  }
  
  // Move to next player
  private moveToNextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }
  
  // Check if round has ended
  public isRoundEnded(): boolean {
    // Check if any player has no tiles left
    for (const player of this.players) {
      if (this.playerHands[player.id].length === 0) {
        return true;
      }
    }
    
    return false;
  }
  
  // Check if game is locked (everyone passed)
  public isGameLocked(): boolean {
    return this.passCount >= this.players.length;
  }
  
  // Handle locked game
  public handleLockedGame() {
    // Find the player with the lowest points in hand
    let lowestPoints = Infinity;
    let winningPlayer: Player | null = null;
    let winningTeam: number | null = null;
    
    for (const player of this.players) {
      const hand = this.playerHands[player.id];
      const points = hand.reduce((sum, tile) => sum + tile.left + tile.right, 0);
      
      if (points < lowestPoints) {
        lowestPoints = points;
        winningPlayer = player;
        winningTeam = player.team!;
      } else if (points === lowestPoints && winningPlayer && winningTeam) {
        // If tie, check if players are from different teams
        if (player.team !== winningTeam) {
          // Draw - multiply next round points
          this.consecutiveDraws++;
          this.pointMultiplier = Math.pow(2, this.consecutiveDraws);
          return { winner: null, points: 0, isDraw: true };
        }
      }
    }
    
    // Award 1 point to the winning team (adjusted by multiplier)
    if (winningTeam) {
      this.scores[winningTeam] += 1 * this.pointMultiplier;
      this.lastWinningTeam = winningTeam;
      this.consecutiveDraws = 0;
      this.pointMultiplier = 1;
    }
    
    return { 
      winner: winningTeam, 
      points: 1 * this.pointMultiplier
    };
  }
  
  // End the current round
  public endRound(winnerPlayerId?: string) {
    // If no winner player ID provided, use current player (for locked games)
    let winnerPlayer: Player;
    if (winnerPlayerId) {
      winnerPlayer = this.players.find(p => p.id === winnerPlayerId)!;
    } else {
      winnerPlayer = this.getCurrentPlayer();
    }
    
    const winningTeam = winnerPlayer.team!;
    let points = 1; // Default points
    
    // Calculate points based on win type
    if (this.playerHands[winnerPlayer.id].length === 0) {
      // Player has no tiles left
      const lastPlayedTile = this.table[this.table.length - 1];
      const tableLeft = this.table[0].left;
      const tableRight = this.table[this.table.length - 1].right;
      
      if (lastPlayedTile.isDouble && tableLeft === tableRight) {
        // Cruzada (double tile with both ends matching)
        points = 4;
      } else if (!lastPlayedTile.isDouble && tableLeft !== tableRight && 
                (lastPlayedTile.left === tableLeft || lastPlayedTile.right === tableLeft) && 
                (lastPlayedTile.left === tableRight || lastPlayedTile.right === tableRight)) {
        // Lá e lô (non-double matching both ends)
        points = 3;
      } else if (lastPlayedTile.isDouble) {
        // Carroça (double tile)
        points = 2;
      }
      // Simple win is already points = 1
    }
    
    // Apply multiplier if there were consecutive draws
    points *= this.pointMultiplier;
    
    // Award points
    this.scores[winningTeam] += points;
    
    // Reset for next round
    this.lastWinningTeam = winningTeam;
    this.consecutiveDraws = 0;
    this.pointMultiplier = 1;
    
    return {
      winner: winningTeam,
      points
    };
  }
  
  // Start a new round
  public startNewRound() {
    this.roundNumber++;
    this.table = [];
    this.passCount = 0;
    
    // Deal new tiles
    this.initializeTiles();
    this.dealTiles();
    
    // Determine first player
    this.determineFirstPlayer();
  }
  
  // Check if game has ended
  public isGameEnded(): boolean {
    return this.scores[1] >= 6 || this.scores[2] >= 6;
  }
  
  // Get the winning team
  public getGameWinner(): number | null {
    if (this.scores[1] >= 6) {
      return 1;
    } else if (this.scores[2] >= 6) {
      return 2;
    }
    return null;
  }
  
  // Make an automatic move when player times out
  public makeAutoMove(playerId: string) {
    if (!this.gameStarted) {
      return { success: false, message: 'Game not started', moved: false };
    }
    
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      return { success: false, message: 'Not your turn', moved: false };
    }
    
    const hand = this.playerHands[playerId];
    const validMoves: { index: number, end: 'left' | 'right' }[] = [];
    
    // Find all valid moves
    hand.forEach((tile, index) => {
      if (this.isValidMove(tile, 'left')) {
        validMoves.push({ index, end: 'left' });
      }
      if (this.isValidMove(tile, 'right')) {
        validMoves.push({ index, end: 'right' });
      }
    });
    
    // If there are valid moves, make one randomly
    if (validMoves.length > 0) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      const moveResult = this.makeMove(playerId, randomMove.index, randomMove.end);
      
      if (moveResult.success) {
        return { success: true, moved: true, lastMove: moveResult.lastMove };
      }
    }
    
    // If no valid moves or move failed, pass turn
    const passResult = this.passTurn(playerId);
    return { success: passResult.success, moved: false };
  }
  
  // Get all player tiles (for locked game display)
  public getAllPlayerTiles() {
    const result: { [key: string]: Tile[] } = {};
    
    this.players.forEach(player => {
      result[player.id] = this.playerHands[player.id];
    });
    
    return result;
  }
  
  // Helper functions to get game state
  public getPlayerIdBySocketId(socketId: string): string | null {
    const player = this.players.find(p => p.socketId === socketId);
    return player ? player.id : null;
  }
  
  public getPlayers(): Player[] {
    return this.players;
  }
  
  public getTeamAssignments(): TeamAssignment {
    return {
      team1: this.teams[1] || [],
      team2: this.teams[2] || []
    };
  }
  
  public getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }
  
  public getTable(): Tile[] {
    return this.table;
  }
  
  public getPlayerHand(playerId: string): Tile[] {
    return this.playerHands[playerId] || [];
  }
  
  public getScores(): { [key: number]: number } {
    return this.scores;
  }
  
  public getRoundNumber(): number {
    return this.roundNumber;
  }
  
  public isGameStarted(): boolean {
    return this.gameStarted;
  }
  
  public getPlayerTilesCount(): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    
    this.players.forEach(player => {
      result[player.id] = this.playerHands[player.id].length;
    });
    
    return result;
  }
} 