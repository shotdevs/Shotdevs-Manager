const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role-panel')
        .setDescription('Manage the button role panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a new panel message for button roles.')
                .addStringOption(option => option.setName('title').setDescription('The title of the embed.').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('The description of the embed.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds a role button to a panel.')
                .addStringOption(option => option.setName('message-id').setDescription('The ID of the panel message.').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('The role to assign.').setRequired(true))
                .addStringOption(option => option.setName('label').setDescription('The text on the button.').setRequired(true))
                .addStringOption(option => option.setName('emoji').setDescription('The emoji for the button.'))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(0x5865F2);

            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Role panel created successfully.', flags: [ 'Ephemeral' ] });

        } else if (subcommand === 'add') {
            await interaction.deferReply({ flags: [ 'Ephemeral' ] });

            const messageId = interaction.options.getString('message-id');
            const role = interaction.options.getRole('role');
            const label = interaction.options.getString('label');
            const emoji = interaction.options.getString('emoji');

            const targetMessage = await interaction.channel.messages.fetch(messageId).catch(() => null);
            if (!targetMessage) {
                return interaction.editReply('That message ID is invalid or the message is not in this channel.');
            }

            // A unique custom ID for the button, prefixed for identification
            const customId = `button_role_${role.id}`;

            // Check for duplicate roles
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (guildConfig && guildConfig.buttonRoles.some(r => r.roleId === role.id)) {
                return interaction.editReply('This role has already been added to a button.');
            }

            const newButton = new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(label)
                .setStyle(ButtonStyle.Secondary);
            
            if (emoji) {
                newButton.setEmoji(emoji);
            }

            let lastRow = targetMessage.components[targetMessage.components.length - 1];
            if (!lastRow || lastRow.components.length === 5) {
                // Add a new row if the last one is full or doesn't exist
                lastRow = new ActionRowBuilder();
                targetMessage.components.push(lastRow);
            }

            lastRow.addComponents(newButton);

            await targetMessage.edit({ components: targetMessage.components });

            // Save the configuration to the database
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $push: { buttonRoles: { roleId: role.id, customId: customId } } },
                { upsert: true }
            );

            await interaction.editReply(`Successfully added the **${role.name}** button to the panel.`);
        }
    },
};
