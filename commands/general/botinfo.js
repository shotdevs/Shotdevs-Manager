const { SlashCommandBuilder, version } = require('discord.js');
const os = require('os');
const {
    container,
    section,
    separator,
    thumbnail,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Get detailed information about the bot.'),

    async execute(interaction) {
        // Defer the reply to give the bot time to fetch all the data
        await interaction.deferReply();

        // Fetch the application owner (can be a user or a team)
        const app = await interaction.client.application.fetch();
        const owner = app.owner.tag ? app.owner.tag : app.owner.name;

        // Calculate Uptime
        const uptime = interaction.client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor(uptime / 3600000) % 24;
        const minutes = Math.floor(uptime / 60000) % 60;
        const seconds = Math.floor(uptime / 1000) % 60;
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Get bot avatar
        const botAvatar = interaction.client.user.displayAvatarURL({ size: 128 });

        // Calculate statistics
        const totalServers = interaction.client.guilds.cache.size;
        const totalUsers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = interaction.client.channels.cache.size;
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const createdTimestamp = Math.floor(interaction.client.user.createdTimestamp / 1000);

        // Build Components V2 message
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: [
                        section({
                            content: `# ${interaction.client.user.username}\nBot Information`,
                            accessory: thumbnail(botAvatar)
                        }),
                        separator(),
                        section({
                            content: `## 📜 General Info\n**Developer:** \`${owner}\`\n**Bot ID:** \`${interaction.client.user.id}\`\n**Created On:** <t:${createdTimestamp}:F>`
                        }),
                        separator(),
                        section({
                            content: `## 📊 Statistics\n**Servers:** \`${totalServers}\`\n**Users:** \`${totalUsers}\`\n**Channels:** \`${totalChannels}\``
                        }),
                        separator(),
                        section({
                            content: `## ⚙️ System Info\n**Discord.js:** \`v${version}\`\n**Node.js:** \`${process.version}\`\n**Memory:** \`${memoryUsage} MB\`\n**Uptime:** \`${uptimeString}\``
                        }),
                        separator(),
                        section({
                            content: `**Requested by:** ${interaction.user.tag}`
                        })
                    ]
                })
            ]
        });
    },
};
