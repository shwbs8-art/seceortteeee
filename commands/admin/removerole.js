const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إزالة_رتبة')
    .setDescription('إزالة رتبة من عضو')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .addRoleOption((o) => o.setName('الرتبة').setDescription('الرتبة المراد إزالتها').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const role = interaction.options.getRole('الرتبة');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [embeds.error('العضو غير موجود بالسيرفر.')], flags: MessageFlags.Ephemeral });
    if (!member.roles.cache.has(role.id)) {
      return interaction.reply({ embeds: [embeds.warning(`العضو **${target.tag}** لا يملك هذه الرتبة أصلاً.`)], flags: MessageFlags.Ephemeral });
    }

    await member.roles.remove(role, `بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تمت إزالة الرتبة ${role} من **${target.tag}**.`)] });

    await sendLog(interaction.guild, 'mod', embeds.info(`**العضو:** ${target.tag}\n**الرتبة:** ${role}\n**بواسطة:** ${interaction.user.tag}`, '➖ إزالة رتبة'));
  },
};
