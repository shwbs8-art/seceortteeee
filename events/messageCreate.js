const guildConfig = require('../database/guildConfig');
const embeds = require('../utils/embeds');
const config = require('../config');
const { isOwner } = require('../utils/permissions');
const { checkSpamStage } = require('../systems/antiSpam');
const { containsDiscordInvite, containsLink } = require('../systems/antiLinks');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (message.member && isOwner(message.member)) return; // Owner معفى من الحماية

    const cfg = guildConfig.get(message.guild.id);
    const p = cfg.protection;

    // ---------------- Anti Everyone / Here ----------------
    if ((p.antiEveryone && message.content.includes('@everyone')) || (p.antiHere && message.content.includes('@here'))) {
      if (message.mentions.everyone) {
        await message.delete().catch(() => null);
        await warnUser(message, 'استخدام منشن جماعي (@everyone / @here) بدون صلاحية');
        return;
      }
      // كان نص "@everyone" فقط بدون منشن فعلي (بدون صلاحية Mention Everyone) — لا يوجد شيء لحذفه،
      // لكن يجب أن نكمل بقية فحوصات الحماية (سبام/روابط/دعوات) لنفس الرسالة بدل الخروج الكامل من الدالة.
    }

    // ---------------- Anti Mention Spam ----------------
    if (p.antiMentionSpam && message.mentions.users.size >= config.mentionSpam.maxMentions) {
      await message.delete().catch(() => null);
      await warnUser(message, `إرسال منشنات جماعية بشكل مبالغ فيه (${message.mentions.users.size} منشن)`);
      return;
    }

    // ---------------- Anti Discord Invite ----------------
    if (p.antiDiscordInvite && containsDiscordInvite(message.content)) {
      await message.delete().catch(() => null);
      await warnUser(message, 'إرسال دعوة سيرفر ديسكورد أخرى');
      return;
    }

    // ---------------- Anti Links ----------------
    if (p.antiLinks && containsLink(message.content)) {
      await message.delete().catch(() => null);
      await warnUser(message, 'إرسال رابط خارجي غير مسموح');
      return;
    }

    // ---------------- Anti Spam Pro Max (مرحلي: تحذير ثم تصعيد) ----------------
    if (p.antiSpam) {
      const stage = checkSpamStage(message.client, message);

      if (stage === 'warn') {
        // المرحلة 1: أول مرة يسبم فيها العضو (مثلاً 5 رسائل متتالية) => تحذير فقط، بدون حذف أو كتم
        await message.channel
          .send({
            embeds: [
              embeds.warning(
                `${message.author} ⚠️ تم رصد إرسالك لرسائل متكررة بسرعة (سبام).\nإذا استمريت سيتم **حذف رسائلك** و**تايم أوت لمدة ساعة** تلقائياً.`
              ),
            ],
          })
          .then((m) => setTimeout(() => m.delete().catch(() => null), 8000))
          .catch(() => null);

        await sendLog(
          message.guild,
          'security',
          embeds.warning(`**العضو:** ${message.author.tag}\n**الروم:** ${message.channel}\n**الإجراء:** تحذير أول (بدون عقوبة)`, '⚠️ Anti-Spam: تحذير')
        );
      } else if (stage === 'escalate') {
        // المرحلة 2: استمر بالسبام بعد التحذير => حذف رسائله المتكررة بالروم + تايم أوت ساعة كاملة
        const member = message.member;

        try {
          const recent = await message.channel.messages.fetch({ limit: config.spam.escalateDeleteLimit }).catch(() => null);
          if (recent) {
            const theirMessages = recent.filter(
              (m) => m.author.id === message.author.id && Date.now() - m.createdTimestamp < config.spam.intervalMs * 3
            );
            if (theirMessages.size > 0) {
              await message.channel.bulkDelete(theirMessages, true).catch(() => null);
            } else {
              await message.delete().catch(() => null);
            }
          }
        } catch (err) {
          console.error('[Anti-Spam] فشل حذف الرسائل المتكررة:', err);
        }

        if (member?.moderatable) {
          const timeoutMs = config.spam.escalateTimeoutMinutes * 60 * 1000;
          await member.timeout(timeoutMs, 'Anti-Spam: تكرار السبام بعد التحذير').catch(() => null);
          await message.channel
            .send({
              embeds: [
                embeds.error(
                  `${message.author} 🚫 تم حذف رسائلك ووضعك على **تايم أوت لمدة ${config.spam.escalateTimeoutMinutes} دقيقة (ساعة كاملة)** بسبب استمرارك بالسبام بعد التحذير.`
                ),
              ],
            })
            .catch(() => null);
        }

        await sendLog(
          message.guild,
          'security',
          embeds.error(
            `**العضو:** ${message.author.tag}\n**الروم:** ${message.channel}\n**الإجراء:** حذف الرسائل + تايم أوت ${config.spam.escalateTimeoutMinutes} دقيقة (تصعيد بعد تحذير سابق)`,
            '🚫 Anti-Spam: تصعيد'
          )
        );
      }
    }
  },
};

async function warnUser(message, reason) {
  await message.channel
    .send({ embeds: [embeds.warning(`${message.author}، تم حذف رسالتك.\n**السبب:** ${reason}`)] })
    .then((m) => setTimeout(() => m.delete().catch(() => null), 6000))
    .catch(() => null);

  await sendLog(message.guild, 'security', embeds.warning(`**العضو:** ${message.author.tag}\n**السبب:** ${reason}\n**الروم:** ${message.channel}`, '🛡️ حماية الرسائل'));
}
