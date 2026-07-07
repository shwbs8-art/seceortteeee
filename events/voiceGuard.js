const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const voiceSticky = require('../systems/voiceSticky');

/**
 * حدث جديد منفصل تماماً (لا يعدّل events/voiceStateUpdate.js الموجود مسبقاً):
 * يراقب فقط تغييرات حالة البوت الصوتية الخاصة به هو نفسه، وإذا كان الوضع الصوتي
 * الثابت مفعّلاً بهذا السيرفر (عبر /دخول_صوتي) وتم فصل البوت أو نقله من الروم
 * الثابت (بواسطة أي أحد)، يحاول البوت إعادة الاتصال بنفس الروم تلقائياً.
 */
module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const client = newState.client;
    const guild = newState.guild;
    if (!client?.user) return;

    const botId = client.user.id;
    if (oldState.id !== botId && newState.id !== botId) return; // ليس تغييراً يخص البوت نفسه

    if (!voiceSticky.isSticky(client, guild.id)) return; // الوضع الثابت غير مفعّل بهذا السيرفر

    const stickyChannelId = voiceSticky.getStickyChannelId(client, guild.id);
    if (newState.channelId === stickyChannelId) return; // كل شيء طبيعي، البوت بالروم الصحيح

    // تم إخراج/نقل البوت من الروم الثابت — نحاول إعادة الاتصال فوراً
    setTimeout(async () => {
      try {
        const channel = await guild.channels.fetch(stickyChannelId).catch(() => null);
        if (!channel) return;

        await voiceSticky.joinSticky(client, channel);

        await sendLog(
          guild,
          'security',
          embeds.warning(`تمت محاولة إخراج/نقل البوت من الروم الصوتي **${channel.name}**، تم إعادة الاتصال به تلقائياً.`, '🔊 حماية الروم الصوتي الثابت')
        );
      } catch (err) {
        console.error('[VoiceGuard] فشل إعادة الاتصال بالروم الصوتي:', err);
      }
    }, 1500);
  },
};
