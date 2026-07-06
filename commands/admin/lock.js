const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('قفل_الروم')
    .setDescription('قفل الروم الحالي بحيث لا يستطيع الأعضاء الكتابة')
    .addChannelOption((o) => o.setName('الروم').setDescription('الروم المراد قفله (افتراضي: الحالي)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم') || interaction.channel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

    await interaction.reply({ embeds: [embeds.success(`🔒 تم قفل الروم ${channel} بنجاح.`)] });
  },
};
