const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

if (!config.token || !config.clientId) {
  console.error('❌ تأكد من ضبط TOKEN و CLIENT_ID في ملف .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
});

// تخزينات مؤقتة تستخدمها أنظمة الحماية (لا تُحفظ بقاعدة البيانات، تُعاد بكل تشغيل)
client.spamCache = new Collection(); // لتتبع الرسائل المتكررة (Anti Spam)
client.raidCache = new Collection(); // لتتبع الانضمامات السريعة (Anti Raid / Mass Join)
client.raidLockUntil = new Collection(); // وضع الحماية من الريد: guildId -> وقت انتهاء القفل
client.nukeCache = new Collection(); // لتتبع الأفعال الخطيرة (Anti Nuke)
client.inviteCache = new Collection(); // لتتبع الدعوات (Invite Tracker)
client.ticketCooldowns = new Collection();

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
});

client.login(config.token);

module.exports = client;
