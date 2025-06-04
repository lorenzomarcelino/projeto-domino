const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: "*",
  credentials: true
}));

let connectedUsers = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Total connected clients:', io.sockets.sockets.size);
  
  // Send immediate confirmation
  socket.emit('connected', { socketId: socket.id });
  
  socket.on('joinGame', ({ playerName }) => {
    console.log('Player attempting to join:', playerName, 'Socket ID:', socket.id);
    
    // Simple validation
    if (!playerName || playerName.trim().length < 2) {
      console.log('Invalid name:', playerName);
      socket.emit('joinError', { message: 'Nome muito curto' });
      return;
    }
    
    // Check if name already exists
    if (connectedUsers.find(u => u.name.toLowerCase() === playerName.toLowerCase())) {
      console.log('Name already taken:', playerName);
      socket.emit('joinError', { message: 'Nome já está em uso' });
      return;
    }
    
    // Add user
    const user = {
      id: socket.id,
      socketId: socket.id,
      name: playerName.trim()
    };
    
    connectedUsers.push(user);
    console.log('User added successfully:', user);
    console.log('Total users:', connectedUsers.length);
    
    // Send success response
    socket.emit('joinedGame', {
      player: user,
      players: connectedUsers,
      teamAssignment: { team1: [], team2: [] }
    });
    
    // Broadcast to all clients
    io.emit('playersUpdated', {
      players: connectedUsers,
      teamAssignment: { team1: [], team2: [] }
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    connectedUsers = connectedUsers.filter(u => u.socketId !== socket.id);
    console.log('Remaining users:', connectedUsers.length);
    
    // Broadcast updated list
    io.emit('playersUpdated', {
      players: connectedUsers,
      teamAssignment: { team1: [], team2: [] }
    });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 