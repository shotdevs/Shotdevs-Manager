const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands.'),
    async execute(interaction) {
        const commands = interaction.client.commands;
        const categories = {};

        // Group commands by category
        commands.forEach(command => {
            const category = command.category || 'General'; // Default to 'General' if no category is set
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });

        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Bot Commands')
            .setDescription('Here is a list of all available commands, sorted by category.');

        // Add a field for each category
        for (const categoryName in categories) {
            const categoryCommands = categories[categoryName];
            const commandList = categoryCommands.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n');
            
            // Capitalize the first letter of the category name
            const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            
            helpEmbed.addFields({ name: `📂 ${formattedCategoryName}`, value: commandList });
        }

        await interaction.reply({ embeds: [helpEmbed], flags: [ 'Ephemeral' ] });
    },
};
