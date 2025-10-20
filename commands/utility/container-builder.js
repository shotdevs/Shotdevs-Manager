const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags,
    EmbedBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    StringSelectMenuBuilder,
    SelectMenuOptionBuilder,
    FileBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SectionBuilder,
    ThumbnailBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('container-builder')
        .setDescription('Build a custom container with multiple sections and text inputs.'),

    async execute(interaction) {
        // --- 1. Initial Setup and Collector ---
        try {
            // An array to hold all the section components we build
            const sections = [];

            // Initial embed to guide the user
            const editorEmbed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('Container Builder Pro')
                .setDescription('Your container is currently empty. Click the buttons below to add sections or create a sample container!')
                .setFooter({ text: 'You have 5 minutes to build this container.' });

            // Initial buttons for the editor
            const editorButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('add_section')
                        .setLabel('Add Section')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('➕'),
                    new ButtonBuilder()
                        .setCustomId('create_sample')
                        .setLabel('Create Sample')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📝'),
                    new ButtonBuilder()
                        .setCustomId('finish_container')
                        .setLabel('Finish')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✅')
                );

            // Send the initial reply which will be our "editor" message
            const response = await interaction.reply({
                embeds: [editorEmbed],
                components: [editorButtons],
                flags: MessageFlags.Ephemeral // Use flags instead of ephemeral
            });

            // Create an interaction collector to listen for button clicks
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 minutes
            });

            // Handle button interactions
            collector.on('collect', async (i) => {
                try {
                    if (i.customId === 'create_sample') {
                        // Create a sample container with various components
                        const container = new ContainerBuilder()
                            .setAccentColor(9225410)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("Example components:")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("\nButtons")
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Link)
                                            .setLabel("Buttons that")
                                            .setURL("https://google.com"),
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Primary)
                                            .setLabel("you can")
                                            .setCustomId("sample_button_1"),
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Secondary)
                                            .setLabel("drag around")
                                            .setCustomId("sample_button_2")
                                    )
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("\nSelect menus")
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId("sample_menu")
                                            .setMaxValues(3)
                                            .addOptions(
                                                new SelectMenuOptionBuilder()
                                                    .setLabel("Test selection")
                                                    .setValue("test_value")
                                                    .setDescription("test")
                                                    .setDefault(true)
                                                    .setEmoji("😜"),
                                                new SelectMenuOptionBuilder()
                                                    .setLabel("Other selection")
                                                    .setValue("other_value")
                                            )
                                    )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setSpacing(SeparatorSpacingSize.Small)
                                    .setDivider(true)
                            )
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setButtonAccessory(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Link)
                                            .setLabel("Learn More")
                                            .setURL("https://shotdevs.live")
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder()
                                            .setContent("This is a sample section with a button accessory.")
                                    )
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("\nImages & Media")
                            )
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder()
                                    .addItems(
                                        new MediaGalleryItemBuilder()
                                            .setURL("https://avatars.githubusercontent.com/u/77593673?s=128"),
                                    )
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("\nFiles & Attachments")
                            )
                            .addFileComponents(
                                new FileBuilder()
                                    .setURL("attachment://example.pdf")
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setSpacing(SeparatorSpacingSize.Medium)
                                    .setDivider(true)
                            )
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setThumbnailAccessory(
                                        new ThumbnailBuilder()
                                            .setURL("https://avatars.githubusercontent.com/u/77593673?s=128")
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder()
                                            .setContent("This is a section with a thumbnail accessory. Perfect for user profiles or item displays!")
                                    )
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent("**Rich Text Formatting Examples:**\n")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent("• *Italic text* for emphasis\n• **Bold text** for strong emphasis\n• __Underlined text__ for highlighting\n• ~~Strikethrough~~ for crossed-out text\n• `Code blocks` for technical content\n• > Blockquotes for citations")
                            );

                        // Send the sample container
                        await interaction.channel.send({
                            components: [container]
                        });

                        // Update the editor message
                        await i.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x00FF00)
                                    .setDescription('Sample container has been created!')
                            ],
                            components: [] // Remove the buttons
                        });

                        // Stop the collector
                        collector.stop('completed');
                        return;
                    }

                    if (i.customId === 'add_section') {
                        // ... (rest of your existing add_section code)
                    }

                    if (i.customId === 'finish_container') {
                        // ... (rest of your existing finish_container code)
                    }
                } catch (error) {
                    console.error('Error handling button interaction:', error);
                    await i.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription('An error occurred while processing your request.')
                        ],
                        components: []
                    }).catch(console.error);
                }
            });

            // Handle collector end
            collector.on('end', (collected, reason) => {
                if (reason !== 'completed') {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFFCC00)
                                .setTitle('Container Builder Timed Out')
                                .setDescription('You took too long to respond. Please run the command again.')
                        ],
                        components: []
                    }).catch(console.error);
                }
            });

        } catch (error) {
            console.error('Error in container-builder command:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('An error occurred while setting up the container builder.')
                ],
                flags: MessageFlags.Ephemeral
            }).catch(console.error);
        }

        // Create an interaction collector to listen for button clicks on our editor message
        const collector = editorMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000, // 5 minutes
        });

        // --- 2. Handling Button Clicks ---

        collector.on('collect', async i => {
            // --- FINISH BUTTON ---
            if (i.customId === 'finish_container') {
                // Check if any sections were added
                if (sections.length === 0) {
                    await i.update({
                        embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('You cannot finish an empty container. Please add at least one section.')],
                        components: [editorButtons] // Keep the buttons
                    });
                    return;
                }

                // Let the user know the public message is being sent
                await i.update({
                    embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription('Container finished! Sending the final message publicly...')],
                    components: [] // Remove buttons
                });

                // Send the final message to the channel with all sections
                await interaction.channel.send({
                    components: sections
                });

                // Stop the collector
                return collector.stop('finished');
            }

            // --- ADD SECTION BUTTON ---
            if (i.customId === 'add_section') {
                // Create the modal for adding a section
                const sectionModal = new ModalBuilder()
                    .setCustomId(`section_modal_${i.id}`) // Use interaction ID for a unique modal ID
                    .setTitle('Add a New Section');

                // Create text inputs for the modal
                const sectionContentInput = new TextInputBuilder()
                    .setCustomId('section_content')
                    .setLabel("Section Text Content (Markdown supported)")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const buttonTextInput = new TextInputBuilder()
                    .setCustomId('button_text')
                    .setLabel("Button Text (Optional)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const buttonUrlInput = new TextInputBuilder()
                    .setCustomId('button_url')
                    .setLabel("Button URL (Optional)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                // Add inputs to action rows and then to the modal
                sectionModal.addComponents(
                    new ActionRowBuilder().addComponents(sectionContentInput),
                    new ActionRowBuilder().addComponents(buttonTextInput),
                    new ActionRowBuilder().addComponents(buttonUrlInput)
                );

                // Show the modal to the user
                await i.showModal(sectionModal);

                // --- 3. Handling Modal Submission ---

                // Wait for the modal to be submitted
                const modalSubmit = await i.awaitModalSubmit({
                    time: 60000, // 1 minute to fill out the modal
                    filter: submitInteraction => submitInteraction.customId === `section_modal_${i.id}`,
                }).catch(console.error);

                if (modalSubmit) {
                    // Get the data from the modal fields
                    const content = modalSubmit.fields.getTextInputValue('section_content');
                    const buttonText = modalSubmit.fields.getTextInputValue('button_text');
                    const buttonUrl = modalSubmit.fields.getTextInputValue('button_url');

                    // Construct the section component
                    const newSection = {
                        type: 1, // Action Row Component
                        components: [{
                            type: 4, // Rich Text Component
                            content: content,
                            components: []
                        }]
                    };

                    // If a button text and URL are provided, add it as a separate action row
                    if (buttonText && buttonUrl) {
                        sections.push({
                            type: 1, // Action Row Component
                            components: [{
                                type: 2, // Button Component
                                style: ButtonStyle.Link,
                                label: buttonText,
                                url: buttonUrl
                            }]
                        });
                    }

                    // Add the newly created section to our sections array
                    sections.push(newSection);

                    // Update the editor embed to show the new section count
                    const updatedEmbed = EmbedBuilder.from(editorEmbed)
                        .setDescription(`Your container now has **${sections.length}** section(s). Add more or click finish.`)

                    // Acknowledge the modal submission and update the editor message
                    await modalSubmit.update({
                        embeds: [updatedEmbed],
                        components: [editorButtons]
                    });
                }
            }
        });

        // --- 4. Handling Collector End ---
        collector.on('end', (collected, reason) => {
            if (reason !== 'finished') {
                // If the collector times out, disable the buttons
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0xFFCC00)
                    .setTitle('Container Builder Timed Out')
                    .setDescription('You took too long to respond. Please run the command again.');

                interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        });
    },
};
