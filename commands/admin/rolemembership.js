const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const { sendLog } = require('../../utils/logger');
const guildConfig = require('../../database/guildConfig');
const { wrapAdminCommand } = require('../../utils/commandWrapper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('حماية_رتب_الاعضاء')
    .setDescription('التحكم بحماية إعطاء/سحب الرتب من الأعضاء، وتحديد رتبة مستثناة من هذه الحماية فقط')
    .addSubcommand((s) => s.setName('عرض').setDescription('عرض حالة هذه الحماية والرتبة المستثناة الحالية'))
    .addSubcommand((s) =>
      s
        .setName('استثناء')
        .setDescription('تحديد رتبة تُعفى فقط من حماية إعطاء/سحب الرتب (لا تُعفى من أي حماية أخرى بالبوت)')
        .addRoleOption((o) => o.setName('الرتبة').setDescription('الرتبة المراد إعفاؤها').setRequired(true))
    )
    .addSubcommand((s) => s.setName('الغاء_الاستثناء').setDescription('إلغاء الرتبة المستثناة الحالية'))
    .addSubcommand((s) =>
      s
        .setName('حد_الاعطاء')
        .setDescription('عدد مرات إعطاء الرتب المسموحة قبل تفعيل العقوبة التلقائية (تصفير الرتب)')
        .addIntegerOption((o) => o.setName('العدد').setDescription('1-50').setRequired(true).setMinValue(1).setMaxValue(50))
    )
    .addSubcommand((s) =>
      s
        .setName('حد_السحب')
        .setDescription('عدد مرات سحب الرتب المسموحة قبل تفعيل العقوبة التلقائية (تصفير الرتب)')
        .addIntegerOption((o) => o.setName('العدد').setDescription('1-50').setRequired(true).setMinValue(1).setMaxValue(50))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  execute: wrapAdminCommand(async (interaction) => {
    if (!(await requireOwner(interaction))) return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'عرض') {
      const cfg = guildConfig.get(guildId);
      const limits = cfg.antiNukeLimits || {};

      await interaction.editReply({
        embeds: [
          embeds.base(
            '🛡️ حماية إعطاء وسحب الرتب من الأعضاء',
            `**الرتبة المستثناة:** ${cfg.exemptRoleId ? `<@&${cfg.exemptRoleId}>` : 'لا يوجد'}\n` +
              `**حد الإعطاء:** ${limits.roleGrant ?? '—'} مرة\n` +
              `**حد السحب:** ${limits.roleRemove ?? '—'} مرة\n\n` +
              `⚠️ الرتبة المستثناة تُعفى **فقط** من هذه الحماية (إعطاء/سحب الرتب من الأعضاء)، وتبقى خاضعة بشكل طبيعي لكل أنظمة الحماية الأخرى (حذف/تعديل الرتب، الرومات، إلخ).`
          ),
        ],
      });
      return;
    }

    if (sub === 'استثناء') {
      const role = interaction.options.getRole('الرتبة');
      guildConfig.set(guildId, { exemptRoleId: role.id });

      await interaction.editReply({
        embeds: [embeds.success(`تم تحديد ${role} كرتبة مستثناة من حماية إعطاء/سحب الرتب فقط.`)],
      });

      await sendLog(interaction.guild, 'security', embeds.info(`**الرتبة:** ${role}\n**بواسطة:** ${interaction.user.tag}`, '🛡️ تحديد رتبة مستثناة'));
      return;
    }

    if (sub === 'الغاء_الاستثناء') {
      guildConfig.set(guildId, { exemptRoleId: null });
      await interaction.editReply({ embeds: [embeds.success('تم إلغاء الرتبة المستثناة.')] });
      await sendLog(interaction.guild, 'security', embeds.info(`**بواسطة:** ${interaction.user.tag}`, '🛡️ إلغاء الرتبة المستثناة'));
      return;
    }

    if (sub === 'حد_الاعطاء') {
      const amount = interaction.options.getInteger('العدد');
      guildConfig.setAntiNukeLimit(guildId, 'roleGrant', amount);
      await interaction.editReply({ embeds: [embeds.success(`تم تحديد حد إعطاء الرتب إلى **${amount}** مرة قبل العقوبة التلقائية.`)] });
      return;
    }

    if (sub === 'حد_السحب') {
      const amount = interaction.options.getInteger('العدد');
      guildConfig.setAntiNukeLimit(guildId, 'roleRemove', amount);
      await interaction.editReply({ embeds: [embeds.success(`تم تحديد حد سحب الرتب إلى **${amount}** مرة قبل العقوبة التلقائية.`)] });
      return;
    }
  }),
};
