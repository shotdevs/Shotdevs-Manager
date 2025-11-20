const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pricing')
    .setDescription('Show ShotDevs pricing panel (bot + website).'),

  /**
   * Sends the main pricing embed with two buttons.
   * Clicking the buttons is handled in interactionCreate button handler and responds EPHEMERALLY.
   */
  async execute(interaction) {
    // Build main summary embed (intro + short bullets)
    const mainEmbed = new EmbedBuilder()
      .setTitle('🛠️ ShotDevs • Services & Pricing')
      .setColor(0xE53935)
      .setDescription(
        "Affordable, transparent pricing for Discord bots and websites — no hidden fees.\n\n" +
        "**What we offer:**\n" +
        "• Discord bot development (from basic moderation bots to full custom solutions)\n" +
        "• Website & web app development (static, dynamic, full-stack)\n\n" +
        "Click a button below to view detailed pricing for each service. If you need a custom quote, use the `Create Ticket` option inside the detailed pricing or your ticket system."
      )
      .setFooter({ text: '© ShotDevs' })
      .setTimestamp();

    // Buttons: Discord Bot Pricing and Website Pricing
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pricing_bot')
        .setLabel('Discord Bot Pricing')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🤖'),
      new ButtonBuilder()
        .setCustomId('pricing_web')
        .setLabel('Website Pricing')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🌐')
    );

    // Send the message (public) that contains the buttons and main embed
    // We do NOT mark this ephemeral because the user asked for ephemeral detail replies only.
    await interaction.reply({ embeds: [mainEmbed], components: [row] });
  }
};
