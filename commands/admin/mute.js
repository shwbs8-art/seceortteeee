const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');

async function getOrCreateMutedRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === 'Muted');
  if (role) return role;

  role = await guild.roles.create({
    name: 'Muted',
    color: 'Grey',
    permissions: [],
    reason: 'إنشاء رتبة الكتم تلقائياً',
  });

  for (const [, channel] of guild.channels.cache) {
    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
      await channel
        .permissionOverwrites.edit(role, {
          SendMessages: false,
          AddReactions: false,
          Speak: false,
        })
        .catch(() => null);
    }
  }
  return role;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('كتم')
    .setDescription('كتم عضو بشكل دائم (رتبة Muted) حتى فك الكتم يدوياً')
    .addUserOption((o) => o.setName('العضو').setDescription('العضو المراد كتمه').setRequired(true))
    .addStringOption((o) => o.setName('السبب').setDescription('سبب الكتم').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;
    await interaction.deferReply();

    const target = interaction.options.getUser('العضو');
    const reason = interaction.options.getString('السبب') || 'لم يُحدد سبب';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply({ embeds: [embeds.error('العضو غير موجود بالسيرفر.')] });

    const mutedRole = await getOrCreateMutedRole(interaction.guild);
    await member.roles.add(mutedRole, `${reason} | بواسطة: ${interaction.user.tag}`);

    await interaction.editReply({ embeds: [embeds.success(`تم كتم **${target.tag}** بنجاح.\n**السبب:** ${reason}`)] });

    await sendLog(
      interaction.guild,
      'mod',
      embeds.warning(`**العضو:** ${target.tag} (${target.id})\n**بواسطة:** ${interaction.user.tag}\n**السبب:** ${reason}`, '🔇 كتم عضو')
    );
  },
};
