const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إزالة_تايم_اوت')
    .setDescription('إزالة التايم أوت عن عضو')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member || !member.communicationDisabledUntil) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو ليس عليه تايم أوت.')], flags: MessageFlags.Ephemeral });
    }

    await member.timeout(null, `بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تمت إزالة التايم أوت عن **${target.tag}** بنجاح.`)] });

    await sendLog(interaction.guild, 'mod', embeds.info(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}`, '✅ إزالة تايم أوت'));
  },
};
