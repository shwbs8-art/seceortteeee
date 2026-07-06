const { MessageFlags } = require('discord.js');
const ticketHandler = require('./ticketHandler');
const embeds = require('../utils/embeds');

async function handleModal(interaction) {
  const id = interaction.customId;

  if (id.startsWith('ticket:modal:')) {
    const type = id.replace('ticket:modal:', '');
    const reason = interaction.fields.getTextInputValue('reason');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const channel = await ticketHandler.createTicketChannel(interaction, type, reason);
      await interaction.editReply({ embeds: [embeds.success(`تم فتح تذكرتك بنجاح: ${channel}`)] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [embeds.error('حدث خطأ أثناء إنشاء التذكرة، حاول مجدداً.')] });
    }
    return;
  }

  if (id.startsWith('ticket:rename_modal:')) {
    const newName = interaction.fields.getTextInputValue('new_name');
    const safeName = newName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF-]/g, '-').slice(0, 90);
    await interaction.channel.setName(safeName).catch(() => null);
    await interaction.reply({ embeds: [embeds.success(`تمت إعادة تسمية الروم إلى **${safeName}**.`)] });
    return;
  }
}

module.exports = { handleModal };
