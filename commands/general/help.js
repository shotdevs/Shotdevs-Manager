const { SlashCommandBuilder } = require('discord.js');
const {
    container,
    section,
    separator,
    button,
    actionRow,
    thumbnail,
    replyComponentsV2
} = require('../../utils/componentsV2Builder');

// Category emojis and descriptions
const CATEGORY_INFO = {
    general: {
        emoji: '🔧',
        description: 'General purpose commands'
    },
    moderation: {
        emoji: '🛡️',
        description: 'Moderation and server management'
    },
    levels: {
        emoji: '📊',
        description: 'Leveling system and rankings'
    },
    utility: {
        emoji: '🛠️',
        description: 'Utility and configuration commands'
    }
};

module.exports = {
    category: 'General',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands.'),
    async execute(interaction) {
        const commands = interaction.client.commands;
        const categories = {};

        // Group commands by category
        commands.forEach(command => {
            const category = command.category || 'General';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });

        // Build Components V2 container with sections for each category
        const botAvatar = interaction.client.user.displayAvatarURL({ size: 128 });
        const totalCommands = commands.size;
        
        // Build container components array
        const containerComponents = [];
        
        // Header section with bot avatar
        containerComponents.push(
            section({
                content: `# 🤖 Shotdevs Manager Commands\n\nHere's a list of all available commands, sorted by category.\nClick on any command to use it!`,
                accessory: thumbnail(botAvatar)
            })
        );

        // Add separator before categories
        containerComponents.push(separator());

        // Add each category as a section
        const categoryEntries = Object.entries(categories);
        categoryEntries.forEach(([categoryName, categoryCommands], index) => {
            const formattedCategoryName = categoryName.toLowerCase();
            const info = CATEGORY_INFO[formattedCategoryName] || { 
                emoji: '📁',
                description: `${categoryName} commands`
            };

            // Create clickable command mentions if IDs are available
            const commandList = categoryCommands.map(cmd => {
                const mention = cmd.id ? `</${cmd.data.name}:${cmd.id}>` : `\`/${cmd.data.name}\``;
                return `• ${mention} — ${cmd.data.description}`;
            }).join('\n');

            // Add category section
            containerComponents.push(
                section({
                    content: `## ${info.emoji} ${categoryName}\n${info.description}\n\n${commandList}`
                })
            );

            // Add separator after each category (except last one)
            if (index < categoryEntries.length - 1) {
                containerComponents.push(separator());
            }
        });

        // Add final separator before footer
        containerComponents.push(separator());

        // Add footer section
        containerComponents.push(
            section({
                content: `**${totalCommands} commands available** • Type / to get started`
            })
        );

        // Add separator before buttons
        containerComponents.push(separator());

        // Add link buttons inside container
        containerComponents.push(
            actionRow([
                button({
                    url: 'https://shotdevs.live',
                    label: '🌐 Visit Website',
                    style: 5
                }),
                button({
                    url: 'https://github.com/shotdevs',
                    label: '💻 GitHub',
                    style: 5
                }),
                button({
                    url: 'https://discord.gg/shotdevs',
                    label: '🎮 Join Discord',
                    style: 5
                })
            ])
        );

        // Send Components V2 message
        await replyComponentsV2(interaction, {
            components: [
                container({
                    components: containerComponents
                })
            ],
            ephemeral: true
        });
    },
};
