const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const MemberProfile = require('../../models/MemberProfile'); // Import the new model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warns a member and records the infraction.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) // A good permission level for warnings
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning.')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        
        await interaction.deferReply({ flags: [ 'Ephemeral' ] });

        const warning = {
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason: reason,
            timestamp: new Date()
        };

        // Find the user's profile in the database and add the new warning
        await MemberProfile.findOneAndUpdate(
            { guildId: interaction.guild.id, userId: target.id },
            { $push: { warnings: warning } },
            { upsert: true } // Creates the document if it doesn't exist
        );

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFEE75C) // Yellow
            .setTitle('You have received a warning')
            .addFields(
                { name: 'Server', value: interaction.guild.name },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await target.send({ embeds: [dmEmbed] }).catch(err => {
            console.log(`Could not DM user ${target.tag}.`);
        });

        const confirmationEmbed = new EmbedBuilder()
            .setColor(0x57F287) // Green
            .setDescription(`⚠️ Successfully warned **${target.tag}**. Reason: ${reason}`);

        await interaction.editReply({ embeds: [confirmationEmbed] });
    },
};
