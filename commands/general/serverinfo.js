const { SlashCommandBuilder, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('معلومات_السيرفر').setDescription('عرض معلومات تفصيلية عن السيرفر'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => null);

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = guild.memberCount - bots;

    const embed = embeds
      .base(`📊 معلومات سيرفر ${guild.name}`)
      .setThumbnail(guild.iconURL() || null)
      .addFields(
        { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🆔 آيدي السيرفر', value: guild.id, inline: true },
        { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '👥 الأعضاء', value: `${guild.memberCount}`, inline: true },
        { name: '🧍 بشر', value: `${humans}`, inline: true },
        { name: '🤖 بوتات', value: `${bots}`, inline: true },
        { name: '💬 الرومات النصية', value: `${textChannels}`, inline: true },
        { name: '🔊 الرومات الصوتية', value: `${voiceChannels}`, inline: true },
        { name: '🎭 عدد الرتب', value: `${guild.roles.cache.size}`, inline: true },
        { name: '🚀 مستوى البوست', value: `${guild.premiumTier || 0}`, inline: true },
        { name: '✨ عدد البوستات', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
