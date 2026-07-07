const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    const guild = role.guild;
    const cfg = guildConfig.get(guild.id);

    const audit = await guild.fetchAuditLogs({ type: 32 /* ROLE_DELETE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    await sendLog(guild, 'security', embeds.error(`**الرتبة:** ${role.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '🗑️ حذف رتبة'));

    if (cfg.protection.antiRoleDelete && executor) {
      await trackDangerousAction(role.client, guild, executor.id, 'حذف رتبة', 'roleDelete');
    }
  },
};
