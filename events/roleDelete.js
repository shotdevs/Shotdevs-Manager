const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.RoleDelete,
    async execute(role) {
        logEvent(`🗑️ Role deleted: **${role.name}** (ID: ${role.id}) in **${role.guild.name}**`);
    }
};
