const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireOwner } = require('../../utils/permissions');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('استعادة نسخة احتياطية سابقة (ينشئ الرومات والرتب الناقصة فقط)')
    .addStringOption((o) => o.setName('backup_id').setDescription('معرّف النسخة الاحتياطية').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!(await requireOwner(interaction))) return;
    await interaction.deferReply();

    const backupId = interaction.options.getString('backup_id');
    const guild = interaction.guild;
    const backups = db.get('backups', guild.id, {});
    const backup = backups[backupId];

    if (!backup) {
      return interaction.editReply({ embeds: [embeds.error('لم يتم العثور على نسخة احتياطية بهذا المعرّف.')] });
    }

    let createdRoles = 0;
    let createdChannels = 0;

    for (const role of backup.roles) {
      const exists = guild.roles.cache.find((r) => r.name === role.name);
      if (!exists) {
        await guild.roles
          .create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            mentionable: role.mentionable,
            permissions: BigInt(role.permissions),
          })
          .catch(() => null);
        createdRoles++;
      }
    }

    for (const channel of backup.channels) {
      const exists = guild.channels.cache.find((c) => c.name === channel.name);
      if (!exists) {
        await guild.channels
          .create({
            name: channel.name,
            type: channel.type === ChannelType.GuildVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
            topic: channel.topic || undefined,
          })
          .catch(() => null);
        createdChannels++;
      }
    }

    await interaction.editReply({
      embeds: [
        embeds.success(
          `تمت استعادة النسخة الاحتياطية \`${backupId}\`.\n**رتب تم إنشاؤها:** ${createdRoles}\n**رومات تم إنشاؤها:** ${createdChannels}\n\n⚠️ لم يتم استعادة الرومات/الرتب الموجودة مسبقاً لتفادي التكرار.`
        ),
      ],
    });
  },
};
