const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// Helper function to create the embed for each page
const createPageEmbed = (pageIndex) => {
    const embeds = [
        // Page 1: Member & Server Placeholders
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Welcome Message Placeholders (Page 1/4)')
            .setDescription('Use these placeholders in your welcome message with `/set-welcome-message`.')
            .addFields(
                { name: '🧍 Member Placeholders', value: '`{{memberName}}` - User\'s display name (e.g., Shibin)\n`{{memberTag}}` - User\'s full tag (e.g., Shibin#1234)\n`{{memberMention}}` - Mentions the user\n`{{memberID}}` - User\'s unique ID\n`{{memberAvatar}}` - URL of the user\'s avatar\n`{{accountCreated}}` - Date the user\'s account was created' },
                { name: '🏰 Server Placeholders', value: '`{{serverName}}` - This server\'s name\n`{{serverIcon}}` - URL of this server\'s icon\n`{{memberCount}}` - Total members in the server' }
            ),
        
        // Page 2: More Server & Channel Placeholders
        new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('Welcome Message Placeholders (Page 2/4)')
            .addFields(
                { name: '🏰 More Server Placeholders', value: '`{{boostCount}}` - Number of server boosts\n`{{boostLevel}}` - The server\'s boost level\n`{{serverOwner}}` - Mention the server owner\n`{{serverCreated}}` - Date the server was created' },
                { name: '💬 Channel Placeholders', value: '`{{channelMention}}` - Mention a specific channel (e.g., <#12345>)\n`{{rulesChannel}}` - A placeholder for your rules channel' }
            ),

        // Page 3: Invite & Bot Placeholders
        new EmbedBuilder()
            .setColor(0xfee75c)
            .setTitle('Welcome Message Placeholders (Page 3/4)')
            .addFields(
                { name: '💌 Invite Placeholders (Advanced)', value: '`{{inviterName}}` - Name of the inviter\n`{{inviteCode}}` - The invite code used\n`{{inviteUses}}` - Uses on that specific invite code' },
                { name: '⚙️ Bot Placeholders', value: '`{{botName}}` - The bot\'s name\n`{{botUptime}}` - How long the bot has been online' }
            )
            .setFooter({ text: 'Note: Invite tracking requires a more complex setup.' }),

        // Page 4: Miscellaneous Placeholders
        new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Welcome Message Placeholders (Page 4/4)')
            .addFields(
                { name: '🌍 Miscellaneous Placeholders', value: '`{{time}}` - Current time\n`{{date}}` - Current date\n`{{randomEmoji}}` - A random fun emoji' }
            ),
    ];
    return embeds[pageIndex];
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-help')
        .setDescription('Shows an interactive guide of all available welcome message placeholders.'),
    async execute(interaction) {
        let currentPage = 0;

        const initialEmbed = createPageEmbed(currentPage);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous_page')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️')
                .setDisabled(true), // Starts disabled on the first page
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('➡️')
        );

        const message = await interaction.reply({
            embeds: [initialEmbed],
            components: [buttons],
            flags: [ 'Ephemeral' ]
        });

        // Create a collector to listen for button clicks
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // Collector stops after 60 seconds of inactivity
        });

        collector.on('collect', async i => {
            if (i.customId === 'next_page') {
                currentPage++;
            } else if (i.customId === 'previous_page') {
                currentPage--;
            }

            // Update button states based on the current page
            buttons.components[0].setDisabled(currentPage === 0); // Disable "Previous" on page 0
            buttons.components[1].setDisabled(currentPage === 3); // Disable "Next" on the last page (page 3)

            const newEmbed = createPageEmbed(currentPage);

            await i.update({ embeds: [newEmbed], components: [buttons] });
        });

        // When the collector stops, disable the buttons
        collector.on('end', async () => {
            buttons.components.forEach(component => component.setDisabled(true));
            await interaction.editReply({ components: [buttons] });
        });
    },
};
