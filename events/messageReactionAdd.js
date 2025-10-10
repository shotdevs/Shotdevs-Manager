const { Events } = require('discord.js');
const { getConfig } = require('../configManager'); // Adjust path if needed

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Ignore reactions from bots to prevent loops
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
                // Add the role to the member
                await member.roles.add(role);
            } catch (err) {
                console.error(`Failed to add role "${role.name}" to ${member.user.tag}. Check permissions and role hierarchy.`, err);
            }
        }
    },
};
