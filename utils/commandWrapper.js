const { MessageFlags } = require('discord.js');
// utils/commandWrapper.js
const embeds = require('./embeds');

/**
 * غلاف لأوامر الإدارة لتأجيل الرد تلقائياً ومنع timeout
 */
function wrapAdminCommand(executeFn) {
  return async function(interaction) {
    try {
      // تأجيل الرد فوراً لجميع أوامر الإدارة
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      await executeFn(interaction);
    } catch (error) {
      console.error('[Command Error]', error);
      
      // محاولة إرسال رسالة الخطأ
      try {
        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        await interaction[replyMethod]({ 
          embeds: [embeds.error('حدث خطأ أثناء تنفيذ الأمر')],
          flags: MessageFlags.Ephemeral 
        });
      } catch (e) {
        console.error('[Command Error - Final]', e);
      }
    }
  };
}

module.exports = { wrapAdminCommand };