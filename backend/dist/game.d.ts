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
export declare class Game {
    private players;
    private teams;
    private playerHands;
    private table;
    private remainingTiles;
    private currentPlayerIndex;
    private gameStarted;
    private roundNumber;
    private scores;
    private passCount;
    private lastWinningTeam;
    private consecutiveDraws;
    private pointMultiplier;
    constructor();
    private initializeTiles;
    private shuffleTiles;
    private dealTiles;
    addPlayer(socketId: string, playerName: string): {
        success: boolean;
        message: string;
        player?: undefined;
    } | {
        success: boolean;
        player: Player;
        message?: undefined;
    };
    private assignTeams;
    removePlayer(socketId: string): void;
    updatePlayerSocketId(playerId: string, newSocketId: string): boolean;
    startGame(): {
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    };
    private determineFirstPlayer;
    makeMove(playerId: string, tileIndex: number, tableEnd: 'left' | 'right'): {
        success: boolean;
        message: string;
        lastMove?: undefined;
    } | {
        success: boolean;
        lastMove: Move;
        message?: undefined;
    };
    private isValidMove;
    passTurn(playerId: string): {
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    };
    private moveToNextPlayer;
    isRoundEnded(): boolean;
    isGameLocked(): boolean;
    handleLockedGame(): {
        winner: null;
        points: number;
        isDraw: boolean;
    } | {
        winner: number | null;
        points: number;
        isDraw?: undefined;
    };
    endRound(winnerPlayerId?: string): {
        winner: number;
        points: number;
    };
    startNewRound(): void;
    isGameEnded(): boolean;
    getGameWinner(): number | null;
    makeAutoMove(playerId: string): {
        success: boolean;
        message: string;
        moved: boolean;
        lastMove?: undefined;
    } | {
        success: boolean;
        moved: boolean;
        lastMove: Move | undefined;
        message?: undefined;
    } | {
        success: boolean;
        moved: boolean;
        message?: undefined;
        lastMove?: undefined;
    };
    getAllPlayerTiles(): {
        [key: string]: Tile[];
    };
    getPlayerIdBySocketId(socketId: string): string | null;
    getPlayers(): Player[];
    getTeamAssignments(): TeamAssignment;
    getCurrentPlayer(): Player;
    getTable(): Tile[];
    getPlayerHand(playerId: string): Tile[];
    getScores(): {
        [key: number]: number;
    };
    getRoundNumber(): number;
    isGameStarted(): boolean;
    getPlayerTilesCount(): {
        [key: string]: number;
    };
}
