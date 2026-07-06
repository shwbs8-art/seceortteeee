const DISCORD_INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;
const URL_REGEX = /https?:\/\/[^\s]+/i;

function containsDiscordInvite(content) {
  return DISCORD_INVITE_REGEX.test(content);
}

function containsLink(content) {
  return URL_REGEX.test(content);
}

module.exports = { containsDiscordInvite, containsLink };
