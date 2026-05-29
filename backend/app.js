require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { notFound, globalError } = require('./src/middleware/errorHandler');
const authRoutes      = require('./src/routes/auth');
const taskRoutes      = require('./src/routes/tasks');
const dashboardRoutes = require('./src/routes/dashboard');
const userRoutes      = require('./src/routes/users');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth',      authRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users',     userRoutes);

app.use(notFound);
app.use(globalError);

module.exports = app;
