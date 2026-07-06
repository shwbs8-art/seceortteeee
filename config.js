require('dotenv').config();

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ownerRoleId: process.env.OWNER_ROLE_ID,
  ownerUserId: process.env.OWNER_USER_ID,
  devMode: process.env.DEV_MODE === 'true',

  colors: {
    primary: 0x2b2d31,
    success: 0x57f287,
    error: 0xed4245,
    warning: 0xfee75c,
    info: 0x5865f2,
  },

  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    ticket: '🎫',
    shield: '🛡️',
    lock: '🔒',
    unlock: '🔓',
  },

  // إعدادات الحماية الافتراضية (يمكن تغييرها من لوحة الإعدادات)
  protectionDefaults: {
    antiRaid: true,
    antiSpam: true,
    antiLinks: false,
    antiDiscordInvite: true,
    antiEveryone: true,
    antiHere: true,
    antiMentionSpam: true,
    antiWebhook: true,
    antiBotAdd: true,
    antiMassJoin: true,
    antiChannelDelete: true,
    antiChannelCreate: false,
    antiChannelUpdate: false,
    antiRoleDelete: true,
    antiRoleCreate: false,
    antiRoleUpdate: false,
    antiPermissionAbuse: true,
    antiNicknameSpam: false,
    newAccountProtection: true,
    minAccountAgeDays: 3,
  },

  spam: {
    maxMessages: 5, // عدد الرسائل المتكررة قبل اعتبارها سبام
    intervalMs: 5000, // خلال كم مللي ثانية
    muteMinutes: 10, // (احتياطي/قديم)
    // === نظام Anti-Spam المرحلي ===
    // المرحلة 1: عند وصول العضو لـ maxMessages رسالة خلال intervalMs => تحذير فقط (بدون حذف/كتم)
    // المرحلة 2: إذا استمر بالسبام بعد التحذير => حذف رسائله المتكررة + تايم أوت
    warnResetMs: 30000, // مدة صلاحية التحذير قبل إعادة ضبط حالته من الصفر
    escalateTimeoutMinutes: 60, // مدة التايم أوت عند تكرار السبام بعد التحذير (ساعة كاملة)
    escalateDeleteLimit: 25, // أقصى عدد رسائل تُفحص بالروم لحذف رسائل العضو المخالف عند التصعيد
  },

  mentionSpam: {
    maxMentions: 5,
  },

  antiNuke: {
    maxActions: 3, // القيمة الافتراضية العامة (احتياطية إذا لم يحدد الأونر قيمة خاصة)
    intervalMs: 10000, // خلال كم مللي ثانية تُحتسب الأفعال
    punishment: 'stripRoles', // العقوبة الافتراضية: تصفير كل رتب المخالف بدل الباند/الكيك
    // حدود افتراضية لكل نوع فعل خطير على حدة (قابلة للتعديل لكل سيرفر عبر أمر /حدود_الحماية)
    defaultLimits: {
      roleDelete: 3,
      roleCreate: 3,
      roleUpdate: 3,
      channelDelete: 3,
      channelCreate: 3,
      channelUpdate: 5,
      webhook: 3,
      permissionAbuse: 2,
      ban: 3,
      kick: 3,
      timeout: 5,
    },
  },

  raid: {
    threshold: 8, // عدد الانضمامات
    windowMs: 10000, // خلال كم مللي ثانية تُعتبر ريد
    lockdownMs: 60000, // مدة "وضع الحماية من الريد": أي عضو ينضم خلالها يُطرد تلقائياً ولا يحصل على الرتبة التلقائية
  },
};
