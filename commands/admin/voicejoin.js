const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const guildConfig = require('../../database/guildConfig');
const voiceSticky = require('../../systems/voiceSticky');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('دخول_صوتي')
    .setDescription('يجعل البوت يدخل ويبقى بشكل ثابت داخل روم صوتي معين مع حماية ضد الإخراج')
    .addChannelOption((o) =>
      o
        .setName('الروم_الصوتي')
        .setDescription('الروم الصوتي (افتراضي: الروم الذي أنت متواجد فيه)')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;

    const channel = interaction.options.getChannel('الروم_الصوتي') || interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply({
        embeds: [embeds.error('يجب تحديد روم صوتي، أو تكون متواجداً بأحدها لاستخدام هذا الأمر بدون تحديد.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const perms = channel.permissionsFor(interaction.guild.members.me);
    if (!perms?.has(PermissionFlagsBits.Connect) || !perms?.has(PermissionFlagsBits.ViewChannel)) {
      return interaction.reply({
        embeds: [embeds.error('لا أملك صلاحية الاتصال بهذا الروم الصوتي.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      await voiceSticky.joinSticky(interaction.client, channel);
    } catch (err) {
      console.error('[دخول_صوتي] فشل الاتصال:', err);
      return interaction.editReply({ embeds: [embeds.error('فشل الاتصال بالروم الصوتي. تأكد من صلاحيات البوت.')] });
    }

    guildConfig.set(interaction.guild.id, { stickyVoiceChannelId: channel.id });

    await interaction.editReply({
      embeds: [
        embeds.success(
          `🔊 دخل البوت الآن للروم الصوتي **${channel.name}** وسيبقى فيه بشكل ثابت مع حماية تلقائية ضد الإخراج أو النقل.\nلإخراجه استخدم \`/خروج_صوتي\`.`
        ),
      ],
    });

    await sendLog(
      interaction.guild,
      'voice',
      embeds.info(`**الروم:** ${channel.name}\n**بواسطة:** ${interaction.user.tag}`, '🔊 تفعيل الوضع الصوتي الثابت')
    );
  },
};
