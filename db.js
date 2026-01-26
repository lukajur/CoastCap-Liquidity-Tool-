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
      due_date TEXT NOT NULL,
      company_id TEXT,
      payee TEXT NOT NULL,
      reference TEXT,
      category_id TEXT,
      status TEXT NOT NULL DEFAULT 'to_pay',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      SELECT id, type, amount, due_date as dueDate, company_id as companyId,
             payee, reference, category_id as categoryId, status
      FROM transactions
      ORDER BY due_date
    `);
    return resultToObjects(result);
  },

  create: (transaction) => {
    db.run(`
      INSERT INTO transactions (id, type, amount, due_date, company_id, payee, reference, category_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transaction.id,
      transaction.type || 'payment',
      transaction.amount,
      transaction.dueDate,
      transaction.companyId || null,
      transaction.payee,
      transaction.reference || null,
      transaction.categoryId || null,
      transaction.status || 'to_pay'
    ]);
    saveDatabase();
    return transaction;
  },

  update: (transaction) => {
    db.run(`
      UPDATE transactions
      SET type = ?, amount = ?, due_date = ?, company_id = ?, payee = ?,
          reference = ?, category_id = ?, status = ?
      WHERE id = ?
    `, [
      transaction.type || 'payment',
      transaction.amount,
      transaction.dueDate,
      transaction.companyId || null,
      transaction.payee,
      transaction.reference || null,
      transaction.categoryId || null,
      transaction.status || 'to_pay',
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
};

export default db;
