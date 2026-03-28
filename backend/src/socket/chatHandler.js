const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map(); // socketId -> user info

const chatHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
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

    // ── Join room ──────────────────────────────────────────────
    socket.on('join_room', async ({ room = 'global' } = {}) => {
      socket.join(room);
      socket.currentRoom = room;

      onlineUsers.set(socket.id, {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        level: user.level,
        role: user.role,
        room,
      });

      const roomUsers = Array.from(onlineUsers.values()).filter((u) => u.room === room);
      io.to(room).emit('online_users', roomUsers);

      socket.to(room).emit('system_message', {
        type: 'system',
        content: `${user.name} entrou no chat`,
        room,
        createdAt: new Date(),
      });
    });

    // ── Message history ────────────────────────────────────────
    socket.on('get_history', async ({ room = 'global', limit = 60 } = {}) => {
      try {
        const messages = await Message.find({ room })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('author', 'name avatar level role')
          .lean();
        socket.emit('message_history', messages.reverse());
      } catch (err) {
        socket.emit('error', { message: 'Falha ao carregar histórico.' });
      }
    });

    // ── Send message (text or media) ───────────────────────────
    socket.on('send_message', async ({
      content = '',
      room = 'global',
      type = 'text',
      mediaUrl = null,
      mediaFileName = null,
      mediaSize = 0,
      mediaMime = null,
    } = {}) => {
      try {
        const text = content.trim();

        // Must have text OR media
        if (!text && !mediaUrl) return;
        if (text.length > 1000) {
          return socket.emit('error', { message: 'Mensagem muito longa.' });
        }

        const message = await Message.create({
          content: text,
          author: user._id,
          room,
          type: mediaUrl ? type : 'text',
          mediaUrl,
          mediaFileName,
          mediaSize,
          mediaMime,
        });

        await message.populate('author', 'name avatar level role');
        io.to(room).emit('new_message', message);
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        socket.emit('error', { message: 'Falha ao enviar mensagem.' });
      }
    });

    // ── Typing ─────────────────────────────────────────────────
    socket.on('typing_start', ({ room = 'global' } = {}) => {
      socket.to(room).emit('user_typing', { userId: user._id, name: user.name });
    });

    socket.on('typing_stop', ({ room = 'global' } = {}) => {
      socket.to(room).emit('user_stopped_typing', { userId: user._id });
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      const room = socket.currentRoom || 'global';
      onlineUsers.delete(socket.id);

      const roomUsers = Array.from(onlineUsers.values()).filter((u) => u.room === room);
      io.to(room).emit('online_users', roomUsers);

      socket.to(room).emit('system_message', {
        type: 'system',
        content: `${user.name} saiu do chat`,
        room,
        createdAt: new Date(),
      });
    });
  });
};

module.exports = chatHandler;
