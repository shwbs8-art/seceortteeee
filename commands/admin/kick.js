const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('طرد')
    .setDescription('طرد عضو من السيرفر')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المراد طرده').setRequired(true))
    .addStringOption((o) => o.setName('السبب').setDescription('سبب الطرد').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const reason = interaction.options.getString('السبب') || 'لم يُحدد سبب';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [embeds.error('العضو غير موجود بالسيرفر.')], flags: MessageFlags.Ephemeral });
    if (!member.kickable) {
      return interaction.reply({ embeds: [embeds.error('لا أستطيع طرد هذا العضو (صلاحياته أعلى مني أو مساوية).')], flags: MessageFlags.Ephemeral });
    }

    await member.kick(`${reason} | بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم طرد **${target.tag}** بنجاح.\n**السبب:** ${reason}`)] });

    await sendLog(
      interaction.guild,
      'mod',
      embeds.warning(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${reason}`, '👢 طرد عضو')
    );
  },
};
