const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    if (!channel.guild) return;
    const guild = channel.guild;
    const cfg = guildConfig.get(guild.id);

    const audit = await guild.fetchAuditLogs({ type: 10 /* CHANNEL_CREATE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    await sendLog(guild, 'security', embeds.success(`**الروم:** ${channel.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '➕ إنشاء روم'));

    if (cfg.protection.antiChannelCreate && executor) {
      await trackDangerousAction(channel.client, guild, executor.id, 'إنشاء روم', 'channelCreate');
    }
  },
};
