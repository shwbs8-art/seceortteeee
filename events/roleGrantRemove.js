const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

/**
 * حدث جديد منفصل (لا يعدّل events/guildMemberUpdate.js الموجود مسبقاً إطلاقاً):
 * يراقب حالتين فقط:
 *   1) إعطاء رتبة/رتب لعضو (roleGrant)
 *   2) سحب رتبة/رتب من عضو (roleRemove)
 *
 * هذا لا علاقة له بحذف/إنشاء/تعديل تعريف الرتبة نفسها (roleDelete/roleCreate/roleUpdate
 * الموجودة أصلاً بملفات أخرى) — فقط عملية "منح/سحب" الرتبة من عضو معيّن.
 *
 * الرتبة المستثناة (guildConfig.exemptRoleId) تُعفي صاحبها فقط من هذه الحماية
 * تحديداً (منح/سحب الرتب)، ولا تُعفيه من أي نظام حماية آخر بالبوت.
 */
module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const guild = newMember.guild;
    const client = newMember.client;

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const added = newRoles.filter((r) => !oldRoles.has(r.id));
    const removed = oldRoles.filter((r) => !newRoles.has(r.id));

    if (added.size === 0 && removed.size === 0) return; // لا يوجد تغيير بالرتب، تجاهل

    const cfg = guildConfig.get(guild.id);
    // نتعامل مع القيمة undefined (سيرفرات قديمة لم تُحفظ فيها هذه المفاتيح بعد) كأنها true
    // لتفادي تعطيل الحماية بدون قصد بسبب عدم دمج الإعدادات الافتراضية بدالة get().
    const antiRoleGrant = cfg.protection.antiRoleGrant !== false;
    const antiRoleRemove = cfg.protection.antiRoleRemove !== false;
    if (!antiRoleGrant && !antiRoleRemove) return;

    const audit = await guild.fetchAuditLogs({ type: 25 /* MEMBER_ROLE_UPDATE */, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    // نتأكد أن السجل يخص نفس العضو وحديث جداً (خلال 8 ثوانٍ) لتفادي false positives
    if (!entry || entry.target?.id !== newMember.id || Date.now() - entry.createdTimestamp > 8000) return;

    const executor = entry.executor;
    if (!executor) return;
    if (executor.id === client.user.id) return; // تجاهل الرتب التي يعطيها البوت نفسه (مثل الرتبة التلقائية)

    const execMember = await guild.members.fetch(executor.id).catch(() => null);
    const isExempt = cfg.exemptRoleId && execMember?.roles.cache.has(cfg.exemptRoleId);
    if (isExempt) return; // الرتبة المستثناة معفاة فقط من هذه الحماية تحديداً

    if (added.size > 0 && antiRoleGrant) {
      const names = added.map((r) => r.name).join('، ');
      await sendLog(
        guild,
        'security',
        embeds.info(`**العضو:** ${newMember.user.tag}\n**الرتب المُعطاة:** ${names}\n**بواسطة:** ${executor.tag}`, '➕ إعطاء رتبة لعضو')
      );
      await trackDangerousAction(client, guild, executor.id, 'إعطاء رتب متكرر للأعضاء', 'roleGrant');
    }

    if (removed.size > 0 && antiRoleRemove) {
      const names = removed.map((r) => r.name).join('، ');
      await sendLog(
        guild,
        'security',
        embeds.warning(`**العضو:** ${newMember.user.tag}\n**الرتب المسحوبة:** ${names}\n**بواسطة:** ${executor.tag}`, '➖ سحب رتبة من عضو')
      );
      await trackDangerousAction(client, guild, executor.id, 'سحب رتب متكرر من الأعضاء', 'roleRemove');
    }
  },
};
