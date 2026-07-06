const db = require('./db');
const { protectionDefaults, antiNuke } = require('../config');

function defaultConfig() {
  return {
    logsChannelId: null,
    modLogsChannelId: null,
    chatLogsChannelId: null,
    voiceLogsChannelId: null,
    securityLogsChannelId: null,
    errorLogsChannelId: null,
    ticketsChannelId: null,
    ticketsCategoryId: null,
    ticketLogsChannelId: null,
    joinLeaveChannelId: null,
    adminRoleId: null,
    autoRoleId: null,
    ticketPanelMessageId: null,
    ticketCounter: 0,
    protection: { ...protectionDefaults },
    // حدود Anti-Nuke قابلة للتحكم بها من الأونر لكل سيرفر على حدة (أمر /حدود_الحماية)
    antiNukeLimits: { ...antiNuke.defaultLimits, intervalMs: antiNuke.intervalMs },
  };
}

const guildConfig = {
  get(guildId) {
    return db.get('config', guildId, defaultConfig());
  },

  set(guildId, partial) {
    return db.update('config', guildId, (current) => ({
      ...defaultConfig(),
      ...current,
      ...partial,
    }));
  },

  setProtection(guildId, key, value) {
    return db.update('config', guildId, (current) => {
      const merged = { ...defaultConfig(), ...current };
      merged.protection = { ...merged.protection, [key]: value };
      return merged;
    });
  },

  /**
   * تعديل حد فعل خطير معين (roleDelete, roleCreate, channelDelete, ban, kick, timeout ...)
   * أو تعديل الفترة الزمنية intervalMs (بالمللي ثانية) بنفس هذه الدالة عبر تمرير المفتاح 'intervalMs'.
   */
  setAntiNukeLimit(guildId, key, value) {
    return db.update('config', guildId, (current) => {
      const merged = { ...defaultConfig(), ...current };
      merged.antiNukeLimits = { ...defaultConfig().antiNukeLimits, ...merged.antiNukeLimits, [key]: value };
      return merged;
    });
  },

  getAntiNukeLimit(guildId, key) {
    const cfg = guildConfig.get(guildId);
    const limits = { ...defaultConfig().antiNukeLimits, ...(cfg.antiNukeLimits || {}) };
    return limits[key];
  },

  getLogChannel(guildId, type) {
    const cfg = guildConfig.get(guildId);
    const map = {
      general: cfg.logsChannelId,
      mod: cfg.modLogsChannelId || cfg.logsChannelId,
      chat: cfg.chatLogsChannelId || cfg.logsChannelId,
      voice: cfg.voiceLogsChannelId || cfg.logsChannelId,
      security: cfg.securityLogsChannelId || cfg.logsChannelId,
      error: cfg.errorLogsChannelId || cfg.logsChannelId,
      ticket: cfg.ticketLogsChannelId || cfg.logsChannelId,
      joinLeave: cfg.joinLeaveChannelId || cfg.logsChannelId,
    };
    return map[type] || null;
  },
};

module.exports = guildConfig;
