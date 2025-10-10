const { Events } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
  name: Events.MessageReactionAdd,
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

      // Build emoji key (supports both normal and custom emojis)
      const emojiKey = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;

      const roleId = reactionRoleData[emojiKey];
      if (!roleId) return;

      const role = guild.roles.cache.get(roleId);
      const member = await guild.members.fetch(user.id);

      if (!role) return console.log(`⚠️ Role not found for ID ${roleId}`);
      if (!member) return console.log(`⚠️ Member not found for user ${user.id}`);

      await member.roles.add(role);
      console.log(`✅ Added role "${role.name}" to ${member.user.tag}`);
    } catch (err) {
      console.error('❌ Error in messageReactionAdd event:', err);
    }
  },
};
