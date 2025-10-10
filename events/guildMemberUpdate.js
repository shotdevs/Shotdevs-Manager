const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        try {
            if (oldMember.nickname !== newMember.nickname) {
                logEvent(`✏️ Member nickname changed: **${newMember.user.tag}** — ${oldMember.nickname || 'none'} -> ${newMember.nickname || 'none'}`);
            }
            // Additional member updates can be logged here
        } catch (err) {
            // swallow errors
        }
    }
};
