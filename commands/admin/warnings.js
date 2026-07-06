const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('عرض_التحذيرات')
    .setDescription('عرض جميع تحذيرات عضو معين')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('العضو');
    const warns = db.get('warns', interaction.guild.id, {})[target.id] || [];

    if (warns.length === 0) {
      return interaction.reply({ embeds: [embeds.info(`لا يوجد أي تحذيرات لـ **${target.tag}**.`)], flags: MessageFlags.Ephemeral });
    }

    const list = warns
      .map((w, i) => `**${i + 1}.** ${w.reason}\n↳ بواسطة: ${w.moderatorTag} — <t:${Math.floor(w.timestamp / 1000)}:R>`)
      .join('\n\n');

    await interaction.reply({
      embeds: [embeds.base(`⚠️ تحذيرات ${target.tag} (${warns.length})`, list)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
