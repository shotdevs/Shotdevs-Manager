const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

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

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord Blurple color
            .setAuthor({ 
                name: interaction.client.user.username, 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                // General Information
                { 
                    name: '📜 General Info', 
                    value: `**Developer:** \`${owner}\`\n**Bot ID:** \`${interaction.client.user.id}\`\n**Created On:** <t:${Math.floor(interaction.client.user.createdTimestamp / 1000)}:F>`, 
                    inline: false 
                },
                // Statistics
                { 
                    name: '📊 Statistics', 
                    value: `**Servers:** \`${interaction.client.guilds.cache.size}\`\n**Users:** \`${interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\`\n**Channels:** \`${interaction.client.channels.cache.size}\``, 
                    inline: true 
                },
                // System Information
                { 
                    name: '⚙️ System Info', 
                    value: `**Discord.js:** \`v${version}\`\n**Node.js:** \`${process.version}\`\n**Memory:** \`${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\`\n**Uptime:** \`${uptimeString}\``, 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        // Send the embed
        await interaction.editReply({ embeds: [embed] });
    },
};
