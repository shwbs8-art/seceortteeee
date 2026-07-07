const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('نقل_عضو')
    .setDescription('نقل عضو من روم صوتي إلى آخر')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .addChannelOption((o) =>
      o.setName('الروم_الصوتي').setDescription('الروم الصوتي الوجهة').addChannelTypes(ChannelType.GuildVoice).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const channel = interaction.options.getChannel('الروم_الصوتي');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member?.voice?.channel) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو ليس متواجداً بأي روم صوتي حالياً.')], flags: MessageFlags.Ephemeral });
    }

    await member.voice.setChannel(channel, `بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم نقل **${target.tag}** إلى الروم ${channel}.`)] });
  },
};
