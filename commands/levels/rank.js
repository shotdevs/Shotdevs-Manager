const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { RankCardBuilder, Font } = require('canvacord');
const Level = require('../../models/Level');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your rank or another user\'s rank card.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to view their rank')
                .setRequired(false)
        ),

    async execute(interaction) {
        // safe defer
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false });
        }

        try {
            // Load Canvacord default font if available
            if (Font && typeof Font.loadDefault === 'function') {
                Font.loadDefault();
            }

            const target = interaction.options.getUser('target') || interaction.user;
            let member = await interaction.guild.members.fetch(target.id).catch(() => null);

            // Get DB values
            let memberData = await Level.findOne({ guildId: interaction.guild.id, userId: target.id });
            const currentXP = Number(memberData?.xp) || 0;
            const currentLevel = Number(memberData?.level) || 0;

            // Rank calculation
            const allMembers = await Level.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
            let userRank = allMembers.findIndex(m => String(m.userId) === String(target.id)) + 1;
            if (!userRank || userRank <= 0) userRank = allMembers.length + (memberData ? 0 : 1);

            const nextLevelXP = Number((currentLevel + 1) * 100) || 100;

            // Build rank card with Canvacord (simple)
            const rankCard = new RankCardBuilder()
                .setAvatar(target.displayAvatarURL({ extension: 'png' }))
                .setCurrentXP(currentXP)
                .setLevel(currentLevel)
                .setRank(userRank)
                .setRequiredXP(nextLevelXP)
                .setDisplayName(target.username)
                .setStatus(member?.presence?.status || "offline")
                .setBackground("https://iili.io/KNehlZ7.png")
                .setOverlay(0); // <- removes the grey overlay

            const cardBuffer = await rankCard.build({ format: 'png' });
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

            // reply
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ files: [attachment] });
            } else {
                await interaction.reply({ files: [attachment] });
            }

        } catch (err) {
            console.error(err);
            // safe error reply
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ An error occurred while generating the rank card.', ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to notify user:', e);
            }
        }
    }
};
