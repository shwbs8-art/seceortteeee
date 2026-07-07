const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('تحذير')
    .setDescription('توجيه تحذير لعضو')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المستهدف').setRequired(true))
    .addStringOption((o) => o.setName('السبب').setDescription('سبب التحذير').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const target = interaction.options.getUser('العضو');
    const reason = interaction.options.getString('السبب');
    const guildId = interaction.guild.id;

    const warns = db.get('warns', guildId, {});
    if (!warns[target.id]) warns[target.id] = [];
    warns[target.id].push({
      reason,
      moderator: interaction.user.id,
      moderatorTag: interaction.user.tag,
      timestamp: Date.now(),
    });
    db.set('warns', guildId, warns);

    await interaction.reply({ embeds: [embeds.success(`تم توجيه تحذير لـ **${target.tag}**.\n**السبب:** ${reason}\n**عدد تحذيراته الآن:** ${warns[target.id].length}`)] });

    await target.send({ embeds: [embeds.warning(`تلقيت تحذيراً في سيرفر **${interaction.guild.name}**.\n**السبب:** ${reason}`)] }).catch(() => null);

    await sendLog(
      interaction.guild,
      'mod',
      embeds.warning(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${reason}\n**العدد الكلي:** ${warns[target.id].length}`, '⚠️ تحذير عضو')
    );
  },
};
