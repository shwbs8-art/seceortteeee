const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const guildConfig = require('../../database/guildConfig');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

const TYPE_CHOICES = [
  { name: 'حذف رومات', value: 'channelDelete' },
  { name: 'إنشاء رومات', value: 'channelCreate' },
  { name: 'تعديل رومات', value: 'channelUpdate' },
  { name: 'حذف رتب', value: 'roleDelete' },
  { name: 'إنشاء رتب', value: 'roleCreate' },
  { name: 'تعديل رتب', value: 'roleUpdate' },
  { name: 'إنشاء Webhook', value: 'webhook' },
  { name: 'منح صلاحية Administrator', value: 'permissionAbuse' },
  { name: 'حظر أعضاء (Ban)', value: 'ban' },
  { name: 'طرد أعضاء (Kick)', value: 'kick' },
  { name: 'تايم أوت لأعضاء', value: 'timeout' },
];

const TYPE_LABELS = Object.fromEntries(TYPE_CHOICES.map((c) => [c.value, c.name]));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('حدود_الحماية')
    .setDescription('التحكم بعدد الأفعال الخطيرة المسموحة قبل تفعيل عقوبة Anti-Nuke التلقائية (تصفير الرتب)')
    .addSubcommand((s) => s.setName('عرض').setDescription('عرض جميع الحدود الحالية لهذا السيرفر'))
    .addSubcommand((s) =>
      s
        .setName('تعيين')
        .setDescription('تحديد حد أقصى لنوع فعل معين قبل العقوبة التلقائية')
        .addStringOption((o) => o.setName('النوع').setDescription('نوع الفعل الخطير').setRequired(true).addChoices(...TYPE_CHOICES))
        .addIntegerOption((o) =>
          o.setName('العدد').setDescription('عدد الأفعال المسموحة قبل العقوبة (1-50)').setRequired(true).setMinValue(1).setMaxValue(50)
        )
    )
    .addSubcommand((s) =>
      s
        .setName('المدة')
        .setDescription('تحديد الفترة الزمنية (بالثواني) التي تُحتسب خلالها الأفعال الخطيرة')
        .addIntegerOption((o) => o.setName('ثواني').setDescription('عدد الثواني (5-300)').setRequired(true).setMinValue(5).setMaxValue(300))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'عرض') {
      const cfg = guildConfig.get(guildId);
      const limits = cfg.antiNukeLimits || {};
      const lines = TYPE_CHOICES.map((c) => `**${c.name}:** ${limits[c.value] ?? '—'} فعل`).join('\n');
      const intervalSec = Math.round((limits.intervalMs || 10000) / 1000);

      await interaction.editReply({
        embeds: [
          embeds.base(
            '🛡️ حدود الحماية الحالية (Anti-Nuke)',
            `${lines}\n\n**الفترة الزمنية المحتسبة:** ${intervalSec} ثانية\n\n⚠️ عند تجاوز أي عضو (حتى لو أدمن أو صاحب رتبة عالية) لهذا الحد، سيتم تصفير جميع رتبه تلقائياً دون حظر أو طرد.`
          ),
        ],
      });
      return;
    }

    if (sub === 'تعيين') {
      const type = interaction.options.getString('النوع');
      const amount = interaction.options.getInteger('العدد');

      guildConfig.setAntiNukeLimit(guildId, type, amount);

      await interaction.editReply({
        embeds: [embeds.success(`تم تحديد حد **${TYPE_LABELS[type]}** إلى **${amount}** فعل قبل تفعيل العقوبة التلقائية.`)],
      });

      await sendLog(
        interaction.guild,
        'security',
        embeds.info(`**النوع:** ${TYPE_LABELS[type]}\n**الحد الجديد:** ${amount}\n**بواسطة:** ${interaction.user.tag}`, '⚙️ تعديل حدود الحماية')
      );
      return;
    }

    if (sub === 'المدة') {
      const seconds = interaction.options.getInteger('ثواني');
      guildConfig.setAntiNukeLimit(guildId, 'intervalMs', seconds * 1000);

      await interaction.editReply({
        embeds: [embeds.success(`تم تحديد الفترة الزمنية المحتسبة لكل الأفعال الخطيرة إلى **${seconds}** ثانية.`)],
      });

      await sendLog(
        interaction.guild,
        'security',
        embeds.info(`**الفترة الجديدة:** ${seconds} ثانية\n**بواسطة:** ${interaction.user.tag}`, '⚙️ تعديل مدة الحماية')
      );
    }
  }),
};
