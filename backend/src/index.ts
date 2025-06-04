import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './game';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'], // Polling first, then websocket
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  connectTimeout: 45000,
  upgradeTimeout: 30000,
  httpCompression: false,
  perMessageDeflate: false
});

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001
  });
});

// Game instances
const game = new Game();

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Total connected clients:', io.sockets.sockets.size);
  console.log('Connection details:', {
    socketId: socket.id,
    transport: socket.conn.transport.name,
    timestamp: new Date().toISOString()
  });
  
  // Send immediate confirmation of connection
  socket.emit('connected', { socketId: socket.id });
  
  // Player joins the game
  socket.on('joinGame', ({ playerName }) => {
    console.log('Player attempting to join:', playerName, 'Socket ID:', socket.id);
    
    // Add small delay to ensure socket is fully established
    setTimeout(() => {
      const result = game.addPlayer(socket.id, playerName);
      
      console.log('Join result:', result);
      
      if (result.success) {
        console.log('Player joined successfully:', result.player);
        socket.emit('joinedGame', { 
          player: result.player,
          players: game.getPlayers(),
          teamAssignment: game.getTeamAssignments()
        });
        
        // Broadcast updated player list to all clients
        io.emit('playersUpdated', { 
          players: game.getPlayers(),
          teamAssignment: game.getTeamAssignments()
        });
        
        console.log('Current players count:', game.getPlayers().length);
        
        // Start game if we have 4 players
        if (game.getPlayers().length === 4 && !game.isGameStarted()) {
          console.log('Starting game with 4 players');
          game.startGame();
          
          const gameStartedData = {
            teams: game.getTeamAssignments(),
            currentPlayer: game.getCurrentPlayer(),
            table: game.getTable()
          };
          
          console.log('Emitting gameStarted event to all clients:', gameStartedData);
          io.emit('gameStarted', gameStartedData);
          
          // Send private game state to each player with delay to ensure they receive it
          setTimeout(() => {
            console.log('Sending individual game states to all players');
            game.getPlayers().forEach(player => {
              const playerSocket = io.sockets.sockets.get(player.socketId);
              if (playerSocket) {
                const gameStateData = {
                  hand: game.getPlayerHand(player.id),
                  currentPlayer: game.getCurrentPlayer(),
                  table: game.getTable(),
                  scores: game.getScores(),
                  roundNumber: game.getRoundNumber(),
                  tilesLeft: game.getPlayerTilesCount()
                };
                
                console.log(`Sending gameState to player ${player.name}:`, gameStateData);
                playerSocket.emit('gameState', gameStateData);
              } else {
                console.log(`Warning: Socket not found for player ${player.name}`);
              }
            });
          }, 1000); // 1 second delay
        }
      } else {
        console.log('Join failed:', result.message);
        socket.emit('joinError', { message: result.message });
      }
    }, 100); // Small delay to ensure socket is ready
  });
  
  // Player makes a move
  socket.on('makeMove', ({ tileIndex, tableEnd }) => {
    const playerId = game.getPlayerIdBySocketId(socket.id);
    if (!playerId) return;
    
    const result = game.makeMove(playerId, tileIndex, tableEnd);
    
    if (result.success) {
      // Broadcast updated game state to all players
      io.emit('tableUpdated', {
        table: game.getTable(),
        currentPlayer: game.getCurrentPlayer(),
        lastMove: result.lastMove,
        tilesLeft: game.getPlayerTilesCount()
      });
      
      // Send private hand update to the player who moved
      socket.emit('handUpdated', {
        hand: game.getPlayerHand(playerId)
      });
      
      // Check if round ended
      if (game.isRoundEnded()) {
        const roundResult = game.endRound(playerId);
        io.emit('roundEnded', {
          winner: roundResult.winner,
          points: roundResult.points,
          scores: game.getScores()
        });
        
        // Check if game ended
        if (game.isGameEnded()) {
          io.emit('gameEnded', {
            winner: game.getGameWinner(),
            scores: game.getScores()
          });
        } else {
          // Start new round
          setTimeout(() => {
            game.startNewRound();
            io.emit('newRoundStarted', {
              currentPlayer: game.getCurrentPlayer(),
              roundNumber: game.getRoundNumber(),
              table: game.getTable()
            });
            
            // Send private game state to each player
            game.getPlayers().forEach(player => {
              const playerSocket = io.sockets.sockets.get(player.socketId);
              if (playerSocket) {
                playerSocket.emit('gameState', {
                  hand: game.getPlayerHand(player.id),
                  currentPlayer: game.getCurrentPlayer(),
                  table: game.getTable(),
                  scores: game.getScores(),
                  roundNumber: game.getRoundNumber(),
                  tilesLeft: game.getPlayerTilesCount()
                });
              }
            });
          }, 3000); // Show round results for 3 seconds
        }
      }
    } else {
      socket.emit('moveError', { message: result.message });
    }
  });
  
  // Player passes turn
  socket.on('passTurn', () => {
    const playerId = game.getPlayerIdBySocketId(socket.id);
    if (!playerId) return;
    
    const result = game.passTurn(playerId);
    
    if (result.success) {
      io.emit('turnPassed', {
        currentPlayer: game.getCurrentPlayer(),
        passedBy: playerId
      });
      
      // Check if game is locked (everyone passed)
      if (game.isGameLocked()) {
        const roundResult = game.handleLockedGame();
        io.emit('gameLocked', {
          winner: roundResult.winner,
          points: roundResult.points,
          scores: game.getScores(),
          playerTiles: game.getAllPlayerTiles()
        });
        
        // Check if game ended
        if (game.isGameEnded()) {
          io.emit('gameEnded', {
            winner: game.getGameWinner(),
            scores: game.getScores()
          });
        } else {
          // Start new round
          setTimeout(() => {
            game.startNewRound();
            io.emit('newRoundStarted', {
              currentPlayer: game.getCurrentPlayer(),
              roundNumber: game.getRoundNumber(),
              table: game.getTable()
            });
            
            // Send private game state to each player
            game.getPlayers().forEach(player => {
              const playerSocket = io.sockets.sockets.get(player.socketId);
              if (playerSocket) {
                playerSocket.emit('gameState', {
                  hand: game.getPlayerHand(player.id),
                  currentPlayer: game.getCurrentPlayer(),
                  table: game.getTable(),
                  scores: game.getScores(),
                  roundNumber: game.getRoundNumber(),
                  tilesLeft: game.getPlayerTilesCount()
                });
              }
            });
          }, 5000); // Show locked game results for 5 seconds
        }
      }
    } else {
      socket.emit('passTurnError', { message: result.message });
    }
  });
  
  // Handle timeouts
  socket.on('playerTimeout', () => {
    const playerId = game.getPlayerIdBySocketId(socket.id);
    if (!playerId || game.getCurrentPlayer().id !== playerId) return;
    
    // Automatically make a move or pass turn
    const autoMoveResult = game.makeAutoMove(playerId);
    
    if (autoMoveResult.success) {
      if (autoMoveResult.moved) {
        // A move was made automatically
        io.emit('tableUpdated', {
          table: game.getTable(),
          currentPlayer: game.getCurrentPlayer(),
          lastMove: autoMoveResult.lastMove,
          tilesLeft: game.getPlayerTilesCount(),
          autoMove: true
        });
        
        // Send private hand update to the player
        socket.emit('handUpdated', {
          hand: game.getPlayerHand(playerId)
        });
      } else {
        // Turn was passed automatically
        io.emit('turnPassed', {
          currentPlayer: game.getCurrentPlayer(),
          passedBy: playerId,
          autoPass: true
        });
      }
    }
  });
  
  // Player disconnects
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    console.log('Disconnect details:', {
      reason,
      timestamp: new Date().toISOString(),
      totalConnections: io.sockets.sockets.size - 1,
      transport: socket.conn?.transport?.name || 'unknown'
    });
    
    // Add a small delay to handle rapid disconnect/reconnect scenarios
    setTimeout(() => {
      const removedPlayer = game.getPlayerIdBySocketId(socket.id);
      if (removedPlayer) {
        console.log('Removing player from game:', removedPlayer);
        game.removePlayer(socket.id);
        
        // Only emit updates if there are still connected clients
        if (io.sockets.sockets.size > 0) {
          io.emit('playersUpdated', { 
            players: game.getPlayers(),
            teamAssignment: game.getTeamAssignments()
          });
        }
      }
    }, 500); // 500ms delay to handle rapid disconnects
  });
});

// Function to find available port
const findAvailablePort = (startPort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const testServer = require('net').createServer();
    
    testServer.listen(startPort, () => {
      const port = testServer.address()?.port;
      testServer.close(() => {
        resolve(port);
      });
    });
    
    testServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next one
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// Start server with available port
const startServer = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : await findAvailablePort(3001);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend should connect to: http://localhost:${PORT}`);
      
      // If not using default port, show warning
      if (PORT !== 3001) {
        console.log(`⚠️  WARNING: Using port ${PORT} instead of 3001. Update frontend connection URL if needed.`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 