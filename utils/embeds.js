const { EmbedBuilder } = require('discord.js');
const { colors, emojis } = require('../config');

function baseEmbed() {
  return new EmbedBuilder().setTimestamp();
}

module.exports = {
  success(description, title = null) {
    const e = baseEmbed().setColor(colors.success).setDescription(`${emojis.success} ${description}`);
    if (title) e.setTitle(title);
    return e;
  },

  error(description, title = null) {
    const e = baseEmbed().setColor(colors.error).setDescription(`${emojis.error} ${description}`);
    if (title) e.setTitle(title);
    return e;
  },

  warning(description, title = null) {
    const e = baseEmbed().setColor(colors.warning).setDescription(`${emojis.warning} ${description}`);
    if (title) e.setTitle(title);
    return e;
  },

  info(description, title = null) {
    const e = baseEmbed().setColor(colors.info).setDescription(`${emojis.info} ${description}`);
    if (title) e.setTitle(title);
    return e;
  },

  base(title = null, description = null) {
    const e = baseEmbed().setColor(colors.primary);
    if (title) e.setTitle(title);
    if (description) e.setDescription(description);
    return e;
  },
};
