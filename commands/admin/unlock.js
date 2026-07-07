const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('فتح_الروم')
    .setDescription('فتح الروم الحالي بعد قفله')
    .addChannelOption((o) => o.setName('الروم').setDescription('الروم المراد فتحه (افتراضي: الحالي)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });

    await interaction.reply({ embeds: [embeds.success(`🔓 تم فتح الروم ${channel} بنجاح.`)] });
  },
};
