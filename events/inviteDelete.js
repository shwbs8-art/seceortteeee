module.exports = {
  name: 'inviteDelete',
  async execute(invite) {
    const client = invite.client;
    const guildMap = client.inviteCache.get(invite.guild.id);
    if (guildMap) guildMap.delete(invite.code);
  },
};
