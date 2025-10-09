const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // This part handles slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`, error);
                await interaction.reply({ content: 'There was an error while executing this command!', flags: [ 'Ephemeral' ] });
            }
            return;
        }

        // This part handles button clicks
        if (interaction.isButton()) {
            const { customId, guild, user } = interaction;
            const guildConfig = await getConfig(guild.id);
            
            const isTicketCreationButton = ['create_order_ticket', 'create_enquiry_ticket', 'create_support_ticket'].includes(customId);

            if (isTicketCreationButton) {
                const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
                let categoryId;
                let channelName;
                let welcomeMessage;

                // Logic to determine which category to use based on the button clicked
                if (customId === 'create_order_ticket') {
                    categoryId = guildConfig.orderCategoryId;
                    channelName = `order-${user.username}`;
                    welcomeMessage = `Hello ${user}, please provide the details of your order.`;
                } else if (customId === 'create_enquiry_ticket') {
                    categoryId = guildConfig.enquiryCategoryId;
                    channelName = `enquiry-${user.username}`;
                    welcomeMessage = `Hello ${user}, how can we help you with your enquiry today?`;
                } else if (customId === 'create_support_ticket') {
                    categoryId = guildConfig.supportCategoryId;
                    channelName = `support-${user.username}`;
                    welcomeMessage = `Hello ${user}, please describe the issue you need support with.`;
                }

                if (!categoryId || !staffRole) {
                    return interaction.reply({ content: '❌ The ticket system is missing a required category or role setting. Please ask an admin to check the configuration.', flags: [ 'Ephemeral' ] });
                }
                const category = guild.channels.cache.get(categoryId);
                if (!category) {
                    return interaction.reply({ content: '❌ The configured category for this ticket type does not exist. Please contact an admin.', flags: [ 'Ephemeral' ] });
                }

                await interaction.deferReply({ flags: [ 'Ephemeral' ] });
                
                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                        { id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
                    ],
                });

                const ticketEmbed = new EmbedBuilder().setColor(0x57F287).setDescription(welcomeMessage);
                const closeButton = new ButtonBuilder().setCustomId('close_ticket_button').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒');
                const claimButton = new ButtonBuilder().setCustomId('claim_ticket_button').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('🙋');
                const row = new ActionRowBuilder().addComponents(closeButton, claimButton);

                await ticketChannel.send({ content: `${staffRole}`, embeds: [ticketEmbed], components: [row] });
                await interaction.editReply({ content: `Ticket created in ${ticketChannel}!` });
            } 
            else if (customId === 'close_ticket_button') {
                await interaction.reply({ content: 'Saving transcript and closing this ticket...', flags: [ 'Ephemeral' ] });
                // ... rest of close logic
            }
            else if (customId === 'claim_ticket_button') {
                await interaction.deferUpdate();
                // ... rest of claim logic
            }
        }
    },
};
