const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

/**
 * نظام "الوضع الصوتي الثابت": يجعل البوت يدخل روم صوتي معين ويبقى متصلاً فيه،
 * مع تخزين مؤقت (بالذاكرة، مثل باقي الكاشات بالبوت) لمعرفة أي سيرفر مفعّل عليه
 * هذا الوضع وأي روم بالتحديد، حتى تقدر أنظمة الحماية الأخرى (voiceGuard) تعرف
 * متى تحاول إعادة الاتصال تلقائياً.
 */
function ensureCache(client) {
  if (!client.voiceReconnect) client.voiceReconnect = new Map(); // guildId -> channelId
}

async function joinSticky(client, channel) {
  ensureCache(client);

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });

  client.voiceReconnect.set(channel.guild.id, channel.id);

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15000);
  } catch {
    // نتجاهل فشل التأكد الفوري من الاتصال، voiceGuard سيحاول لاحقاً إذا انقطع فعلياً
  }

  return connection;
}

function leaveSticky(client, guildId) {
  ensureCache(client);
  client.voiceReconnect.delete(guildId);

  const connection = getVoiceConnection(guildId);
  if (connection) connection.destroy();
}

function isSticky(client, guildId) {
  ensureCache(client);
  return client.voiceReconnect.has(guildId);
}

function getStickyChannelId(client, guildId) {
  ensureCache(client);
  return client.voiceReconnect.get(guildId) || null;
}

module.exports = { joinSticky, leaveSticky, isSticky, getStickyChannelId, ensureCache };
