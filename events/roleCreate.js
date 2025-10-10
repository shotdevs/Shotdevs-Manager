const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.RoleCreate,
    async execute(role) {
        logEvent(`🔧 Role created: **${role.name}** (ID: ${role.id}) in **${role.guild.name}**`);
    }
};
