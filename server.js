import express from 'express';
import cors from 'cors';
import session from 'express-session';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase, companyOps, categoryOps, transactionOps, exchangeRateOps, settingsOps, currencyOps } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Auth credentials from environment variables
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Trust proxy in production (Railway uses a reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: isProduction ? true : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Use lax for both environments to ensure cookies work properly
  }
}));

// Serve static files in production
if (isProduction) {
  app.use(express.static(join(__dirname, 'dist')));
}

// Auth middleware - protects all /api routes except /api/auth/*
function requireAuth(req, res, next) {
  // When mounted at /api, req.path is relative (e.g., /auth/login not /api/auth/login)
  if (req.path.startsWith('/auth/') || req.path === '/health') {
    return next();
  }
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

app.use('/api', requireAuth);

// ===== Auth Routes =====
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true, username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// ===== Company Routes =====
app.get('/api/companies', (req, res) => {
  try {
    const companies = companyOps.getAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    const { id, name } = req.body;
    const company = companyOps.create(id, name);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const company = companyOps.update(id, name);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    const { id } = req.params;
    companyOps.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Category Routes =====
app.get('/api/categories', (req, res) => {
  try {
    const categories = categoryOps.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { id, name } = req.body;
    const category = categoryOps.create(id, name);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = categoryOps.update(id, name);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    categoryOps.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Transaction Routes =====
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = transactionOps.getAll();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const transaction = transactionOps.create(req.body);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/transactions/:id', (req, res) => {
  try {
    const transaction = transactionOps.update({ ...req.body, id: req.params.id });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    transactionOps.delete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Exchange Rate Routes =====
app.get('/api/exchange-rates', (req, res) => {
  try {
    const rates = exchangeRateOps.getAll();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exchange-rates', (req, res) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    const result = exchangeRateOps.upsert(fromCurrency, toCurrency, rate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exchange-rates/bulk', (req, res) => {
  try {
    const { rates } = req.body;
    const result = exchangeRateOps.bulkUpsert(rates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch rates from exchangerate-api.com
app.post('/api/exchange-rates/refresh', async (req, res) => {
  try {
    const settings = settingsOps.getAll();
    const apiKey = settings.exchangeRateApiKey;
    const baseCurrency = settings.baseCurrency || 'EUR';

    if (!apiKey) {
      return res.status(400).json({ error: 'Exchange rate API key not configured. Please add it in settings.' });
    }

    const currencies = currencyOps.getAll();
    const currencyCodes = currencies.map(c => c.code);

    // Fetch rates from exchangerate-api.com
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${errorText}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(data['error-type'] || 'Unknown API error');
    }

    // Store rates for all currencies we track
    const rates = [];
    for (const code of currencyCodes) {
      if (data.conversion_rates[code]) {
        // Store rate from base currency to this currency
        rates.push({
          fromCurrency: baseCurrency,
          toCurrency: code,
          rate: data.conversion_rates[code]
        });
        // Also store inverse rate
        if (code !== baseCurrency) {
          rates.push({
            fromCurrency: code,
            toCurrency: baseCurrency,
            rate: 1 / data.conversion_rates[code]
          });
        }
      }
    }

    exchangeRateOps.bulkUpsert(rates);
    settingsOps.set('lastRateUpdate', new Date().toISOString());

    res.json({
      success: true,
      ratesUpdated: rates.length,
      timestamp: new Date().toISOString(),
      baseCurrency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Settings Routes =====
app.get('/api/settings', (req, res) => {
  try {
    const settings = settingsOps.getAll();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const settings = settingsOps.setMultiple(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const result = settingsOps.set(key, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Currency Routes =====
app.get('/api/currencies', (req, res) => {
  try {
    const currencies = currencyOps.getAll();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/currencies', (req, res) => {
  try {
    const currency = currencyOps.create(req.body);
    res.json(currency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/currencies/:code', (req, res) => {
  try {
    const { code } = req.params;
    const currency = currencyOps.update(code, req.body);
    res.json(currency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/currencies/:code', (req, res) => {
  try {
    const { code } = req.params;
    currencyOps.delete(code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/currencies/:code/set-default', (req, res) => {
  try {
    const { code } = req.params;
    currencyOps.setDefault(code);
    res.json({ success: true, baseCurrency: code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes in production (SPA support)
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
      if (!isProduction) {
        console.log(`Default credentials: ${AUTH_USERNAME} / ${AUTH_PASSWORD}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
