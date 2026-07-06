const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    const guild = newRole.guild;
    const cfg = guildConfig.get(guild.id);

    const gainedAdmin =
      !oldRole.permissions.has(PermissionFlagsBits.Administrator) && newRole.permissions.has(PermissionFlagsBits.Administrator);

    if (!gainedAdmin && oldRole.name === newRole.name && oldRole.permissions.bitfield === newRole.permissions.bitfield) return;

    const audit = await guild.fetchAuditLogs({ type: 31 /* ROLE_UPDATE */, limit: 1 }).catch(() => null);
    const executor = audit?.entries.first()?.executor;

    // ---------------- Anti Permission Abuse ----------------
    if (gainedAdmin && cfg.protection.antiPermissionAbuse && executor) {
      const { isOwner } = require('../utils/permissions');
      const execMember = await guild.members.fetch(executor.id).catch(() => null);
      if (!execMember || !isOwner(execMember)) {
        await newRole.setPermissions(oldRole.permissions, 'Anti-Permission-Abuse: إلغاء صلاحية Administrator غير المصرح بها').catch(() => null);
        await sendLog(
          guild,
          'security',
          embeds.error(`**الرتبة:** ${newRole.name}\n**بواسطة:** ${executor.tag}\n**الإجراء:** تم التراجع عن الصلاحية تلقائياً`, '🚨 Anti-Permission-Abuse')
        );
        await trackDangerousAction(newRole.client, guild, executor.id, 'منح صلاحية Administrator', 'permissionAbuse');
        return;
      }
    }

    await sendLog(
      guild,
      'security',
      embeds.info(`**الرتبة:** ${newRole.name}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '✏️ تعديل رتبة')
    );

    if (cfg.protection.antiRoleUpdate && executor) {
      await trackDangerousAction(newRole.client, guild, executor.id, 'تعديل رتبة', 'roleUpdate');
    }
  },
};
