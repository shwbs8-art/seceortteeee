const { ActivityType } = require('discord.js');
const ticketHandler = require('../handlers/ticketHandler');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ تم تسجيل الدخول باسم ${client.user.tag}`);
    console.log(`🏠 عدد السيرفرات: ${client.guilds.cache.size}`);

    client.user.setPresence({
      activities: [{ name: 'إدارة وحماية Iraq Babylon 🇮🇶', type: ActivityType.Watching }],
      status: 'online',
    });

    // التأكد من وجود رسالة لوحة التذاكر بكل سيرفر، وإعادة إنشائها إذا انحذفت
    for (const [, guild] of client.guilds.cache) {
      await ticketHandler.ensureTicketPanel(guild).catch(() => null);
    }

    // تهيئة كاش الدعوات (Invite Tracker)
    for (const [, guild] of client.guilds.cache) {
      const invites = await guild.invites.fetch().catch(() => null);
      if (invites) {
        client.inviteCache.set(guild.id, new Map(invites.map((inv) => [inv.code, inv.uses])));
      }
    }

    // فحص دوري كل 10 دقائق للتأكد من استمرار وجود رسالة لوحة التذاكر
    setInterval(() => {
      for (const [, guild] of client.guilds.cache) {
        ticketHandler.ensureTicketPanel(guild).catch(() => null);
      }
    }, 10 * 60 * 1000);
  },
};
