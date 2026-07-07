module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    const client = invite.client;
    if (!client.inviteCache.has(invite.guild.id)) client.inviteCache.set(invite.guild.id, new Map());
    client.inviteCache.get(invite.guild.id).set(invite.code, invite.uses || 0);
  },
};
