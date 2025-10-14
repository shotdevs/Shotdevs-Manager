const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a fully custom embed dynamically!'),

  async execute(interaction) {
    // Get all text channels for dropdown
    const guildChannels = interaction.guild.channels.cache
      .filter(ch => ch.isTextBased())
      .map(ch => ({ label: ch.name, value: ch.id }));

    if (!guildChannels.length) return interaction.reply({ content: 'No text channels found!', ephemeral: true });

    const channelSelect = new StringSelectMenuBuilder()
      .setCustomId('select_channel')
      .setPlaceholder('Select the channel to send the embed')
      .addOptions(guildChannels);

    const rowSelect = new ActionRowBuilder().addComponents(channelSelect);

    // Initial embed data
    let embedData = {
      channel: null,
      title: 'Embed Preview',
      description: 'No description yet.',
      color: '#2f3136',
      image: null,
      author: null,
      footer: null,
      timestamp: false
    };

    // Initial preview embed
    const previewEmbed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color);

    // Buttons for modals and actions
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_title').setLabel('Title').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_description').setLabel('Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_color').setLabel('Color').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_image').setLabel('Image URL').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('set_author').setLabel('Author').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('set_footer').setLabel('Footer').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('toggle_timestamp').setLabel('Toggle Timestamp').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('send_embed').setLabel('Send Embed').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cancel_embed').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [previewEmbed], components: [rowSelect, buttons], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10 * 60 * 1000 });

    collector.on('collect', async i => {
      // Channel selection
      if (i.isStringSelectMenu() && i.customId === 'select_channel') {
        embedData.channel = i.values[0];
        await i.update({ content: `Channel selected: <#${embedData.channel}>`, embeds: [previewEmbed], components: [rowSelect, buttons] });
      }

      // Button actions
      if (i.isButton()) {
        // Modals
        if (['set_title', 'set_description', 'set_author', 'set_footer'].includes(i.customId)) {
          let modal = new ModalBuilder().setCustomId(`modal_${i.customId}`).setTitle(`Set ${i.customId.split('_')[1].toUpperCase()}`);
          const input = new TextInputBuilder()
            .setCustomId(i.customId)
            .setLabel(`Enter ${i.customId.split('_')[1]}`)
            .setStyle(['set_description', 'set_footer'].includes(i.customId) ? TextInputStyle.Paragraph : TextInputStyle.Short);

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await i.showModal(modal);
        }

        // Color
        if (i.customId === 'set_color') {
          await i.reply({ content: 'Send hex color code (like `#00E5FF`)', ephemeral: true });
          const msgFilter = m => m.author.id === interaction.user.id;
          const collected = await i.channel.awaitMessages({ filter: msgFilter, max: 1, time: 30000 });
          const color = collected.first()?.content;
          if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) return i.followUp({ content: 'Invalid hex color.', ephemeral: true });
          embedData.color = color;
        }

        // Image URL
        if (i.customId === 'set_image') {
          await i.reply({ content: 'Send the image URL', ephemeral: true });
          const msgFilter = m => m.author.id === interaction.user.id;
          const collected = await i.channel.awaitMessages({ filter: msgFilter, max: 1, time: 30000 });
          embedData.image = collected.first()?.content || null;
        }

        // Toggle timestamp
        if (i.customId === 'toggle_timestamp') {
          embedData.timestamp = !embedData.timestamp;
        }

        // Send embed
        if (i.customId === 'send_embed') {
          if (!embedData.channel) return i.reply({ content: 'Please select a channel first!', ephemeral: true });
          const channel = interaction.guild.channels.cache.get(embedData.channel);
          const finalEmbed = new EmbedBuilder()
            .setTitle(embedData.title)
            .setDescription(embedData.description)
            .setColor(embedData.color)
            .setImage(embedData.image || null)
            .setAuthor(embedData.author ? { name: embedData.author } : null)
            .setFooter(embedData.footer ? { text: embedData.footer } : null)
            .setTimestamp(embedData.timestamp ? new Date() : null);

          await channel.send({ embeds: [finalEmbed] });
          return i.reply({ content: `Embed sent to <#${embedData.channel}>!`, ephemeral: true });
        }

        // Cancel embed
        if (i.customId === 'cancel_embed') {
          collector.stop('cancelled');
          return i.update({ content: 'Embed creation cancelled.', embeds: [], components: [] });
        }

        // Update live preview
        const updatedEmbed = new EmbedBuilder()
          .setTitle(embedData.title)
          .setDescription(embedData.description)
          .setColor(embedData.color)
          .setImage(embedData.image || null)
          .setAuthor(embedData.author ? { name: embedData.author } : null)
          .setFooter(embedData.footer ? { text: embedData.footer } : null)
          .setTimestamp(embedData.timestamp ? new Date() : null);

        await interaction.editReply({ embeds: [updatedEmbed], components: [rowSelect, buttons] });
      }
    });

    // Handle modals
    const modalCollector = interaction.channel.createModalSubmitCollector({ filter, time: 10 * 60 * 1000 });
    modalCollector.on('collect', async modal => {
      if (modal.customId.startsWith('modal_')) {
        const field = modal.customId.split('_')[1]; // title, description, author, footer
        embedData[field] = modal.fields.getTextInputValue(modal.customId);
        const updatedEmbed = new EmbedBuilder()
          .setTitle(embedData.title)
          .setDescription(embedData.description)
          .setColor(embedData.color)
          .setImage(embedData.image || null)
          .setAuthor(embedData.author ? { name: embedData.author } : null)
          .setFooter(embedData.footer ? { text: embedData.footer } : null)
          .setTimestamp(embedData.timestamp ? new Date() : null);
        await modal.update({ embeds: [updatedEmbed], components: [rowSelect, buttons] });
      }
    });
  }
};
