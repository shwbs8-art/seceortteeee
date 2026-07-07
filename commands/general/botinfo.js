const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const os = require('os');
const embeds = require('../../utils/embeds');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}ي ${h}س ${m}د ${s}ث`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('معلومات_البوت').setDescription('عرض معلومات تفصيلية عن البوت'),

  async execute(interaction) {
    const client = interaction.client;
    const embed = embeds
      .base('🤖 معلومات البوت — Iraq Babylon')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '📛 اسم البوت', value: client.user.tag, inline: true },
        { name: '🏠 عدد السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 عدد المستخدمين', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
        { name: '📡 عدد الأوامر', value: `${client.commands.size}`, inline: true },
        { name: '⏱️ مدة التشغيل', value: formatUptime(process.uptime()), inline: true },
        { name: '💾 استهلاك الذاكرة', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '⚙️ Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '🖥️ Node.js', value: process.version, inline: true },
        { name: '🧠 نظام التشغيل', value: os.platform(), inline: true }
      )
      .setFooter({ text: 'بوت إدارة وحماية احترافي - Iraq Babylon' });

    await interaction.reply({ embeds: [embed] });
  },
};
