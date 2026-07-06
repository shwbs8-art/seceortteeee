const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اعادة_تشغيل')
    .setDescription('إعادة تشغيل البوت بالكامل (يتطلب مدير عمليات مثل PM2 لإعادة التشغيل التلقائي)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    await interaction.reply({ embeds: [embeds.warning('جاري إعادة تشغيل البوت... قد يستغرق بضع ثوانٍ.')] });
    console.log(`[Restart] تمت طلب إعادة التشغيل بواسطة ${interaction.user.tag}`);

    setTimeout(() => process.exit(0), 1000);
  },
};
