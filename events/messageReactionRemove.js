const { Events } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
  name: Events.MessageReactionRemove,
  async execute(reaction, user) {
    if (user.bot) return;

    try {
      // Fetch missing data if partial
      if (reaction.partial) await reaction.fetch();
      if (user.partial) await user.fetch();

      const guild = reaction.message.guild;
      if (!guild) return;

      const config = await getConfig(guild.id);
      const reactionRoleData = config.reactionRoles?.[reaction.message.id];
      if (!reactionRoleData) return; // not a panel

      const emojiKey = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;

      const roleId = reactionRoleData[emojiKey];
      if (!roleId) return;

      const role = guild.roles.cache.get(roleId);
      const member = await guild.members.fetch(user.id);

      if (!role) return console.log(`⚠️ Role not found for ID ${roleId}`);
      if (!member) return console.log(`⚠️ Member not found for user ${user.id}`);

      await member.roles.remove(role);
      console.log(`🚫 Removed role "${role.name}" from ${member.user.tag}`);
    } catch (err) {
      console.error('❌ Error in messageReactionRemove event:', err);
    }
  },
};
