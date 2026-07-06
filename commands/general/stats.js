const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/db');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('الإحصائيات').setDescription('عرض إحصائيات السيرفر (تذاكر، تحذيرات، إلخ)'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const tickets = db.get('tickets', guildId, {});
    const warns = db.get('warns', guildId, {});

    const totalTickets = Object.keys(tickets).length;
    const openTickets = Object.values(tickets).filter((t) => t.status === 'open').length;
    const closedTickets = totalTickets - openTickets;
    const totalWarns = Object.values(warns).reduce((sum, arr) => sum + (arr?.length || 0), 0);

    const embed = embeds
      .base('📈 إحصائيات السيرفر')
      .addFields(
        { name: '🎫 إجمالي التذاكر', value: `${totalTickets}`, inline: true },
        { name: '🟢 تذاكر مفتوحة', value: `${openTickets}`, inline: true },
        { name: '🔴 تذاكر مغلقة', value: `${closedTickets}`, inline: true },
        { name: '⚠️ إجمالي التحذيرات', value: `${totalWarns}`, inline: true },
        { name: '👥 عدد الأعضاء', value: `${interaction.guild.memberCount}`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
