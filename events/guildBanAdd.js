const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

/**
 * حدث جديد: يراقب عمليات الحظر (Ban) بالسيرفر، ويسجلها باللوق، ويتحقق من
 * Anti-Nuke: إذا قام نفس الشخص (حتى لو أدمن/صاحب رتبة عالية) بحظر عدد أعضاء
 * أكبر من الحد المسموح (القابل للتعديل عبر /حدود_الحماية) خلال فترة قصيرة،
 * يتم تصفير جميع رتبه تلقائياً.
 */
module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const guild = ban.guild;
    const cfg = guildConfig.get(guild.id);

    const audit = await guild.fetchAuditLogs({ type: 22 /* MEMBER_BAN_ADD */, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executor = entry?.executor;

    await sendLog(
      guild,
      'security',
      embeds.error(`**العضو المحظور:** ${ban.user.tag} (${ban.user.id})\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '🔨 حظر عضو')
    );

    // نتجاهل الأحداث القديمة جداً بالـ Audit Log لتفادي false positives
    if (executor && entry && Date.now() - entry.createdTimestamp < 15000) {
      await trackDangerousAction(guild.client, guild, executor.id, 'حظر أعضاء متكرر', 'ban');
    }
  },
};
