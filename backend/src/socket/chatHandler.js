const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map(); // socketId -> user info

const chatHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user || user.isBanned) return next(new Error('Unauthorized'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.name} connected (${socket.id})`);

    // Join room
    socket.on('join_room', async ({ room = 'global' } = {}) => {
      socket.join(room);
      socket.currentRoom = room;

      // Track online user
      onlineUsers.set(socket.id, {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        level: user.level,
        role: user.role,
        room,
      });

      // Broadcast online users for this room
      const roomUsers = Array.from(onlineUsers.values()).filter((u) => u.room === room);
      io.to(room).emit('online_users', roomUsers);

      // Notify room of new user
      const systemMsg = {
        type: 'system',
        content: `${user.name} joined the chat`,
        room,
        createdAt: new Date(),
      };
      socket.to(room).emit('system_message', systemMsg);
    });

    // Get message history
    socket.on('get_history', async ({ room = 'global', limit = 50 } = {}) => {
      try {
        const messages = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('author', 'name avatar level role')
          .lean();

        socket.emit('message_history', messages.reverse());
      } catch (err) {
        socket.emit('error', { message: 'Failed to load history.' });
      }
    });

    // Send message
    socket.on('send_message', async ({ content, room = 'global' } = {}) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.trim().length > 1000) {
          return socket.emit('error', { message: 'Message too long.' });
        }

        const message = await Message.create({
          content: content.trim(),
          author: user._id,
          room,
          type: 'text',
        });

        await message.populate('author', 'name avatar level role');

        io.to(room).emit('new_message', message);
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // Typing indicator
    socket.on('typing_start', ({ room = 'global' } = {}) => {
      socket.to(room).emit('user_typing', { userId: user._id, name: user.name });
    });

    socket.on('typing_stop', ({ room = 'global' } = {}) => {
      socket.to(room).emit('user_stopped_typing', { userId: user._id });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.name} disconnected`);
      const room = socket.currentRoom || 'global';
      onlineUsers.delete(socket.id);

      const roomUsers = Array.from(onlineUsers.values()).filter((u) => u.room === room);
      io.to(room).emit('online_users', roomUsers);

      const systemMsg = {
        type: 'system',
        content: `${user.name} left the chat`,
        room,
        createdAt: new Date(),
      };
      socket.to(room).emit('system_message', systemMsg);
    });
  });
};

module.exports = chatHandler;
