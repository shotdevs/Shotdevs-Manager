const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const MemberProfile = require('../../models/MemberProfile'); // Import the new model
const {
    container,
    section,
    separator,
    sendComponentsV2Message,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

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

        // Send DM to user with Components V2
        try {
            await sendComponentsV2Message(interaction.client, (await target.createDM()).id, {
                components: [
                    container({
                        components: [
                            section({
                                content: '# You have received a warning'
                            }),
                            separator(),
                            section({
                                content: `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}`
                            })
                        ]
                    })
                ]
            });
        } catch (err) {
            console.log(`Could not DM user ${target.tag}.`);
        }

        // Send confirmation with Components V2
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `⚠️ Successfully warned **${target.tag}**\n\n**Reason:** ${reason}`
                        })
                    ]
                })
            ],
            ephemeral: true
        });
    },
};
