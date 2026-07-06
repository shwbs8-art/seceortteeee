const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إزالة_التحذيرات')
    .setDescription('إزالة جميع تحذيرات عضو معين')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const guildId = interaction.guild.id;
    const warns = db.get('warns', guildId, {});

    if (!warns[target.id] || warns[target.id].length === 0) {
      return interaction.reply({ embeds: [embeds.info(`لا يوجد أي تحذيرات لـ **${target.tag}** أصلاً.`)], flags: MessageFlags.Ephemeral });
    }

    const count = warns[target.id].length;
    warns[target.id] = [];
    db.set('warns', guildId, warns);

    await interaction.reply({ embeds: [embeds.success(`تمت إزالة **${count}** تحذير عن **${target.tag}**.`)] });
    await sendLog(interaction.guild, 'mod', embeds.info(`**العضو:** ${target.tag}\n**بواسطة:** ${interaction.user.tag}\n**العدد المزال:** ${count}`, '🧹 إزالة تحذيرات'));
  },
};
