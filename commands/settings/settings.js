const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const guildConfig = require('../../database/guildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('الاعدادات')
    .setDescription('فتح لوحة إعدادات البوت التفاعلية (رومات اللوقات، التذاكر، الحماية، الرتب)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const cfg = guildConfig.get(interaction.guild.id);

    const embed = embeds
      .base('⚙️ لوحة إعدادات Iraq Babylon', 'اختر من الأزرار أدناه لضبط إعدادات البوت لهذا السيرفر.')
      .addFields(
        { name: '📜 روم اللوقات', value: cfg.logsChannelId ? `<#${cfg.logsChannelId}>` : 'غير محدد', inline: true },
        { name: '🎫 روم التذاكر', value: cfg.ticketsChannelId ? `<#${cfg.ticketsChannelId}>` : 'غير محدد', inline: true },
        { name: '🛡️ رتبة الإدارة', value: cfg.adminRoleId ? `<@&${cfg.adminRoleId}>` : 'غير محدد', inline: true },
        { name: '🎭 الرتبة التلقائية', value: cfg.autoRoleId ? `<@&${cfg.autoRoleId}>` : 'غير محدد', inline: true }
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('settings:set_logs').setLabel('روم اللوقات').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
      new ButtonBuilder().setCustomId('settings:set_tickets').setLabel('روم التذاكر').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
      new ButtonBuilder().setCustomId('settings:set_admin_role').setLabel('رتبة الإدارة').setStyle(ButtonStyle.Secondary).setEmoji('🛡️')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('settings:set_autorole').setLabel('الرتبة التلقائية').setStyle(ButtonStyle.Secondary).setEmoji('🎭'),
      new ButtonBuilder().setCustomId('settings:protection').setLabel('أنظمة الحماية').setStyle(ButtonStyle.Primary).setEmoji('🛡️')
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('settings:backup').setLabel('إنشاء Backup').setStyle(ButtonStyle.Success).setEmoji('💾'),
      new ButtonBuilder().setCustomId('settings:refresh').setLabel('تحديث اللوحة').setStyle(ButtonStyle.Secondary).setEmoji('🔄')
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2, row3] });
  },
};
