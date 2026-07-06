const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('فصل_عضو')
    .setDescription('فصل عضو من الروم الصوتي')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member?.voice?.channel) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو ليس متواجداً بأي روم صوتي حالياً.')], flags: MessageFlags.Ephemeral });
    }

    await member.voice.disconnect(`بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم فصل **${target.tag}** من الروم الصوتي.`)] });
  },
};
