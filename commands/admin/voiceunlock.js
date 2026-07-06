const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('فتح_الصوت')
    .setDescription('فتح روم صوتي بعد قفله ليستطيع الأعضاء الدخول إليه من جديد')
    .addChannelOption((o) =>
      o
        .setName('الروم_الصوتي')
        .setDescription('الروم الصوتي المراد فتحه (افتراضي: الروم الذي أنت متواجد فيه حالياً)')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم_الصوتي') || interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply({
        embeds: [embeds.error('يجب تحديد روم صوتي، أو تكون متواجداً بأحدها لاستخدام هذا الأمر بدون تحديد.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: null });

    await interaction.reply({ embeds: [embeds.success(`🔓 تم فتح الروم الصوتي **${channel.name}** بنجاح.`)] });

    await sendLog(
      interaction.guild,
      'voice',
      embeds.success(`**الروم الصوتي:** ${channel.name}\n**بواسطة:** ${interaction.user.tag}`, '🔓 فتح روم صوتي')
    );
  },
};
