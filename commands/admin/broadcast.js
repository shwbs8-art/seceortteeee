const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('برودكاست')
    .setDescription('إرسال رسالة خاصة لجميع أعضاء السيرفر')
    .addStringOption((o) => o.setName('المحتوى').setDescription('نص الرسالة (استخدم \\n لسطر جديد)').setRequired(true))
    .addRoleOption((o) => o.setName('الرتبة').setDescription('إرسال لأعضاء رتبة محددة فقط (اختياري)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const content = interaction.options.getString('المحتوى').replace(/\\n/g, '\n');
    const role = interaction.options.getRole('الرتبة');

    await interaction.guild.members.fetch();
    let members = interaction.guild.members.cache.filter((m) => !m.user.bot);
    if (role) members = members.filter((m) => m.roles.cache.has(role.id));

    const embed = embeds.base(`📨 رسالة من إدارة ${interaction.guild.name}`, content);

    let success = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.send({ embeds: [embed] });
        success++;
      } catch {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 400)); // تفادي الـ rate limit
    }

    await interaction.editReply({
      embeds: [embeds.success(`تم إرسال البرودكاست.\n**نجح:** ${success}\n**فشل:** ${failed}`)],
    });
  },
};
