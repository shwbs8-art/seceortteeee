const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || !newMessage.author || newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = embeds
      .base('✏️ تم تعديل رسالة')
      .addFields(
        { name: 'العضو', value: `${newMessage.author.tag}`, inline: true },
        { name: 'الروم', value: `${newMessage.channel}`, inline: true },
        { name: 'قبل', value: `\`\`\`${(oldMessage.content || '—').slice(0, 500)}\`\`\`` },
        { name: 'بعد', value: `\`\`\`${(newMessage.content || '—').slice(0, 500)}\`\`\`` }
      );

    await sendLog(newMessage.guild, 'chat', embed);
  },
};
