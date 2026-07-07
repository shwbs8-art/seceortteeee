const { MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const guildConfig = require('../database/guildConfig');
const ticketHandler = require('./ticketHandler');

const CATEGORY_LABELS = {
  general: '📌 أوامر عامة',
  admin: '🛡️ أوامر الإدارة',
  tickets: '🎫 أوامر التذاكر',
  settings: '⚙️ أوامر الإعدادات',
};

async function handleSelectMenu(interaction) {
  const id = interaction.customId;

  // ---- قائمة المساعدة ----
  if (id === 'help_menu') {
    const cat = interaction.values[0];
    const client = interaction.client;
    const names = [...client.commands.values()].filter((c) => (c.category || 'general') === cat).map((c) => c.data.name);

    await interaction.reply({
      embeds: [embeds.base(CATEGORY_LABELS[cat] || cat, names.map((n) => `\`/${n}\``).join(' • ') || 'لا يوجد أوامر بهذا القسم.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // ---- اختيار نوع التذكرة ----
  if (id === 'ticket:type_select') {
    const type = interaction.values[0];
    await interaction.showModal(ticketHandler.reasonModal(type));
    return;
  }

  // ---- إعدادات: تحديد الرومات ----
  if (id === 'select:set_logs') {
    const channel = interaction.channels.first();
    guildConfig.set(interaction.guild.id, { logsChannelId: channel.id });
    await interaction.update({ content: `✅ تم تحديد روم اللوقات: ${channel}`, components: [] });
    return;
  }

  if (id === 'select:set_tickets') {
    const channel = interaction.channels.first();
    guildConfig.set(interaction.guild.id, { ticketsChannelId: channel.id });
    await interaction.update({ content: `✅ تم تحديد روم التذاكر: ${channel}`, components: [] });
    await ticketHandler.ensureTicketPanel(interaction.guild);
    return;
  }

  // ---- إعدادات: تحديد الرتب ----
  if (id === 'select:set_admin_role') {
    const role = interaction.roles.first();
    guildConfig.set(interaction.guild.id, { adminRoleId: role.id });
    await interaction.update({ content: `✅ تم تحديد رتبة الإدارة: ${role}`, components: [] });
    return;
  }

  if (id === 'select:set_autorole') {
    const role = interaction.roles.first();
    guildConfig.set(interaction.guild.id, { autoRoleId: role.id });
    await interaction.update({ content: `✅ تم تحديد الرتبة التلقائية: ${role}`, components: [] });
    return;
  }
}

module.exports = { handleSelectMenu };
