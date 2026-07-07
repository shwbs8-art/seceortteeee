const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const db = require('../../database/db');
const guildConfig = require('../../database/guildConfig');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('إنشاء نسخة احتياطية من هيكل السيرفر (رومات، رتب، إعدادات البوت)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const guild = interaction.guild;

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .map((r) => ({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        permissions: r.permissions.bitfield.toString(),
        mentionable: r.mentionable,
        position: r.position,
      }));

    const channels = guild.channels.cache.map((c) => ({
      name: c.name,
      type: c.type,
      parent: c.parent?.name || null,
      position: c.position,
      topic: c.topic || null,
    }));

    const backupId = `${Date.now()}`;
    const backups = db.get('backups', guild.id, {});
    backups[backupId] = {
      createdAt: Date.now(),
      createdBy: interaction.user.id,
      guildName: guild.name,
      roles,
      channels,
      config: guildConfig.get(guild.id),
    };
    db.set('backups', guild.id, backups);

    await interaction.editReply({
      embeds: [
        embeds.success(
          `تم إنشاء نسخة احتياطية بنجاح.\n**معرّف النسخة:** \`${backupId}\`\n**عدد الرومات:** ${channels.length}\n**عدد الرتب:** ${roles.length}\n\nلاستعادتها لاحقاً استخدم:\n\`/restore backup_id:${backupId}\``
        ),
      ],
    });
  }),
};