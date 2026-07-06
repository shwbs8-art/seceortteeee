const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const embeds = require('../utils/embeds');
const db = require('../database/db');
const guildConfig = require('../database/guildConfig');
const { sendLog } = require('../utils/logger');

const TICKET_TYPES = [
  { value: 'general', label: 'استفسار عام', emoji: '💬' },
  { value: 'support', label: 'دعم فني', emoji: '🛠️' },
  { value: 'report', label: 'تبليغ عن عضو', emoji: '🚨' },
  { value: 'other', label: 'شيء آخر', emoji: '📁' },
];

function buildPanelPayload() {
  const embed = embeds
    .base('🎫 نظام التذاكر', 'اضغط على الزر أدناه لفتح تذكرة جديدة وسيتواصل معك فريق الإدارة في أقرب وقت.')
    .setFooter({ text: 'Iraq Babylon — نظام الدعم' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:open').setLabel('فتح تذكرة').setStyle(ButtonStyle.Primary).setEmoji('🎫')
  );

  return { embeds: [embed], components: [row] };
}

async function ensureTicketPanel(guild) {
  const cfg = guildConfig.get(guild.id);
  if (!cfg.ticketsChannelId) return;

  const channel = await guild.channels.fetch(cfg.ticketsChannelId).catch(() => null);
  if (!channel) return;

  if (cfg.ticketPanelMessageId) {
    const existing = await channel.messages.fetch(cfg.ticketPanelMessageId).catch(() => null);
    if (existing) return; // الرسالة موجودة، لا داعي لإعادة إنشائها
  }

  const msg = await channel.send(buildPanelPayload()).catch(() => null);
  if (msg) guildConfig.set(guild.id, { ticketPanelMessageId: msg.id });
}

function typeSelectRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket:type_select')
    .setPlaceholder('📂 اختر نوع التذكرة')
    .addOptions(TICKET_TYPES.map((t) => ({ label: t.label, value: t.value, emoji: t.emoji })));
  return new ActionRowBuilder().addComponents(menu);
}

function reasonModal(type) {
  const modal = new ModalBuilder().setCustomId(`ticket:modal:${type}`).setTitle('سبب فتح التذكرة');
  const input = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('اشرح مشكلتك أو سبب التذكرة بالتفصيل')
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(5)
    .setMaxLength(1000)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

async function createTicketChannel(interaction, type, reason) {
  const guild = interaction.guild;
  const cfg = guildConfig.get(guild.id);
  const typeInfo = TICKET_TYPES.find((t) => t.value === type) || TICKET_TYPES[0];

  const nextNumber = (cfg.ticketCounter || 0) + 1;
  guildConfig.set(guild.id, { ticketCounter: nextNumber });

  const channelName = `ticket-${String(nextNumber).padStart(4, '0')}`;

  const overwrites = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
    },
  ];

  if (cfg.adminRoleId) {
    overwrites.push({
      id: cfg.adminRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: cfg.ticketsCategoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `تذكرة لـ ${interaction.user.tag} | النوع: ${typeInfo.label}`,
  });

  const tickets = db.get('tickets', guild.id, {});
  tickets[channel.id] = {
    userId: interaction.user.id,
    type,
    reason,
    status: 'open',
    claimedBy: null,
    number: nextNumber,
    createdAt: Date.now(),
  };
  db.set('tickets', guild.id, tickets);

  const embed = embeds
    .base(`${typeInfo.emoji} تذكرة جديدة #${String(nextNumber).padStart(4, '0')}`, `مرحباً ${interaction.user}، شكراً لتواصلك معنا.\n\n**النوع:** ${typeInfo.label}\n**السبب:** ${reason}`)
    .setFooter({ text: 'سيقوم فريق الإدارة بالرد قريباً' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('استلام').setStyle(ButtonStyle.Success).setEmoji('🙋'),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('إغلاق').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    new ButtonBuilder().setCustomId('ticket:transcript').setLabel('نسخة المحادثة').setStyle(ButtonStyle.Secondary).setEmoji('📄')
  );

  await channel.send({ content: `${interaction.user}${cfg.adminRoleId ? ` <@&${cfg.adminRoleId}>` : ''}`, embeds: [embed], components: [row] });

  await sendLog(guild, 'ticket', embeds.info(`**الروم:** ${channel}\n**العضو:** ${interaction.user.tag}\n**النوع:** ${typeInfo.label}`, '🎫 تذكرة جديدة'));

  return channel;
}

module.exports = { TICKET_TYPES, buildPanelPayload, ensureTicketPanel, typeSelectRow, reasonModal, createTicketChannel };
