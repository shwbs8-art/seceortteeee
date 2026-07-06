const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('سحب_عضو')
    .setDescription('سحب عضو إلى الروم الصوتي الذي أنت متواجد فيه')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const myVoice = interaction.member.voice.channel;
    if (!myVoice) {
      return interaction.reply({ embeds: [embeds.error('يجب أن تكون متواجداً بروم صوتي لاستخدام هذا الأمر.')], flags: MessageFlags.Ephemeral });
    }

    const target = interaction.options.getUser('العضو');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member?.voice?.channel) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو ليس متواجداً بأي روم صوتي حالياً.')], flags: MessageFlags.Ephemeral });
    }

    await member.voice.setChannel(myVoice, `سحب بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم سحب **${target.tag}** إلى ${myVoice}.`)] });
  },
};
