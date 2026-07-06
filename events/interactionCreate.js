const { MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const { handleButton } = require('../handlers/buttonHandler');
const { handleSelectMenu } = require('../handlers/selectMenuHandler');
const { handleModal } = require('../handlers/modalHandler');
const { sendLog } = require('../utils/logger');
const { requireOwner } = require('../utils/permissions');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        // 🔒 قفل عام: بناءً على طلب صاحب البوت، لا يستطيع استخدام أي أمر سلاش
        // إطلاقاً إلا الأونر (صاحب رتبة/آيدي Owner المحدد، أو مالك السيرفر).
        // هذا الفحص يُغطي حتى الأوامر القديمة التي لم تكن تتحقق من الصلاحية بنفسها.
        if (!(await requireOwner(interaction))) return;

        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) return handleButton(interaction);

      if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu() || interaction.isUserSelectMenu()) {
        return handleSelectMenu(interaction);
      }

      if (interaction.isModalSubmit()) return handleModal(interaction);
    } catch (err) {
      console.error('[InteractionCreate] خطأ:', err);

      if (interaction.guild) {
        await sendLog(interaction.guild, 'error', embeds.error(`\`\`\`${String(err).slice(0, 1000)}\`\`\``, '❌ خطأ بالتفاعلات')).catch(() => null);
      }

      const payload = { embeds: [embeds.error('حدث خطأ غير متوقع أثناء تنفيذ هذا الإجراء.')], flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  },
};
