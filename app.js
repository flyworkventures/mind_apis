const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const auth = require('./routes/auth');
const consultants = require('./routes/consultants');
const chats = require('./routes/chats');
const appointments = require('./routes/appointments');
const moods = require('./routes/moods');
const notifications = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');
const SocketHandler = require('./socket/socketHandler');
require('dotenv').config();

// Initialize database connection
require('./config/database');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (mobil uygulama için gerekli)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/auth', auth);
app.use('/consultants', consultants);
app.use('/chats', chats);
app.use('/appointments', appointments);
app.use('/moods', moods);
app.use('/notifications', notifications);
app.use('/video-call', require('./routes/videoCall'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (en sonda olmalı)
app.use(errorHandler);

// Initialize Socket.IO (for legacy realtime chat)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3014;
server.listen(PORT, "0.0.0.0",() => {
  console.log(`Server started PORT: ${PORT}`);
  console.log(`Socket.IO server ready for legacy realtime connections`);
  console.log(`Realtime WebSocket server ready on port ${process.env.REALTIME_WS_PORT || 3001}`);
});