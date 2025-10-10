const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const canvacord = require('canvacord'); // <-- 1. CHANGED THIS LINE
const MemberProfile = require('../../models/MemberProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your rank and level.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to view their rank')
                .setRequired(false)
        ),

    async execute(interaction) {
        // Defer reply to prevent interaction timeout for image generation
        await interaction.deferReply();

        try {
            const target = interaction.options.getUser('target') || interaction.user;

            let memberData = await MemberProfile.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!memberData) {
                memberData = { xp: 0, level: 0 }; // Use a default object if no user data
            }

            const allMembers = await MemberProfile.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
            const userRank = allMembers.findIndex(m => m.userId === target.id) + 1 || allMembers.length + 1;

            const nextLevelXP = (memberData.level + 1) * 100;

            // Create rank card
            const rankCard = new canvacord.Rank() // <-- 2. CHANGED THIS LINE
                .setAvatar(target.displayAvatarURL({ extension: 'png' }))
                .setCurrentXP(memberData.xp)
                .setLevel(memberData.level)
                .setRank(userRank, 'Rank')
                .setRequiredXP(nextLevelXP)
                .setUsername(target.username)
                // Discriminator is deprecated in Discord, canvacord handles this automatically
                // .setDiscriminator(target.discriminator) 
                .setStatus(interaction.guild.members.cache.get(target.id)?.presence?.status || "offline")
                .setProgressBar('#FFFFFF', 'COLOR')
                .setBackground("IMAGE", "https://i.ibb.co/9N6y0sM/custom-bg.png");

            const cardBuffer = await rankCard.build();

            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (err) {
            console.error(err);
            // Fix for the 'ephemeral' warning in your log
            await interaction.editReply({ content: '❌ An error occurred while generating the rank card.', flags: [ 'Ephemeral' ] });
        }
    }
};
