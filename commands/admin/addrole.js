const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إضافة_رتبة')
    .setDescription('إضافة رتبة لعضو')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .addRoleOption((o) => o.setName('الرتبة').setDescription('الرتبة المراد إضافتها').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const role = interaction.options.getRole('الرتبة');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ embeds: [embeds.error('العضو غير موجود بالسيرفر.')] });
    if (member.roles.cache.has(role.id)) {
      return interaction.editReply({ embeds: [embeds.warning(`العضو **${target.tag}** يملك هذه الرتبة أصلاً.`)] });
    }

    await member.roles.add(role, `بواسطة: ${interaction.user.tag}`);
    await interaction.editReply({ embeds: [embeds.success(`تمت إضافة الرتبة ${role} لـ **${target.tag}**.`)] });

    await sendLog(interaction.guild, 'mod', embeds.info(`**العضو:** ${target.tag}\n**الرتبة:** ${role}\n**بواسطة:** ${interaction.user.tag}`, '➕ إضافة رتبة'));
  }),
};