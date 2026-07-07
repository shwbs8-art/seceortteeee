const { MessageFlags } = require('discord.js');
const config = require('../config');

/**
 * يتحقق من أن العضو يملك رتبة Owner المحددة بـ OWNER_ROLE_ID
 * أو أنه المالك المطلق المحدد بـ OWNER_USER_ID
 */
function isOwner(member) {
  if (!member) return false;
  if (config.ownerUserId && member.id === config.ownerUserId) return true;
  if (member.guild?.ownerId === member.id) return true;
  if (config.ownerRoleId && member.roles?.cache?.has(config.ownerRoleId)) return true;
  return false;
}

/**
 * يتحقق من صلاحية الأدمن العامة (رتبة الإدارة المحددة بالإعدادات، أو Owner)
 */
function isAdmin(member, adminRoleId = null) {
  if (isOwner(member)) return true;
  if (adminRoleId && member.roles?.cache?.has(adminRoleId)) return true;
  return false;
}

async function requireOwner(interaction) {
  if (!isOwner(interaction.member)) {
    const embeds = require('./embeds');
    const payload = {
      embeds: [embeds.error('هذا الأمر مخصص لرتبة **Owner** فقط، ليس لديك صلاحية استخدامه.')],
      flags: MessageFlags.Ephemeral,
    };
    // بعض الأوامر (المغلّفة بـ wrapAdminCommand مثل إضافة_رتبة/اعلان/backup/حظر) تكون
    // قد أجّلت الرد (deferReply) مسبقاً قبل الوصول لهذا الفحص، فاستدعاء reply() مباشرة
    // كان يرمي خطأ "InteractionAlreadyReplied" ويظهر للمستخدم رسالة خطأ عامة بدل رسالة الصلاحيات.
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
    return false;
  }
  return true;
}

module.exports = { isOwner, isAdmin, requireOwner };
