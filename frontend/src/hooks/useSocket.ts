import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, GameState, TeamAssignment, Tile } from '../types';

// Function to detect available backend port
const detectBackendPort = async (): Promise<string> => {
  // Always use localhost:3001 for reliability
  console.log('Using fixed backend URL: http://localhost:3001');
  return 'http://localhost:3001';
};

// Get the socket server URL from environment variables or detect automatically
const getSocketServerURL = async (): Promise<string> => {
  // Fixed URL for reliability - no environment variable dependency
  return 'http://localhost:3001';
};

export interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  playerData: Player | null;
  allPlayers: Player[];
  teamAssignment: TeamAssignment;
  gameStarted: boolean;
  gameState: GameState | null;
  joinError: string | null;
  moveError: string | null;
  passTurnError: string | null;
  roundEnded: boolean;
  roundWinner: number | null;
  roundPoints: number;
  gameEnded: boolean;
  gameWinner: number | null;
  gameLocked: boolean;
  lockedGamePlayerTiles: { [key: string]: Tile[] } | null;
  lastMove: { playerId: string; tile: Tile; end: 'left' | 'right' } | null;
  joinGame: (playerName: string) => void;
  makeMove: (tileIndex: number, tableEnd: 'left' | 'right') => void;
  passTurn: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teamAssignment, setTeamAssignment] = useState<TeamAssignment>({ team1: [], team2: [] });
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [passTurnError, setPassTurnError] = useState<string | null>(null);
  const [roundEnded, setRoundEnded] = useState<boolean>(false);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [roundPoints, setRoundPoints] = useState<number>(0);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [gameWinner, setGameWinner] = useState<number | null>(null);
  const [gameLocked, setGameLocked] = useState<boolean>(false);
  const [lockedGamePlayerTiles, setLockedGamePlayerTiles] = useState<{ [key: string]: Tile[] } | null>(null);
  const [lastMove, setLastMove] = useState<{ playerId: string; tile: Tile; end: 'left' | 'right' } | null>(null);

  // Initialize socket connection once
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    const newSocket = io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server! Socket ID:', newSocket.id);
      setConnected(true);
      setJoinError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
      setJoinError('Não foi possível conectar ao servidor. Tente novamente.');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      setConnected(false);
    });

    // Game event listeners
    newSocket.on('joinedGame', ({ player, players, teamAssignment }) => {
      console.log('Joined game successfully');
      setPlayerData(player);
      setAllPlayers(players);
      setTeamAssignment(teamAssignment);
      setJoinError(null);
    });

    newSocket.on('joinError', ({ message }) => {
      console.log('Join error:', message);
      setJoinError(message);
    });

    newSocket.on('playersUpdated', ({ players, teamAssignment }) => {
      setAllPlayers(players);
      setTeamAssignment(teamAssignment);
    });

    newSocket.on('gameStarted', ({ teams, currentPlayer, table }) => {
      console.log('Game started');
      setGameStarted(true);
      setTeamAssignment(teams);
    });

    newSocket.on('gameState', (state) => {
      console.log('Game state received:', state);
      setGameState(state);
    });

    // Add missing event listeners for game functionality
    newSocket.on('tableUpdated', ({ table, currentPlayer, lastMove, tilesLeft }) => {
      console.log('Table updated');
      setGameState((prev) => prev ? {
        ...prev,
        table,
        currentPlayer,
        tilesLeft
      } : null);
      setLastMove(lastMove);
    });

    newSocket.on('handUpdated', ({ hand }) => {
      console.log('Hand updated');
      setGameState((prev) => prev ? {
        ...prev,
        hand
      } : null);
    });

    newSocket.on('moveError', ({ message }) => {
      console.log('Move error:', message);
      setMoveError(message);
      setTimeout(() => setMoveError(null), 3000);
    });

    newSocket.on('passTurnError', ({ message }) => {
      console.log('Pass turn error:', message);
      setPassTurnError(message);
      setTimeout(() => setPassTurnError(null), 3000);
    });

    newSocket.on('turnPassed', ({ currentPlayer, passedBy }) => {
      console.log('Turn passed by:', passedBy);
      setGameState((prev) => prev ? {
        ...prev,
        currentPlayer
      } : null);
    });

    newSocket.on('roundEnded', ({ winner, points, scores }) => {
      console.log('Round ended');
      setRoundEnded(true);
      setRoundWinner(winner);
      setRoundPoints(points);
      setGameState((prev) => prev ? {
        ...prev,
        scores
      } : null);
      
      setTimeout(() => {
        setRoundEnded(false);
        setRoundWinner(null);
        setRoundPoints(0);
      }, 3000);
    });

    newSocket.on('gameEnded', ({ winner, scores }) => {
      console.log('Game ended');
      setGameEnded(true);
      setGameWinner(winner);
      setGameState((prev) => prev ? {
        ...prev,
        scores
      } : null);
    });

    newSocket.on('gameLocked', ({ winner, points, scores, playerTiles }) => {
      console.log('Game locked');
      setGameLocked(true);
      setRoundWinner(winner);
      setRoundPoints(points);
      setLockedGamePlayerTiles(playerTiles);
      setGameState((prev) => prev ? {
        ...prev,
        scores
      } : null);
      
      setTimeout(() => {
        setGameLocked(false);
        setRoundWinner(null);
        setRoundPoints(0);
        setLockedGamePlayerTiles(null);
      }, 5000);
    });

    newSocket.on('newRoundStarted', ({ currentPlayer, roundNumber, table }) => {
      console.log('New round started');
      setGameState((prev) => prev ? {
        ...prev,
        currentPlayer,
        roundNumber,
        table
      } : null);
    });

    return () => {
      console.log('Cleaning up socket');
      newSocket.disconnect();
    };
  }, []);

  const joinGame = (playerName: string) => {
    console.log('Attempting to join game:', playerName);
    if (socket && connected) {
      socket.emit('joinGame', { playerName });
    } else {
      setJoinError('Não conectado ao servidor. Aguarde...');
    }
  };

  const makeMove = (tileIndex: number, tableEnd: 'left' | 'right') => {
    if (socket && connected) {
      socket.emit('makeMove', { tileIndex, tableEnd });
    }
  };

  const passTurn = () => {
    if (socket && connected) {
      socket.emit('passTurn');
    }
  };

  return {
    socket,
    connected,
    playerData,
    allPlayers,
    teamAssignment,
    gameStarted,
    gameState,
    joinError,
    moveError,
    passTurnError,
    roundEnded,
    roundWinner,
    roundPoints,
    gameEnded,
    gameWinner,
    gameLocked,
    lockedGamePlayerTiles,
    lastMove,
    joinGame,
    makeMove,
    passTurn
  };
}; 