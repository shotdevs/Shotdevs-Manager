const { Events } = require('discord.js');
const { getConfig } = require('../configManager'); // Adjust path

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        const guildId = reaction.message.guildId;
        if (!guildId) return;

        const config = await getConfig(guildId);
        const reactionRoleData = config.reactionRoles?.[reaction.message.id];
        if (!reactionRoleData) return;

        const roleId = reactionRoleData[reaction.emoji.name] || reactionRoleData[reaction.emoji.toString()];
        if (!roleId) return;

        const guild = reaction.message.guild;
        const role = guild.roles.cache.get(roleId);
        const member = await guild.members.fetch(user.id);

        if (role && member) {
            try {
                await member.roles.add(role);
            } catch (err) {
                console.error(`Failed to add role ${role.name} to ${member.user.tag}`, err);
            }
        }
    },
};
