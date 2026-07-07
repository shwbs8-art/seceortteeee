const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const CATEGORY_LABELS = {
  general: '📌 أوامر عامة',
  admin: '🛡️ أوامر الإدارة',
  tickets: '🎫 أوامر التذاكر',
  settings: '⚙️ أوامر الإعدادات',
};

module.exports = {
  data: new SlashCommandBuilder().setName('مساعدة').setDescription('عرض جميع أوامر البوت مصنفة حسب القسم'),

  async execute(interaction) {
    const client = interaction.client;
    const byCategory = {};

    for (const cmd of client.commands.values()) {
      const cat = cmd.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(cmd.data.name);
    }

    const embed = embeds.base('📖 قائمة أوامر Iraq Babylon', 'اختر قسماً من القائمة أدناه لعرض أوامره، أو تصفح الأقسام هنا مباشرة:');

    for (const [cat, names] of Object.entries(byCategory)) {
      embed.addFields({
        name: CATEGORY_LABELS[cat] || cat,
        value: names.map((n) => `\`/${n}\``).join(' • '),
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('📂 اختر قسماً لعرض تفاصيله')
      .addOptions(
        Object.keys(byCategory).map((cat) => ({
          label: CATEGORY_LABELS[cat] || cat,
          value: cat,
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
