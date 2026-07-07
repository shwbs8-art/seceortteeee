const guildConfig = require('../database/guildConfig');
const voiceSticky = require('../systems/voiceSticky');

/**
 * حدث جديد منفصل تماماً (لا يعدّل events/ready.js الموجود مسبقاً — نفس اسم الحدث
 * clientReady يمكن ربطه أكثر من مرة عبر client.once، وكلاهما سيُنفَّذ بشكل مستقل).
 *
 * عند تشغيل البوت من جديد (تحديث/كراش/PM2)، يعيد الاتصال تلقائياً بأي روم صوتي
 * كان مفعّلاً عليه "الوضع الثابت" قبل إعادة التشغيل، حتى لا يضطر الأونر لتكرار
 * الأمر يدوياً في كل مرة.
 */
module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    for (const [, guild] of client.guilds.cache) {
      const cfg = guildConfig.get(guild.id);
      if (!cfg.stickyVoiceChannelId) continue;

      const channel = await guild.channels.fetch(cfg.stickyVoiceChannelId).catch(() => null);
      if (!channel) continue;

      await voiceSticky.joinSticky(client, channel).catch((err) => {
        console.error(`[VoiceRejoin] فشل إعادة الاتصال بروم السيرفر ${guild.id}:`, err);
      });
    }
  },
};
