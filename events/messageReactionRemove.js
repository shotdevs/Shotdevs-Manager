const { Events } = require('discord.js');
const { getConfig } = require('../configManager'); // Adjust path if needed

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        // Ignore reactions from bots
        if (user.bot) return;

        // If the reaction is on a message that might be old, fetch its full data
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        const guildId = reaction.message.guildId;
        if (!guildId) return; // Ignore reactions in DMs

        // Get the server's configuration
        const config = await getConfig(guildId);
        const reactionRoleData = config.reactionRoles?.[reaction.message.id];

        // If the message is not a configured reaction role panel, do nothing
        if (!reactionRoleData) return;
        
        // Find the role ID linked to the specific emoji that was used
        const roleId = reactionRoleData[reaction.emoji.name] || reactionRoleData[reaction.emoji.toString()];
        if (!roleId) return;

        // Get the server, the role, and the member who reacted
        const guild = reaction.message.guild;
        const role = guild.roles.cache.get(roleId);
        const member = await guild.members.fetch(user.id);

        if (role && member) {
            try {
                // Remove the role from the member
                await member.roles.remove(role);
            } catch (err) {
                console.error(`Failed to remove role "${role.name}" from ${member.user.tag}. Check permissions and role hierarchy.`, err);
            }
        }
    },
};
