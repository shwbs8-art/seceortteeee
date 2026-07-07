const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const guildConfig = require('../../database/guildConfig');
const voiceSticky = require('../../systems/voiceSticky');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('خروج_صوتي')
    .setDescription('إخراج البوت من الروم الصوتي الثابت وإلغاء وضع البقاء')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const wasSticky = voiceSticky.isSticky(interaction.client, interaction.guild.id);

    voiceSticky.leaveSticky(interaction.client, interaction.guild.id);
    guildConfig.set(interaction.guild.id, { stickyVoiceChannelId: null });

    if (!wasSticky) {
      return interaction.reply({ embeds: [embeds.info('البوت لم يكن بوضع صوتي ثابت أصلاً.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ embeds: [embeds.success('🔇 تم إخراج البوت من الروم الصوتي وإلغاء وضع البقاء الثابت.')] });

    await sendLog(interaction.guild, 'voice', embeds.warning(`**بواسطة:** ${interaction.user.tag}`, '🔇 إلغاء الوضع الصوتي الثابت'));
  },
};
