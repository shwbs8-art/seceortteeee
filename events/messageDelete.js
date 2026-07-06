const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild || !message.author || message.author.bot) return;

    const embed = embeds
      .base('🗑️ تم حذف رسالة', message.content ? `\`\`\`${message.content.slice(0, 900)}\`\`\`` : '*(بدون محتوى نصي — قد تكون صورة أو ملف)*')
      .addFields(
        { name: 'العضو', value: `${message.author.tag}`, inline: true },
        { name: 'الروم', value: `${message.channel}`, inline: true }
      );

    await sendLog(message.guild, 'chat', embed);
  },
};
