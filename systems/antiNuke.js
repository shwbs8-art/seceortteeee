const config = require('../config');
const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const { isOwner } = require('../utils/permissions');
const guildConfig = require('../database/guildConfig');

/**
 * يتتبع الأفعال الخطيرة (حذف/إنشاء رومات، حذف/إنشاء رتب، باند، كيك، تايم أوت... إلخ)
 * لكل مستخدم على حدة **وبحسب نوع الفعل**، ويعاقب تلقائياً إذا تجاوز عدد أفعاله من
 * نفس النوع الحد المسموح (القابل للتحكم به من كل سيرفر عبر أمر /حدود_الحماية) خلال
 * فترة زمنية قصيرة (نظام Anti Nuke Pro Max).
 *
 * actionType: مفتاح نوع الفعل، مثل: roleDelete, roleCreate, roleUpdate, channelDelete,
 * channelCreate, channelUpdate, webhook, permissionAbuse, ban, kick, timeout.
 * إذا لم يُمرَّر (توافقاً مع أي استدعاء قديم) يُستخدم الحد العام config.antiNuke.maxActions.
 */
async function trackDangerousAction(client, guild, executorId, actionLabel, actionType = 'generic') {
  // لا نتابع أو نعاقب الأونر أبداً (المالك الفعلي أو صاحب رتبة/آيدي Owner المحدد بالإعدادات)
  const execMember = await guild.members.fetch(executorId).catch(() => null);
  if (execMember && isOwner(execMember)) return false;

  if (!client.nukeCache.has(guild.id)) client.nukeCache.set(guild.id, new Map());
  const guildMap = client.nukeCache.get(guild.id);

  const key = `${executorId}:${actionType}`;
  const intervalMs = guildConfig.getAntiNukeLimit(guild.id, 'intervalMs') || config.antiNuke.intervalMs;
  const maxActions = guildConfig.getAntiNukeLimit(guild.id, actionType) ?? config.antiNuke.maxActions;

  const now = Date.now();
  const entry = guildMap.get(key) || { count: 0, first: now };

  if (now - entry.first > intervalMs) {
    entry.count = 1;
    entry.first = now;
  } else {
    entry.count += 1;
  }
  guildMap.set(key, entry);

  if (entry.count >= maxActions) {
    guildMap.delete(key);
    await punishNuker(guild, executorId, actionLabel, maxActions);
    return true;
  }
  return false;
}

/**
 * عقوبة Anti-Nuke: تصفير (إزالة) جميع رتب المخالف بدلاً من حظره أو طرده،
 * بناءً على طلب صاحب السيرفر (بقاء العضو بالسيرفر لكن بدون أي صلاحيات/رتب).
 */
async function punishNuker(guild, executorId, actionLabel, threshold = null) {
  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;

    // لا نعاقب المالك أو صاحب رتبة Owner المحددة (حماية إضافية حتى لو تغيّر مصدر الاستدعاء)
    if (isOwner(member)) return;

    const removableRoles = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
    const removedCount = removableRoles.size;

    if (removedCount > 0) {
      await member.roles.remove(removableRoles, `Anti-Nuke: تكرار أفعال خطيرة (${actionLabel})`).catch(() => null);
    }

    await sendLog(
      guild,
      'security',
      embeds.error(
        `**العضو:** ${member.user.tag} (${member.id})\n**الفعل:** ${actionLabel}\n**الحد المسموح:** ${threshold ?? config.antiNuke.maxActions} أفعال\n**الإجراء:** تم تصفير جميع رتبه (${removedCount} رتبة) تلقائياً — لم يتم حظره أو طرده حسب إعدادات السيرفر`,
        '🚨 Anti-Nuke تفعّل'
      )
    );
  } catch (err) {
    console.error('[AntiNuke] فشل تنفيذ العقوبة:', err);
  }
}

module.exports = { trackDangerousAction, punishNuker };
