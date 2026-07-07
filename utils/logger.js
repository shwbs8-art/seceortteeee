const guildConfig = require('../database/guildConfig');

/**
 * يرسل Embed للوق معين حسب النوع (mod, chat, voice, security, error, ticket, joinLeave, general)
 * type: نوع اللوق المستهدف
 */
async function sendLog(guild, type, embed) {
  try {
    const channelId = guildConfig.getLogChannel(guild.id, type);
    if (!channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    await channel.send({ embeds: [embed] }).catch(() => null);
  } catch (err) {
    console.error('[Logger] فشل إرسال اللوق:', err);
  }
}

module.exports = { sendLog };
