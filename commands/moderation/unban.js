const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    container,
    section,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

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
            
            // Send success confirmation with Components V2
            await replyComponentsV2(interaction, {
                components: [
                    container({
                        components: [
                            section({
                                content: `✅ Successfully unbanned user with ID **${userId}**`
                            })
                        ]
                    })
                ]
            });
        } catch (error) {
            console.error(error);
            
            // Send error message with Components V2
            await replyComponentsV2(interaction, {
                components: [
                    container({
                        components: [
                            section({
                                content: `❌ Could not unban user. Make sure the ID **${userId}** is correct and the user is actually banned.`
                            })
                        ]
                    })
                ]
            });
        }
    },
};
