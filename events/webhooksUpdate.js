const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'webhooksUpdate',
  async execute(channel) {
    const guild = channel.guild;
    const cfg = guildConfig.get(guild.id);
    if (!cfg.protection.antiWebhook) return;

    const audit = await guild.fetchAuditLogs({ type: 50 /* WEBHOOK_CREATE */, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executor = entry?.executor;

    // فقط إذا كان الويبهوك حديث الإنشاء (خلال آخر 10 ثواني) لتفادي false positives من رسائل الويبهوكات العادية
    if (entry && Date.now() - entry.createdTimestamp < 10000) {
      await sendLog(guild, 'security', embeds.warning(`**الروم:** ${channel}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '🪝 إنشاء Webhook'));

      const { isOwner } = require('../utils/permissions');
      const execMember = executor ? await guild.members.fetch(executor.id).catch(() => null) : null;
      if (executor && (!execMember || !isOwner(execMember))) {
        await trackDangerousAction(channel.client, guild, executor.id, 'إنشاء Webhook', 'webhook');
      }
    }
  },
};
