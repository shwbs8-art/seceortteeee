const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
  users: 'users.json',
  tickets: 'tickets.json',
  warns: 'warns.json',
  config: 'config.json',
  logs: 'logs.json',
  messageIds: 'messageIds.json',
  backups: 'backups.json',
};

function filePath(name) {
  return path.join(DATA_DIR, FILES[name]);
}

function readTable(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error(`[DB] خطأ بقراءة ${name}:`, err);
    return {};
  }
}

function writeTable(name, data) {
  const fp = filePath(name);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

/**
 * واجهة بسيطة للتعامل مع الجداول (تشبه key-value scoped بالسيرفر)
 */
const db = {
  get(table, guildId, defaultValue = {}) {
    const data = readTable(table);
    if (!data[guildId]) {
      data[guildId] = defaultValue;
      writeTable(table, data);
    }
    return data[guildId];
  },

  set(table, guildId, value) {
    const data = readTable(table);
    data[guildId] = value;
    writeTable(table, data);
    return value;
  },

  update(table, guildId, updater) {
    const data = readTable(table);
    const current = data[guildId] || {};
    data[guildId] = updater(current) || current;
    writeTable(table, data);
    return data[guildId];
  },

  all(table) {
    return readTable(table);
  },

  raw: { readTable, writeTable, filePath },
};

module.exports = db;
