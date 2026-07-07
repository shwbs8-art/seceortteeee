const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('حظر')
    .setDescription('حظر عضو من السيرفر')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المراد حظره').setRequired(true))
    .addStringOption((o) => o.setName('السبب').setDescription('سبب الحظر').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const reason = interaction.options.getString('السبب') || 'لم يُحدد سبب';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.editReply({ embeds: [embeds.error('لا أستطيع حظر هذا العضو (صلاحياته أعلى مني أو مساوية).')] });
    }

    await interaction.guild.members.ban(target.id, { reason: `${reason} | بواسطة: ${interaction.user.tag}` });

    await interaction.editReply({ embeds: [embeds.success(`تم حظر **${target.tag}** بنجاح.\n**السبب:** ${reason}`)] });

    await sendLog(
      interaction.guild,
      'mod',
      embeds.warning(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${reason}`, '🔨 حظر عضو')
    );
  }),
};