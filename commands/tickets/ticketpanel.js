const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const guildConfig = require('../../database/guildConfig');
const ticketHandler = require('../../handlers/ticketHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('لوحة_تذاكر')
    .setDescription('نشر رسالة فتح التذاكر الثابتة في روم معين')
    .addChannelOption((o) =>
      o.setName('الروم').setDescription('الروم المستهدف لنشر اللوحة').addChannelTypes(ChannelType.GuildText).setRequired(true)
    )
    .addChannelOption((o) =>
      o.setName('التصنيف').setDescription('كاتيغوري ستنشأ فيه رومات التذاكر (اختياري)').addChannelTypes(ChannelType.GuildCategory).setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم');
    const category = interaction.options.getChannel('التصنيف');

    guildConfig.set(interaction.guild.id, {
      ticketsChannelId: channel.id,
      ticketsCategoryId: category?.id || null,
      ticketPanelMessageId: null, // إجبار إعادة الإنشاء بالروم الجديد
    });

    const msg = await channel.send(ticketHandler.buildPanelPayload());
    guildConfig.set(interaction.guild.id, { ticketPanelMessageId: msg.id });

    await interaction.reply({ embeds: [embeds.success(`تم نشر لوحة التذاكر في ${channel} بنجاح.`)], flags: MessageFlags.Ephemeral });
  },
};
