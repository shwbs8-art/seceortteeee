const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;
    const guild = channel.guild;
    const cfg = guildConfig.get(guild.id);

    const audit = await guild.fetchAuditLogs({ type: 12 /* CHANNEL_DELETE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    await sendLog(guild, 'security', embeds.error(`**الروم:** ${channel.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '🗑️ حذف روم'));

    if (cfg.protection.antiChannelDelete && executor) {
      await trackDangerousAction(channel.client, guild, executor.id, 'حذف روم', 'channelDelete');
    }
  },
};
