const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const config = require('../../config');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('اعلان')
    .setDescription('إرسال إعلان Embed لروم محدد، مع إمكانية منشن رتبة')
    .addChannelOption((o) =>
      o.setName('الروم').setDescription('الروم المستهدف').addChannelTypes(ChannelType.GuildText).setRequired(true)
    )
    .addStringOption((o) => o.setName('العنوان').setDescription('عنوان الإعلان').setRequired(true))
    .addStringOption((o) => o.setName('المحتوى').setDescription('نص الإعلان (استخدم \\n لسطر جديد)').setRequired(true))
    .addRoleOption((o) => o.setName('الرتبة').setDescription('رتبة تُذكر مع الإعلان (اختياري)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم');
    const title = interaction.options.getString('العنوان');
    const content = interaction.options.getString('المحتوى').replace(/\\n/g, '\n');
    const role = interaction.options.getRole('الرتبة');

    const embed = embeds
      .base(`📢 ${title}`, content)
      .setColor(config.colors.info)
      .setFooter({ text: `بواسطة: ${interaction.user.tag}` });

    await channel.send({ content: role ? `${role}` : undefined, embeds: [embed] });
    await interaction.editReply({ embeds: [embeds.success(`تم إرسال الإعلان إلى ${channel} بنجاح.`)] });
  }),
};