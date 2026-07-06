const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('حذف_الرسائل')
    .setDescription('حذف عدد من الرسائل في الروم الحالي')
    .addIntegerOption((o) => o.setName('العدد').setDescription('عدد الرسائل (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('العضو').setDescription('حذف رسائل عضو محدد فقط').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const amount = interaction.options.getInteger('العدد');
    const target = interaction.options.getUser('العضو');

    let messages = await interaction.channel.messages.fetch({ limit: amount });
    if (target) messages = messages.filter((m) => m.author.id === target.id);

    const deleted = await interaction.channel.bulkDelete(messages, true).catch(() => null);

    if (!deleted) {
      return interaction.editReply({ embeds: [embeds.error('فشل حذف الرسائل (قد تكون أقدم من 14 يوم).')] });
    }

    await interaction.editReply({ embeds: [embeds.success(`تم حذف **${deleted.size}** رسالة بنجاح.`)] });

    await sendLog(
      interaction.guild,
      'mod',
      embeds.info(`**الروم:** ${interaction.channel}\n**العدد:** ${deleted.size}\n**بواسطة:** ${interaction.user.tag}${target ? `\n**مستهدف:** ${target.tag}` : ''}`, '🧹 حذف رسائل')
    );
  },
};
