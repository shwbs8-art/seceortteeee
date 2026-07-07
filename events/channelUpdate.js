const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    if (!newChannel.guild) return;
    const guild = newChannel.guild;
    const cfg = guildConfig.get(guild.id);

    if (oldChannel.name === newChannel.name) return; // نتجاهل تغييرات بسيطة أخرى لتقليل الضجيج

    const audit = await guild.fetchAuditLogs({ type: 11 /* CHANNEL_UPDATE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    await sendLog(
      guild,
      'security',
      embeds.info(`**قبل:** ${oldChannel.name}\n**بعد:** ${newChannel.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '✏️ تعديل روم')
    );

    if (cfg.protection.antiChannelUpdate && executor) {
      await trackDangerousAction(newChannel.client, guild, executor.id, 'تعديل روم', 'channelUpdate');
    }
  },
};
