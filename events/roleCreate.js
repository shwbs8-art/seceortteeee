const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    const guild = role.guild;
    const cfg = guildConfig.get(guild.id);

    const audit = await guild.fetchAuditLogs({ type: 30 /* ROLE_CREATE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    await sendLog(guild, 'security', embeds.success(`**الرتبة:** ${role.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '➕ إنشاء رتبة'));

    if (cfg.protection.antiRoleCreate && executor) {
      await trackDangerousAction(role.client, guild, executor.id, 'إنشاء رتبة', 'roleCreate');
    }
  },
};
