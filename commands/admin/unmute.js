const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('فك_كتم')
    .setDescription('فك الكتم عن عضو')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المراد فك كتمه').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const mutedRole = interaction.guild.roles.cache.find((r) => r.name === 'Muted');

    if (!member || !mutedRole || !member.roles.cache.has(mutedRole.id)) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو غير مكتوم أصلاً.')], flags: MessageFlags.Ephemeral });
    }

    await member.roles.remove(mutedRole, `بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم فك الكتم عن **${target.tag}** بنجاح.`)] });

    await sendLog(interaction.guild, 'mod', embeds.info(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}`, '🔊 فك كتم'));
  },
};
