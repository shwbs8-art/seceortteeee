const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('ضبط وضع البطء (Slowmode) للروم الحالي')
    .addIntegerOption((o) => o.setName('الثواني').setDescription('عدد الثواني (0 لإيقافه، حتى 21600)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const seconds = interaction.options.getInteger('الثواني');
    await interaction.channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      await interaction.reply({ embeds: [embeds.success('تم إيقاف وضع البطء في هذا الروم.')] });
    } else {
      await interaction.reply({ embeds: [embeds.success(`تم ضبط وضع البطء على **${seconds}** ثانية في هذا الروم.`)] });
    }
  },
};
