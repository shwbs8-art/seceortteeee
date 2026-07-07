const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('تايم_اوت')
    .setDescription('وضع عضو على تايم أوت لمدة محددة')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .addIntegerOption((o) => o.setName('الدقائق').setDescription('عدد الدقائق (حتى 40320 = 28 يوم)').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption((o) => o.setName('السبب').setDescription('سبب التايم أوت').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const minutes = interaction.options.getInteger('الدقائق');
    const reason = interaction.options.getString('السبب') || 'لم يُحدد سبب';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [embeds.error('العضو غير موجود بالسيرفر.')], flags: MessageFlags.Ephemeral });
    if (!member.moderatable) {
      return interaction.reply({ embeds: [embeds.error('لا أستطيع وضع تايم أوت لهذا العضو.')], flags: MessageFlags.Ephemeral });
    }

    await member.timeout(minutes * 60 * 1000, `${reason} | بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم وضع تايم أوت لـ **${target.tag}** لمدة **${minutes}** دقيقة.\n**السبب:** ${reason}`)] });

    await sendLog(
      interaction.guild,
      'mod',
      embeds.warning(`**العضو:** ${target.tag} (${target.id})\n**المدة:** ${minutes} دقيقة\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${reason}`, '⏱️ تايم أوت')
    );
  },
};
