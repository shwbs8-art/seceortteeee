const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('بنق').setDescription('عرض سرعة استجابة البوت'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [embeds.info('جاري الحساب...')],
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      embeds: [
        embeds
          .base('🏓 نتيجة البنق')
          .addFields(
            { name: 'زمن الاستجابة', value: `\`${latency}ms\``, inline: true },
            { name: 'زمن الـ API', value: `\`${apiLatency}ms\``, inline: true }
          ),
      ],
    });
  },
};
