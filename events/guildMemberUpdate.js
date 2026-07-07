const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/logger');
const guildConfig = require('../database/guildConfig');
const { trackDangerousAction } = require('../systems/antiNuke');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const guild = newMember.guild;

    // ---------------- كشف إساءة استخدام التايم أوت (Anti-Nuke) ----------------
    // إذا تم فرض تايم أوت جديد (لم يكن موجوداً أو انتهى، وأصبح له تاريخ انتهاء بالمستقبل)
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;
    const isNewTimeout = newTimeout && newTimeout > Date.now() && newTimeout !== oldTimeout;

    if (isNewTimeout) {
      const audit = await guild.fetchAuditLogs({ type: 24 /* MEMBER_UPDATE */, limit: 1 }).catch(() => null);
      const entry = audit?.entries.first();
      const executor = entry?.executor;

      if (executor && Date.now() - (entry?.createdTimestamp || 0) < 10000) {
        await trackDangerousAction(newMember.client, guild, executor.id, 'تايم أوت متكرر لأعضاء', 'timeout');
      }
    }

    // ---------------- Boost Logs ----------------
    if (!oldMember.premiumSince && newMember.premiumSince) {
      await sendLog(guild, 'general', embeds.success(`${newMember.user.tag} قام بعمل بوست للسيرفر! 🚀`, '💎 بوست جديد'));
    } else if (oldMember.premiumSince && !newMember.premiumSince) {
      await sendLog(guild, 'general', embeds.warning(`${newMember.user.tag} أزال بوسته عن السيرفر.`, '💔 إزالة بوست'));
    }

    // ---------------- Nickname / Username Logs ----------------
    if (oldMember.nickname !== newMember.nickname) {
      await sendLog(
        guild,
        'general',
        embeds.info(`**العضو:** ${newMember.user.tag}\n**قبل:** ${oldMember.nickname || oldMember.user.username}\n**بعد:** ${newMember.nickname || newMember.user.username}`, '📝 تغيير الاسم المستعار')
      );

      // ---------------- Anti Nickname Spam ----------------
      const cfg = guildConfig.get(guild.id);
      if (cfg.protection.antiNicknameSpam) {
        const client = newMember.client;
        const key = `nick:${guild.id}:${newMember.id}`;
        if (!client.spamCache.has(key)) client.spamCache.set(key, []);
        const timestamps = client.spamCache.get(key).filter((t) => Date.now() - t < 30000);
        timestamps.push(Date.now());
        client.spamCache.set(key, timestamps);

        if (timestamps.length >= 4) {
          await sendLog(guild, 'security', embeds.warning(`**العضو:** ${newMember.user.tag}\n**السبب:** تغيير الاسم المستعار بشكل متكرر`, '🛡️ Anti Nickname Spam'));
        }
      }
    }
  },
};
