const { Events } = require('discord.js');
const { logEvent } = require('../logger');
const Level = require('../models/Level'); // ✅ Import XP model

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // --- Ignore bot messages or DMs ---
        if (!message.guild || message.author?.bot) return;

        // --- Log message (your existing function) ---
        logEvent(`💬 Message sent in #${message.channel?.name || 'unknown'} by **${message.author.tag}**: ${message.content?.slice(0, 1900)}`);

        // --- XP + Level System ---
        try {
            const xpAdd = Math.floor(Math.random() * 10) + 5; // random XP (5–15)
            const guildId = message.guild.id;
            const userId = message.author.id;

            let user = await Level.findOne({ guildId, userId });
            if (!user) user = new Level({ guildId, userId });

            user.xp += xpAdd;

            // XP formula
            const requiredXP = 5 * (user.level ** 2) + 50 * user.level + 100;
            if (user.xp >= requiredXP) {
                user.level += 1;
                user.xp -= requiredXP;

                message.channel.send({
                    content: `🎉 Congrats <@${userId}>! You reached **Level ${user.level}**!`,
                });
            }

            await user.save();
        } catch (err) {
            console.error("❌ Error tracking XP:", err);
        }
    }
};
