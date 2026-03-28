require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./src/config/database');
const chatHandler = require('./src/socket/chatHandler');
const Subscription = require('./src/models/Subscription');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const contentRoutes = require('./src/routes/content');
const categoryRoutes = require('./src/routes/categories');
const subscriptionRoutes = require('./src/routes/subscriptions');
const communityRoutes = require('./src/routes/community');
const dropRoutes = require('./src/routes/drops');
const adminRoutes = require('./src/routes/admin');
const searchRoutes = require('./src/routes/search');
const notificationRoutes = require('./src/routes/notifications');
const webhookRoutes = require('./src/routes/webhook');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: false },
});

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) { fs.mkdirSync('uploads', { recursive: true }); }

// Trust proxy (necessário no Render/Railway para IPs corretos)
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make io accessible to routes
app.set('io', io);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io
chatHandler(io);

// Cron job: expire subscriptions every hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const result = await Subscription.updateMany(
      { status: 'active', endDate: { $lt: now }, plan: { $ne: 'lifetime' } },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[CRON] Expired ${result.modifiedCount} subscriptions`);
    }
  } catch (err) {
    console.error('[CRON] Error expiring subscriptions:', err.message);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
