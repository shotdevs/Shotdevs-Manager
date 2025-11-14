const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    container,
    section,
    separator,
    sendComponentsV2Message,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning.')),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const member = await interaction.guild.members.fetch(target.id);

        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this user. They may have a higher role than me or I lack permissions.', flags: [ 'Ephemeral' ] });
        }

        // Send DM to user with Components V2
        try {
            await sendComponentsV2Message(interaction.client, (await target.createDM()).id, {
                components: [
                    container({
                        components: [
                            section({
                                content: '# You have been banned'
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

        await member.ban({ reason: reason });

        // Send confirmation with Components V2
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `✅ Successfully banned **${target.tag}**\n\n**Reason:** ${reason}`
                        })
                    ]
                })
            ]
        });

        // --- Moderation Log ---
        try {
            const configManager = require('../../configManager');
            const guildConfig = await configManager.getConfig(interaction.guild.id);
            const modlogChannelId = guildConfig && (guildConfig.modlogChannelId || guildConfig.modLogChannelId || guildConfig.moderationLogChannelId);
            if (modlogChannelId) {
                const modlogChannel = interaction.guild.channels.cache.get(modlogChannelId);
                if (modlogChannel) {
                    await sendComponentsV2Message(interaction.client, modlogChannel.id, {
                        components: [
                            container({
                                components: [
                                    section({
                                        content: '# User Banned'
                                    }),
                                    separator(),
                                    section({
                                        content: `**User:** ${target.tag} (${target.id})\n**Moderator:** ${interaction.user.tag} (${interaction.user.id})\n**Reason:** ${reason}`
                                    })
                                ]
                            })
                        ]
                    });
                }
            }
        } catch (e) {
            console.error('Failed to log to moderation channel:', e);
        }
    },
};
