const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { loadCommands } = require('../../handlers/commandHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('إعادة_تحميل')
    .setDescription('إعادة تحميل جميع أوامر البوت دون إعادة التشغيل')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const before = interaction.client.commands.size;
    loadCommands(interaction.client);
    const after = interaction.client.commands.size;

    await interaction.reply({
      embeds: [embeds.success(`تم إعادة تحميل الأوامر بنجاح.\n**قبل:** ${before} — **بعد:** ${after}\n\n⚠️ ملاحظة: هذا يعيد تحميل الكود محلياً فقط، لتحديث الأوامر الظاهرة بالديسكورد استخدم \`npm run deploy\`.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
