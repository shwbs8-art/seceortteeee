const config = require('../config');

/**
 * يتتبع رسائل كل عضو، ويرجع true إذا تجاوز الحد المسموح (سبام).
 */
function checkSpam(client, message) {
  const key = `${message.guild.id}:${message.author.id}`;
  if (!client.spamCache.has(key)) client.spamCache.set(key, []);

  const timestamps = client.spamCache.get(key).filter((t) => Date.now() - t < config.spam.intervalMs);
  timestamps.push(Date.now());
  client.spamCache.set(key, timestamps);

  return timestamps.length >= config.spam.maxMessages;
}

function resetSpam(client, guildId, userId) {
  client.spamCache.delete(`${guildId}:${userId}`);
}

/**
 * === نظام Anti-Spam Pro Max (مرحلي) ===
 * يرجع واحدة من: null (لا شيء)، 'warn' (تحذير فقط - أول مرة يسبم فيها)،
 * 'escalate' (تصعيد - سبم مرة أخرى بعد التحذير => يجب حذف رسائله + تايم أوت ساعة).
 *
 * يستخدم client.spamStageCache (Collection) لتخزين حالة كل عضو: هل سبق تحذيره؟ ومتى.
 */
function checkSpamStage(client, message) {
  if (!client.spamStageCache) client.spamStageCache = new Map();

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();

  // نفس عداد الرسائل المستخدم بـ checkSpam، لكن لا نستدعي checkSpam مباشرة
  // لتفادي إضافة الرسالة للعداد مرتين.
  const isSpamming = checkSpam(client, message);
  if (!isSpamming) return null;

  const state = client.spamStageCache.get(key);

  // إذا لم يسبق تحذيره، أو انتهت صلاحية تحذيره السابق (warnResetMs) => مرحلة التحذير فقط
  if (!state || now - state.warnedAt > config.spam.warnResetMs) {
    client.spamStageCache.set(key, { warnedAt: now });
    return 'warn';
  }

  // سبق تحذيره وما زال ضمن فترة الصلاحية ثم استمر بالسبام => تصعيد (حذف + تايم أوت)
  client.spamStageCache.delete(key);
  resetSpam(client, message.guild.id, message.author.id);
  return 'escalate';
}

function resetSpamStage(client, guildId, userId) {
  if (!client.spamStageCache) return;
  client.spamStageCache.delete(`${guildId}:${userId}`);
}

module.exports = { checkSpam, resetSpam, checkSpamStage, resetSpamStage };
