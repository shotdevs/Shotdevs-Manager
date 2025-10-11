const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        logEvent(`👋 Member left: **${member.user.tag}** (ID: ${member.id}) from **${member.guild.name}**`);
    }
};
