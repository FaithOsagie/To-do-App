// The Express application — exported separately from server.js
// so it can be imported cleanly in tests.

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./src/config/logger');
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();

// ─── View Engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false })); // Parse form submissions
app.use(express.json());
app.use(cookieParser()); // Parse cookies (needed to read JWT cookie)

// HTTP request logging via Morgan — streams into Winston
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    // Skip logging in test environment
    skip: () => process.env.NODE_ENV === 'test',
  })
);

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/tasks'));  // Root → tasks
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// ─── Error Handling ─────────────────────────────────────────────────────────────
app.use(notFound);        // 404 handler
app.use(errorHandler);    // Global error handler (must be last)

module.exports = app;