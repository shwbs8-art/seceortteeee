const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('فك_حظر')
    .setDescription('فك الحظر عن عضو باستخدام آيدي الحساب')
    .addStringOption((o) => o.setName('آيدي').setDescription('آيدي العضو المحظور').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const userId = interaction.options.getString('آيدي');
    const bans = await interaction.guild.bans.fetch().catch(() => null);

    if (!bans?.has(userId)) {
      return interaction.reply({ embeds: [embeds.error('هذا العضو غير محظور أو الآيدي غير صحيح.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.guild.members.unban(userId, `بواسطة: ${interaction.user.tag}`);
    await interaction.reply({ embeds: [embeds.success(`تم فك الحظر عن العضو صاحب الآيدي \`${userId}\` بنجاح.`)] });

    await sendLog(interaction.guild, 'mod', embeds.info(`**آيدي العضو:** ${userId}\n**بواسطة:** ${interaction.user.tag}`, '🔓 فك حظر'));
  },
};
