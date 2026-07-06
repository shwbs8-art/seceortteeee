const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild = newState.guild;
    const member = newState.member;
    if (!member) return;

    if (!oldState.channel && newState.channel) {
      await sendLog(guild, 'voice', embeds.success(`**العضو:** ${member.user.tag}\n**الروم:** ${newState.channel}`, '🔊 انضمام لروم صوتي'));
    } else if (oldState.channel && !newState.channel) {
      await sendLog(guild, 'voice', embeds.error(`**العضو:** ${member.user.tag}\n**الروم:** ${oldState.channel}`, '🔇 مغادرة روم صوتي'));
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      await sendLog(guild, 'voice', embeds.info(`**العضو:** ${member.user.tag}\n**من:** ${oldState.channel}\n**إلى:** ${newState.channel}`, '🔀 تنقل صوتي'));
    }
  },
};
