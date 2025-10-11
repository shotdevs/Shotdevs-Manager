const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option => // Use a StringOption for User ID, as you can't mention a banned user
            option.setName('userid')
                .setDescription('The ID of the user to unban.')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        
        await interaction.deferReply();

        try {
            await interaction.guild.bans.fetch(userId); // Check if the ban exists
            await interaction.guild.members.unban(userId, 'Unbanned by moderator.');
            
            const confirmationEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`✅ Successfully unbanned user with ID **${userId}**.`);
            
            await interaction.editReply({ embeds: [confirmationEmbed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`❌ Could not unban user. Make sure the ID **${userId}** is correct and the user is actually banned.`);
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
