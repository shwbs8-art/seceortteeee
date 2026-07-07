const embeds = require('../utils/embeds');
const guildConfig = require('../database/guildConfig');
const { sendLog } = require('../utils/logger');
const config = require('../config');

async function resolveUsedInvite(client, guild) {
  try {
    const newInvites = await guild.invites.fetch();
    const oldMap = client.inviteCache.get(guild.id) || new Map();
    const used = newInvites.find((inv) => (oldMap.get(inv.code) || 0) < inv.uses);
    client.inviteCache.set(guild.id, new Map(newInvites.map((inv) => [inv.code, inv.uses])));
    return used || null;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { guild, client } = member;
    const cfg = guildConfig.get(guild.id);
    const p = cfg.protection;

    if (!client.raidLockUntil) client.raidLockUntil = new Map();

    // ---------------- وضع الحماية من الريد (Lockdown) ----------------
    // إذا كان مفعّلاً حالياً (بسبب اكتشاف ريد سابق خلال آخر دقيقة)، نطرد أي عضو جديد فوراً
    // ولا نعطيه الرتبة التلقائية، بدل الاكتفاء بتسجيل لوق فقط.
    const lockUntil = client.raidLockUntil.get(guild.id);
    if (lockUntil && Date.now() < lockUntil && (p.antiRaid || p.antiMassJoin)) {
      await member.kick('Anti-Raid: تم تفعيل وضع الحماية من الريد بسبب انضمامات جماعية مشبوهة').catch(() => null);
      await sendLog(
        guild,
        'security',
        embeds.warning(`**العضو:** ${member.user.tag}\n**السبب:** انضم أثناء وضع الحماية من الريد (لم يحصل على أي رتبة)`, '🚫 طرد أثناء وضع الريد')
      );
      return;
    }

    // ---------------- حماية الحسابات الجديدة ----------------
    if (p.newAccountProtection) {
      const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < p.minAccountAgeDays) {
        await member.kick(`Anti-Raid: حساب جديد جداً (${accountAgeDays.toFixed(1)} يوم)`).catch(() => null);
        await sendLog(
          guild,
          'security',
          embeds.warning(`**العضو:** ${member.user.tag}\n**عمر الحساب:** ${accountAgeDays.toFixed(1)} يوم\n**الإجراء:** طرد تلقائي`, '🚫 حساب جديد جداً')
        );
        return;
      }
    }

    // ---------------- Anti Raid / Mass Join ----------------
    if (p.antiRaid || p.antiMassJoin) {
      if (!client.raidCache.has(guild.id)) client.raidCache.set(guild.id, []);
      const joins = client.raidCache.get(guild.id).filter((t) => Date.now() - t < config.raid.windowMs);
      joins.push(Date.now());
      client.raidCache.set(guild.id, joins);

      if (joins.length >= config.raid.threshold) {
        // عدد كبير من الانضمامات خلال فترة قصيرة = احتمال ريد: نفعّل وضع الحماية
        client.raidLockUntil.set(guild.id, Date.now() + config.raid.lockdownMs);
        await sendLog(
          guild,
          'security',
          embeds.error(
            `تم رصد **${joins.length}** انضمام خلال ${config.raid.windowMs / 1000} ثانية.\n🔒 تم تفعيل **وضع الحماية من الريد** لمدة ${config.raid.lockdownMs / 1000} ثانية: أي عضو ينضم خلالها سيُطرد تلقائياً ولن يحصل على الرتبة التلقائية.`,
            '🚨 اشتباه بهجوم Raid'
          )
        );
      }
    }

    // ---------------- Anti Bot Add ----------------
    if (member.user.bot && p.antiBotAdd) {
      const audit = await guild.fetchAuditLogs({ type: 28 /* BOT_ADD */, limit: 1 }).catch(() => null);
      const entry = audit?.entries.first();
      const executor = entry?.executor;

      const { isOwner } = require('../utils/permissions');
      const adderMember = executor ? await guild.members.fetch(executor.id).catch(() => null) : null;

      if (!adderMember || !isOwner(adderMember)) {
        await member.kick('Anti-Bot-Add: تمت إضافة بوت من دون صلاحية Owner').catch(() => null);
        await sendLog(
          guild,
          'security',
          embeds.error(`**البوت:** ${member.user.tag}\n**بواسطة:** ${executor?.tag || 'غير معروف'}\n**الإجراء:** طرد البوت تلقائياً`, '🚫 Anti-Bot-Add')
        );
        return;
      }
    }

    // ---------------- Auto Role ----------------
    if (cfg.autoRoleId) {
      await member.roles.add(cfg.autoRoleId).catch(() => null);
    }

    // ---------------- Invite Tracker ----------------
    const usedInvite = await resolveUsedInvite(client, guild);

    // ---------------- Join Logs ----------------
    const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / 1000);
    const embed = embeds
      .success(
        `**العضو:** ${member.user.tag} (${member.id})\n**تاريخ إنشاء الحساب:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**عدد الأعضاء الآن:** ${guild.memberCount}` +
          (usedInvite ? `\n**الدعوة المستخدمة:** \`${usedInvite.code}\` (بواسطة ${usedInvite.inviter?.tag || 'غير معروف'})` : '')
      )
      .setTitle('📥 انضمام عضو جديد')
      .setThumbnail(member.user.displayAvatarURL());

    await sendLog(guild, 'joinLeave', embed);
  },
};
