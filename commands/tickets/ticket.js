const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const db = require('../../database/db');
const { isOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const guildConfig = require('../../database/guildConfig');

function getTicket(interaction) {
  const tickets = db.get('tickets', interaction.guild.id, {});
  return { tickets, ticket: tickets[interaction.channel.id] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('تذكرة')
    .setDescription('أوامر إدارة التذكرة الحالية (تُستخدم داخل روم التذكرة فقط)')
    .addSubcommand((s) => s.setName('claim').setDescription('استلام التذكرة'))
    .addSubcommand((s) => s.setName('unclaim').setDescription('إلغاء استلام التذكرة'))
    .addSubcommand((s) => s.setName('close').setDescription('إغلاق التذكرة'))
    .addSubcommand((s) => s.setName('reopen').setDescription('إعادة فتح التذكرة'))
    .addSubcommand((s) => s.setName('delete').setDescription('حذف التذكرة نهائياً'))
    .addSubcommand((s) =>
      s.setName('rename').setDescription('إعادة تسمية روم التذكرة').addStringOption((o) => o.setName('اسم').setDescription('الاسم الجديد').setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName('اضافة_عضو').setDescription('إضافة عضو للتذكرة').addUserOption((o) => o.setName('العضو').setDescription('العضو المراد إضافته').setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName('ازالة_عضو').setDescription('إزالة عضو من التذكرة').addUserOption((o) => o.setName('العضو').setDescription('العضو المراد إزالته').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { tickets, ticket } = getTicket(interaction);
    const guildId = interaction.guild.id;

    if (!ticket && sub !== 'delete') {
      return interaction.reply({ embeds: [embeds.error('هذا الأمر يُستخدم داخل روم تذكرة فقط.')], flags: MessageFlags.Ephemeral });
    }

    if (!isOwner(interaction.member)) {
      const cfg = guildConfig.get(guildId);
      const isAdminRole = cfg.adminRoleId && interaction.member.roles.cache.has(cfg.adminRoleId);
      if (!isAdminRole) {
        return interaction.reply({ embeds: [embeds.error('ليس لديك صلاحية لإدارة التذاكر.')], flags: MessageFlags.Ephemeral });
      }
    }

    switch (sub) {
      case 'claim': {
        if (ticket.claimedBy) return interaction.reply({ embeds: [embeds.warning(`مُستلمة مسبقاً بواسطة <@${ticket.claimedBy}>.`)], flags: MessageFlags.Ephemeral });
        ticket.claimedBy = interaction.user.id;
        db.set('tickets', guildId, tickets);
        await interaction.reply({ embeds: [embeds.success(`تم استلام التذكرة بواسطة ${interaction.user}.`)] });
        break;
      }
      case 'unclaim': {
        ticket.claimedBy = null;
        db.set('tickets', guildId, tickets);
        await interaction.reply({ embeds: [embeds.info('تم إلغاء استلام التذكرة.')] });
        break;
      }
      case 'close': {
        ticket.status = 'closed';
        db.set('tickets', guildId, tickets);
        await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => null);
        await interaction.reply({ embeds: [embeds.warning('تم إغلاق التذكرة.')] });
        await sendLog(interaction.guild, 'ticket', embeds.info(`**الروم:** ${interaction.channel.name}\n**بواسطة:** ${interaction.user.tag}`, '🔒 إغلاق تذكرة'));
        break;
      }
      case 'reopen': {
        ticket.status = 'open';
        db.set('tickets', guildId, tickets);
        await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: true }).catch(() => null);
        await interaction.reply({ embeds: [embeds.success('تمت إعادة فتح التذكرة.')] });
        break;
      }
      case 'delete': {
        await interaction.reply({ embeds: [embeds.warning('سيتم حذف الروم خلال 5 ثوانٍ...')] });
        delete tickets[interaction.channel.id];
        db.set('tickets', guildId, tickets);
        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
        break;
      }
      case 'rename': {
        const newName = interaction.options.getString('اسم');
        const safeName = newName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF-]/g, '-').slice(0, 90);
        await interaction.channel.setName(safeName);
        await interaction.reply({ embeds: [embeds.success(`تمت إعادة تسمية الروم إلى **${safeName}**.`)] });
        break;
      }
      case 'اضافة_عضو': {
        const member = interaction.options.getUser('العضو');
        await interaction.channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        await interaction.reply({ embeds: [embeds.success(`تمت إضافة ${member} للتذكرة.`)] });
        break;
      }
      case 'ازالة_عضو': {
        const member = interaction.options.getUser('العضو');
        await interaction.channel.permissionOverwrites.delete(member.id).catch(() => null);
        await interaction.reply({ embeds: [embeds.success(`تمت إزالة ${member} من التذكرة.`)] });
        break;
      }
    }
  },
};
