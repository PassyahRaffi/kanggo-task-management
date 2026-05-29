const app = require('./app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await pool.execute('SELECT 1');
      console.log('[DB] Connected to MySQL successfully');
      return;
    } catch (err) {
      console.log(`[DB] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
};

const startServer = async () => {
  try {
    await waitForDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} | NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start after retries:', err.message);
    process.exit(1);
  }
};

startServer();
