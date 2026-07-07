const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => r.name)
      .join(', ') || 'لا يوجد';

    const embed = embeds
      .error(`**العضو:** ${member.user.tag} (${member.id})\n**الرتب:** ${roles}\n**عدد الأعضاء الآن:** ${member.guild.memberCount}`)
      .setTitle('📤 مغادرة عضو')
      .setThumbnail(member.user.displayAvatarURL());

    await sendLog(member.guild, 'joinLeave', embed);

    // ---------------- كشف الطرد (Kick) عبر الـ Audit Log ----------------
    // guildMemberRemove يحدث أيضاً عند مغادرة العضو طوعياً، لذا نتحقق أن آخر سجل
    // بالـ Audit Log من نوع "طرد" حديث جداً (خلال 5 ثوانٍ) ويستهدف نفس العضو،
    // لنفرّق بين المغادرة الطوعية والطرد الفعلي بواسطة أحد الأعضاء.
    try {
      const audit = await member.guild.fetchAuditLogs({ type: 20 /* MEMBER_KICK */, limit: 1 }).catch(() => null);
      const entry = audit?.entries.first();
      if (entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
        const executor = entry.executor;
        await sendLog(
          member.guild,
          'security',
          embeds.warning(`**العضو:** ${member.user.tag}\n**بواسطة:** ${executor?.tag || 'غير معروف'}`, '👢 تم رصد طرد عضو')
        );
        if (executor) {
          await trackDangerousAction(member.client, member.guild, executor.id, 'طرد أعضاء متكرر', 'kick');
        }
      }
    } catch (err) {
      console.error('[GuildMemberRemove] فشل فحص الـ Audit Log للطرد:', err);
    }
  },
};
