import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use RAILWAY_VOLUME_MOUNT_PATH for persistent storage on Railway
// Falls back to local directory for development
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const dbPath = join(dataDir, 'liquidity.db');

// Ensure data directory exists (for Railway volume)
if (process.env.RAILWAY_VOLUME_MOUNT_PATH && !existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log(`Database path: ${dbPath}`);

let db = null;

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// Initialize database
export async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'payment',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      due_date TEXT NOT NULL,
      company_id TEXT,
      payee TEXT NOT NULL,
      reference TEXT,
      category_id TEXT,
      status TEXT NOT NULL DEFAULT 'to_pay',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create exchange_rates table
  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_currency, to_currency)
    )
  `);

  // Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create currencies table for custom currencies
  db.run(`
    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create recurring_templates table
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_templates (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'payment',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      occurrences_count INTEGER,
      company_id TEXT,
      payee TEXT NOT NULL,
      reference TEXT,
      category_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_generated_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add currency column to transactions if not exists (migration)
  try {
    db.run('ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT \'EUR\'');
    console.log('Added currency column to transactions');
  } catch (e) {
    // Column already exists
  }

  // Add recurring-related columns to transactions (migration)
  try {
    db.run('ALTER TABLE transactions ADD COLUMN recurring_template_id TEXT');
    console.log('Added recurring_template_id column to transactions');
  } catch (e) {
    // Column already exists
  }

  try {
    db.run('ALTER TABLE transactions ADD COLUMN is_recurring INTEGER DEFAULT 0');
    console.log('Added is_recurring column to transactions');
  } catch (e) {
    // Column already exists
  }

  try {
    db.run('ALTER TABLE transactions ADD COLUMN is_exception INTEGER DEFAULT 0');
    console.log('Added is_exception column to transactions');
  } catch (e) {
    // Column already exists
  }

  try {
    db.run('ALTER TABLE transactions ADD COLUMN occurrence_date TEXT');
    console.log('Added occurrence_date column to transactions');
  } catch (e) {
    // Column already exists
  }

  // Insert default categories if none exist
  const result = db.exec('SELECT COUNT(*) as count FROM categories');
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    const defaultCategories = [
      'Investment',
      'Capital Call',
      'Distribution',
      'Secondary',
      'Internal Costs',
      'External Costs',
      'Interest',
      'Non Strategic',
      'Tax',
      'EIF',
      'Loans',
    ];

    const stmt = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
    for (const name of defaultCategories) {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      stmt.run([id, name]);
    }
    stmt.free();
    console.log('Default categories created');
  }

  // Insert default currencies if none exist
  const currencyResult = db.exec('SELECT COUNT(*) as count FROM currencies');
  const currencyCount = currencyResult.length > 0 ? currencyResult[0].values[0][0] : 0;

  if (currencyCount === 0) {
    const defaultCurrencies = [
      { code: 'EUR', name: 'Euro', symbol: '€', isDefault: 1 },
      { code: 'USD', name: 'US Dollar', symbol: '$', isDefault: 0 },
      { code: 'GBP', name: 'British Pound', symbol: '£', isDefault: 0 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', isDefault: 0 },
    ];

    const currencyStmt = db.prepare('INSERT INTO currencies (code, name, symbol, is_default) VALUES (?, ?, ?, ?)');
    for (const currency of defaultCurrencies) {
      currencyStmt.run([currency.code, currency.name, currency.symbol, currency.isDefault]);
    }
    currencyStmt.free();
    console.log('Default currencies created');
  }

  // Insert default settings if none exist
  const settingsResult = db.exec('SELECT COUNT(*) as count FROM settings');
  const settingsCount = settingsResult.length > 0 ? settingsResult[0].values[0][0] : 0;

  if (settingsCount === 0) {
    const defaultSettings = [
      { key: 'baseCurrency', value: 'EUR' },
      { key: 'exchangeRateApiKey', value: '' },
      { key: 'lastRateUpdate', value: '' },
    ];

    const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const setting of defaultSettings) {
      settingsStmt.run([setting.key, setting.value]);
    }
    settingsStmt.free();
    console.log('Default settings created');
  }

  saveDatabase();
  console.log('Database initialized successfully');
}

// Helper to convert result to array of objects
function resultToObjects(result) {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  const values = result[0].values;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

// Company operations
export const companyOps = {
  getAll: () => {
    const result = db.exec('SELECT id, name FROM companies ORDER BY name');
    return resultToObjects(result);
  },

  create: (id, name) => {
    db.run('INSERT INTO companies (id, name) VALUES (?, ?)', [id, name]);
    saveDatabase();
    return { id, name };
  },

  update: (id, name) => {
    db.run('UPDATE companies SET name = ? WHERE id = ?', [name, id]);
    saveDatabase();
    return { id, name };
  },

  delete: (id) => {
    db.run('DELETE FROM companies WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  },
};

// Category operations
export const categoryOps = {
  getAll: () => {
    const result = db.exec('SELECT id, name FROM categories ORDER BY name');
    return resultToObjects(result);
  },

  create: (id, name) => {
    db.run('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    saveDatabase();
    return { id, name };
  },

  update: (id, name) => {
    db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    saveDatabase();
    return { id, name };
  },

  delete: (id) => {
    db.run('DELETE FROM categories WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  },
};

// Transaction operations
export const transactionOps = {
  getAll: () => {
    const result = db.exec(`
      SELECT id, type, amount, currency, due_date as dueDate, company_id as companyId,
             payee, reference, category_id as categoryId, status,
             recurring_template_id as recurringTemplateId, is_recurring as isRecurring,
             is_exception as isException, occurrence_date as occurrenceDate
      FROM transactions
      ORDER BY due_date
    `);
    return resultToObjects(result);
  },

  create: (transaction) => {
    db.run(`
      INSERT INTO transactions (id, type, amount, currency, due_date, company_id, payee, reference, category_id, status,
                                recurring_template_id, is_recurring, is_exception, occurrence_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transaction.id,
      transaction.type || 'payment',
      transaction.amount,
      transaction.currency || 'EUR',
      transaction.dueDate,
      transaction.companyId || null,
      transaction.payee,
      transaction.reference || null,
      transaction.categoryId || null,
      transaction.status || 'to_pay',
      transaction.recurringTemplateId || null,
      transaction.isRecurring ? 1 : 0,
      transaction.isException ? 1 : 0,
      transaction.occurrenceDate || null
    ]);
    saveDatabase();
    return transaction;
  },

  update: (transaction) => {
    db.run(`
      UPDATE transactions
      SET type = ?, amount = ?, currency = ?, due_date = ?, company_id = ?, payee = ?,
          reference = ?, category_id = ?, status = ?, is_exception = ?
      WHERE id = ?
    `, [
      transaction.type || 'payment',
      transaction.amount,
      transaction.currency || 'EUR',
      transaction.dueDate,
      transaction.companyId || null,
      transaction.payee,
      transaction.reference || null,
      transaction.categoryId || null,
      transaction.status || 'to_pay',
      transaction.isException ? 1 : 0,
      transaction.id
    ]);
    saveDatabase();
    return transaction;
  },

  delete: (id) => {
    db.run('DELETE FROM transactions WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  },

  getByTemplateId: (templateId) => {
    const result = db.exec(`
      SELECT id, type, amount, currency, due_date as dueDate, company_id as companyId,
             payee, reference, category_id as categoryId, status,
             recurring_template_id as recurringTemplateId, is_recurring as isRecurring,
             is_exception as isException, occurrence_date as occurrenceDate
      FROM transactions
      WHERE recurring_template_id = ?
      ORDER BY due_date
    `, [templateId]);
    return resultToObjects(result);
  },

  deleteUnpaidByTemplateId: (templateId) => {
    db.run(`DELETE FROM transactions WHERE recurring_template_id = ? AND status != 'paid'`, [templateId]);
    saveDatabase();
    return { success: true };
  },

  deleteFutureByTemplateId: (templateId, fromDate) => {
    db.run(`DELETE FROM transactions WHERE recurring_template_id = ? AND status != 'paid' AND due_date >= ?`, [templateId, fromDate]);
    saveDatabase();
    return { success: true };
  },
};

// Exchange rate operations
export const exchangeRateOps = {
  getAll: () => {
    const result = db.exec(`
      SELECT id, from_currency as fromCurrency, to_currency as toCurrency, rate, updated_at as updatedAt
      FROM exchange_rates
      ORDER BY from_currency, to_currency
    `);
    return resultToObjects(result);
  },

  getRate: (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return 1;
    const result = db.exec(`
      SELECT rate FROM exchange_rates
      WHERE from_currency = ? AND to_currency = ?
    `, [fromCurrency, toCurrency]);
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0];
    }
    return null;
  },

  upsert: (fromCurrency, toCurrency, rate) => {
    const id = `${fromCurrency}_${toCurrency}`;
    db.run(`
      INSERT INTO exchange_rates (id, from_currency, to_currency, rate, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(from_currency, to_currency) DO UPDATE SET rate = ?, updated_at = datetime('now')
    `, [id, fromCurrency, toCurrency, rate, rate]);
    saveDatabase();
    return { id, fromCurrency, toCurrency, rate };
  },

  bulkUpsert: (rates) => {
    for (const { fromCurrency, toCurrency, rate } of rates) {
      exchangeRateOps.upsert(fromCurrency, toCurrency, rate);
    }
    return { success: true, count: rates.length };
  },

  delete: (fromCurrency, toCurrency) => {
    db.run('DELETE FROM exchange_rates WHERE from_currency = ? AND to_currency = ?', [fromCurrency, toCurrency]);
    saveDatabase();
    return { success: true };
  },
};

// Settings operations
export const settingsOps = {
  getAll: () => {
    const result = db.exec('SELECT key, value, updated_at as updatedAt FROM settings');
    const rows = resultToObjects(result);
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  },

  get: (key) => {
    const result = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0];
    }
    return null;
  },

  set: (key, value) => {
    db.run(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
    `, [key, value, value]);
    saveDatabase();
    return { key, value };
  },

  setMultiple: (settings) => {
    for (const [key, value] of Object.entries(settings)) {
      settingsOps.set(key, value);
    }
    return settings;
  },
};

// Recurring template operations
export const recurringTemplateOps = {
  getAll: () => {
    const result = db.exec(`
      SELECT id, type, amount, currency, frequency, start_date as startDate, end_date as endDate,
             occurrences_count as occurrencesCount, company_id as companyId, payee, reference,
             category_id as categoryId, status, last_generated_date as lastGeneratedDate, created_at as createdAt
      FROM recurring_templates
      ORDER BY created_at DESC
    `);
    return resultToObjects(result);
  },

  getById: (id) => {
    const result = db.exec(`
      SELECT id, type, amount, currency, frequency, start_date as startDate, end_date as endDate,
             occurrences_count as occurrencesCount, company_id as companyId, payee, reference,
             category_id as categoryId, status, last_generated_date as lastGeneratedDate, created_at as createdAt
      FROM recurring_templates
      WHERE id = ?
    `, [id]);
    const rows = resultToObjects(result);
    return rows.length > 0 ? rows[0] : null;
  },

  create: (template) => {
    db.run(`
      INSERT INTO recurring_templates (id, type, amount, currency, frequency, start_date, end_date,
                                       occurrences_count, company_id, payee, reference, category_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template.id,
      template.type || 'payment',
      template.amount,
      template.currency || 'EUR',
      template.frequency,
      template.startDate,
      template.endDate || null,
      template.occurrencesCount || null,
      template.companyId || null,
      template.payee,
      template.reference || null,
      template.categoryId || null,
      template.status || 'active'
    ]);
    saveDatabase();
    return template;
  },

  update: (id, data) => {
    db.run(`
      UPDATE recurring_templates
      SET type = ?, amount = ?, currency = ?, frequency = ?, start_date = ?, end_date = ?,
          occurrences_count = ?, company_id = ?, payee = ?, reference = ?, category_id = ?, status = ?
      WHERE id = ?
    `, [
      data.type || 'payment',
      data.amount,
      data.currency || 'EUR',
      data.frequency,
      data.startDate,
      data.endDate || null,
      data.occurrencesCount || null,
      data.companyId || null,
      data.payee,
      data.reference || null,
      data.categoryId || null,
      data.status || 'active',
      id
    ]);
    saveDatabase();
    return { id, ...data };
  },

  updateLastGenerated: (id, date) => {
    db.run(`UPDATE recurring_templates SET last_generated_date = ? WHERE id = ?`, [date, id]);
    saveDatabase();
    return { success: true };
  },

  delete: (id) => {
    db.run('DELETE FROM recurring_templates WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  },

  pause: (id) => {
    db.run(`UPDATE recurring_templates SET status = 'paused' WHERE id = ?`, [id]);
    saveDatabase();
    return { success: true };
  },

  resume: (id) => {
    db.run(`UPDATE recurring_templates SET status = 'active' WHERE id = ?`, [id]);
    saveDatabase();
    return { success: true };
  },
};

// Currency operations
export const currencyOps = {
  getAll: () => {
    const result = db.exec(`
      SELECT code, name, symbol, is_default as isDefault
      FROM currencies
      ORDER BY is_default DESC, code
    `);
    return resultToObjects(result);
  },

  create: (currency) => {
    db.run(`
      INSERT INTO currencies (code, name, symbol, is_default)
      VALUES (?, ?, ?, ?)
    `, [currency.code, currency.name, currency.symbol || currency.code, currency.isDefault || 0]);
    saveDatabase();
    return currency;
  },

  update: (code, data) => {
    db.run(`
      UPDATE currencies SET name = ?, symbol = ?, is_default = ? WHERE code = ?
    `, [data.name, data.symbol, data.isDefault || 0, code]);
    saveDatabase();
    return { code, ...data };
  },

  delete: (code) => {
    db.run('DELETE FROM currencies WHERE code = ?', [code]);
    saveDatabase();
    return { success: true };
  },

  setDefault: (code) => {
    db.run('UPDATE currencies SET is_default = 0');
    db.run('UPDATE currencies SET is_default = 1 WHERE code = ?', [code]);
    settingsOps.set('baseCurrency', code);
    saveDatabase();
    return { success: true };
  },
};

export default db;
