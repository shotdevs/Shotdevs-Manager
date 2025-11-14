const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    separator,
    thumbnail,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Displays information about the current server.'),
    async execute(interaction) {
        const { guild } = interaction;
        const owner = await guild.fetchOwner();
        const guildIcon = guild.iconURL({ size: 128 }) || interaction.client.user.displayAvatarURL({ size: 128 });

        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ${guild.name}\nServer Information`,
                            accessory: thumbnail(guildIcon)
                        }),
                        separator(),
                        section({
                            content: `👑 **Owner:** ${owner.user.tag}\n👥 **Members:** ${guild.memberCount}\n🚀 **Boosts:** ${guild.premiumSubscriptionCount} (Level ${guild.premiumTier})\n📅 **Created On:** <t:${parseInt(guild.createdTimestamp / 1000)}:D>\n📜 **Server ID:** ${guild.id}`
                        })
                    ]
                })
            ]
        });
    },
};
