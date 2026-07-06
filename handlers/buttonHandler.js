const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const db = require('../database/db');
const guildConfig = require('../database/guildConfig');
const { isOwner } = require('../utils/permissions');
const { sendLog } = require('../utils/logger');
const ticketHandler = require('./ticketHandler');

async function handleButton(interaction) {
  const id = interaction.customId;

  if (id.startsWith('settings:')) return handleSettingsButton(interaction, id);
  if (id.startsWith('ticket:')) return handleTicketButton(interaction, id);
}

// ==================== أزرار الإعدادات ====================
async function handleSettingsButton(interaction, id) {
  if (!isOwner(interaction.member)) {
    return interaction.reply({ embeds: [embeds.error('هذا الأمر مخصص لرتبة Owner فقط.')], flags: MessageFlags.Ephemeral });
  }

  switch (id) {
    case 'settings:set_logs': {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId('select:set_logs')
        .setPlaceholder('اختر روم اللوقات')
        .addChannelTypes(ChannelType.GuildText);
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
      break;
    }
    case 'settings:set_tickets': {
      const menu = new ChannelSelectMenuBuilder()
        .setCustomId('select:set_tickets')
        .setPlaceholder('اختر روم التذاكر')
        .addChannelTypes(ChannelType.GuildText);
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
      break;
    }
    case 'settings:set_admin_role': {
      const menu = new RoleSelectMenuBuilder().setCustomId('select:set_admin_role').setPlaceholder('اختر رتبة الإدارة');
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
      break;
    }
    case 'settings:set_autorole': {
      const menu = new RoleSelectMenuBuilder().setCustomId('select:set_autorole').setPlaceholder('اختر الرتبة التلقائية');
      await interaction.reply({ components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
      break;
    }
    case 'settings:protection': {
      const cfg = guildConfig.get(interaction.guild.id);
      const rows = buildProtectionRows(cfg.protection);
      await interaction.reply({
        embeds: [embeds.base('🛡️ أنظمة الحماية', 'اضغط على أي نظام لتفعيله أو إيقافه.')],
        components: rows,
        flags: MessageFlags.Ephemeral,
      });
      break;
    }
    case 'settings:backup': {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const backupCmd = interaction.client.commands.get('backup');
      await backupCmd.execute(interaction);
      break;
    }
    case 'settings:refresh': {
      const settingsCmd = interaction.client.commands.get('الاعدادات');
      await settingsCmd.execute(interaction);
      break;
    }
    default: {
      if (id.startsWith('settings:toggle:')) {
        const key = id.replace('settings:toggle:', '');
        const cfg = guildConfig.get(interaction.guild.id);
        const newValue = !cfg.protection[key];
        guildConfig.setProtection(interaction.guild.id, key, newValue);

        const updated = guildConfig.get(interaction.guild.id);
        const rows = buildProtectionRows(updated.protection);
        await interaction.update({ components: rows });
      }
    }
  }
}

function buildProtectionRows(protection) {
  const entries = Object.entries(protection).filter(([k]) => k !== 'minAccountAgeDays');
  const rows = [];
  for (let i = 0; i < entries.length; i += 4) {
    const chunk = entries.slice(i, i + 4);
    const row = new ActionRowBuilder().addComponents(
      chunk.map(([key, value]) =>
        new ButtonBuilder()
          .setCustomId(`settings:toggle:${key}`)
          .setLabel(key)
          .setStyle(value ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setEmoji(value ? '✅' : '⭕')
      )
    );
    rows.push(row);
    if (rows.length >= 5) break; // حد أقصى 5 صفوف بكل رسالة ديسكورد
  }
  return rows;
}

// ==================== أزرار التذاكر ====================
async function handleTicketButton(interaction, id) {
  const guildId = interaction.guild.id;
  const tickets = db.get('tickets', guildId, {});

  if (id === 'ticket:open') {
    return interaction.reply({
      content: 'اختر نوع التذكرة:',
      components: [ticketHandler.typeSelectRow()],
      flags: MessageFlags.Ephemeral,
    });
  }

  const ticket = tickets[interaction.channel.id];

  if (id === 'ticket:claim') {
    if (!ticket) return interaction.reply({ embeds: [embeds.error('هذا الروم ليس تذكرة.')], flags: MessageFlags.Ephemeral });
    if (ticket.claimedBy) {
      return interaction.reply({ embeds: [embeds.warning(`هذه التذكرة مُستلمة مسبقاً بواسطة <@${ticket.claimedBy}>.`)], flags: MessageFlags.Ephemeral });
    }
    ticket.claimedBy = interaction.user.id;
    tickets[interaction.channel.id] = ticket;
    db.set('tickets', guildId, tickets);
    await interaction.reply({ embeds: [embeds.success(`تم استلام التذكرة بواسطة ${interaction.user}.`)] });
    return;
  }

  if (id === 'ticket:close') {
    if (!ticket) return interaction.reply({ embeds: [embeds.error('هذا الروم ليس تذكرة.')], flags: MessageFlags.Ephemeral });
    ticket.status = 'closed';
    tickets[interaction.channel.id] = ticket;
    db.set('tickets', guildId, tickets);

    await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:reopen').setLabel('إعادة فتح').setStyle(ButtonStyle.Success).setEmoji('🔓'),
      new ButtonBuilder().setCustomId('ticket:delete').setLabel('حذف نهائي').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
      new ButtonBuilder().setCustomId('ticket:transcript').setLabel('نسخة المحادثة').setStyle(ButtonStyle.Secondary).setEmoji('📄')
    );

    await interaction.reply({ embeds: [embeds.warning(`تم إغلاق التذكرة بواسطة ${interaction.user}.`)], components: [row] });

    await sendLog(interaction.guild, 'ticket', embeds.info(`**الروم:** ${interaction.channel.name}\n**بواسطة:** ${interaction.user.tag}`, '🔒 إغلاق تذكرة'));
    return;
  }

  if (id === 'ticket:reopen') {
    if (!ticket) return interaction.reply({ embeds: [embeds.error('هذا الروم ليس تذكرة.')], flags: MessageFlags.Ephemeral });
    ticket.status = 'open';
    tickets[interaction.channel.id] = ticket;
    db.set('tickets', guildId, tickets);

    await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: true }).catch(() => null);
    await interaction.reply({ embeds: [embeds.success(`تمت إعادة فتح التذكرة بواسطة ${interaction.user}.`)] });
    return;
  }

  if (id === 'ticket:delete') {
    await interaction.reply({ embeds: [embeds.warning('سيتم حذف هذا الروم خلال 5 ثوانٍ...')] });
    await sendLog(interaction.guild, 'ticket', embeds.error(`**الروم:** ${interaction.channel.name}\n**بواسطة:** ${interaction.user.tag}`, '🗑️ حذف تذكرة'));

    const tks = db.get('tickets', guildId, {});
    delete tks[interaction.channel.id];
    db.set('tickets', guildId, tks);

    setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
    return;
  }

  if (id === 'ticket:transcript') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { createTranscript } = require('discord-html-transcripts');
    try {
      const attachment = await createTranscript(interaction.channel, {
        limit: -1,
        returnType: 'attachment',
        filename: `${interaction.channel.name}.html`,
      });
      await interaction.editReply({ content: 'إليك نسخة المحادثة:', files: [attachment] });

      const logChannelId = require('../database/guildConfig').getLogChannel(guildId, 'ticket');
      if (logChannelId) {
        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel) await logChannel.send({ content: `📄 نسخة محادثة: ${interaction.channel.name}`, files: [attachment] }).catch(() => null);
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [embeds.error('فشل إنشاء نسخة المحادثة.')] });
    }
    return;
  }
}

module.exports = { handleButton };
