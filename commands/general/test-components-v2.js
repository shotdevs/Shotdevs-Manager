const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
  container,
  section,
  textDisplay,
  separator,
  button,
  actionRow,
  thumbnail,
  replyComponentsV2
} = require('../../utils/componentsV2Builder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test-components-v2')
    .setDescription('Test Components V2 layouts (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('feature')
        .setDescription('Feature to preview')
        .setRequired(true)
        .addChoices(
          { name: 'Help Command', value: 'help' },
          { name: 'Bot Info', value: 'botinfo' },
          { name: 'Server Info', value: 'serverinfo' },
          { name: 'User Info', value: 'userinfo' },
          { name: 'Ticket Panel', value: 'ticket' },
          { name: 'Moderation', value: 'moderation' },
          { name: 'Announcement', value: 'announce' },
          { name: 'Leaderboard', value: 'leaderboard' },
          { name: 'Simple Test', value: 'simple' }
        )),

  async execute(interaction) {
    const feature = interaction.options.getString('feature');

    try {
      switch (feature) {
        case 'simple':
          await this.testSimple(interaction);
          break;
        case 'help':
          await this.testHelp(interaction);
          break;
        case 'botinfo':
          await this.testBotInfo(interaction);
          break;
        case 'serverinfo':
          await this.testServerInfo(interaction);
          break;
        case 'userinfo':
          await this.testUserInfo(interaction);
          break;
        case 'ticket':
          await this.testTicket(interaction);
          break;
        case 'moderation':
          await this.testModeration(interaction);
          break;
        case 'announce':
          await this.testAnnounce(interaction);
          break;
        case 'leaderboard':
          await this.testLeaderboard(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown feature', ephemeral: true });
      }
    } catch (error) {
      console.error('Test Components V2 error:', error);
      await interaction.reply({ 
        content: `Error testing Components V2: ${error.message}`,
        ephemeral: true 
      });
    }
  },

  async testSimple(interaction) {
    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: '# Simple Test\nThis is a simple Components V2 message with transparent container.' 
            }),
            separator(),
            section({ 
              content: '**Bold text**, *italic text*, `code text`\n\n🎉 Emojis work too!' 
            }),
            separator(),
            actionRow([
              button({ custom_id: 'test_btn', label: 'Test Button', style: 1 }),
              button({ url: 'https://discord.com', label: 'Link Button', style: 5 })
            ])
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testHelp(interaction) {
    const botAvatar = interaction.client.user.displayAvatarURL({ size: 128 });

    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: '# 📚 Bot Commands\nHere are all available commands organized by category.',
              accessory: thumbnail(botAvatar)
            }),
            separator(),
            section({ 
              content: '## General Commands\n**`/help`** - Shows this help menu\n**`/botinfo`** - Display bot information\n**`/ping`** - Check bot latency' 
            }),
            separator(),
            section({ 
              content: '## Moderation Commands\n**`/ban`** - Ban a user from the server\n**`/kick`** - Kick a user from the server\n**`/warn`** - Warn a user' 
            }),
            separator(),
            actionRow([
              button({ url: 'https://discord.com', label: 'Website', style: 5 }),
              button({ url: 'https://github.com', label: 'GitHub', style: 5 }),
              button({ url: 'https://discord.gg/support', label: 'Support Server', style: 5 })
            ])
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testBotInfo(interaction) {
    const botAvatar = interaction.client.user.displayAvatarURL({ size: 128 });

    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: `# ${interaction.client.user.username}\nProfessional Discord Bot`,
              accessory: thumbnail(botAvatar)
            }),
            separator(),
            section({ 
              content: '## General Information\n**Bot Name:** Shotdevs Manager\n**Version:** 2.0.0\n**Developer:** Shotdevs' 
            }),
            separator(),
            section({ 
              content: '## Statistics\n**Servers:** 150\n**Users:** 45,000\n**Commands:** 25' 
            }),
            separator(),
            section({ 
              content: `**Requested by:** ${interaction.user.tag}` 
            })
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testServerInfo(interaction) {
    const guildIcon = interaction.guild.iconURL({ size: 128 }) || interaction.client.user.displayAvatarURL({ size: 128 });

    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: `# ${interaction.guild.name}\nServer Information`,
              accessory: thumbnail(guildIcon)
            }),
            separator(),
            section({ 
              content: `👑 **Owner:** <@${interaction.guild.ownerId}>\n👥 **Members:** ${interaction.guild.memberCount}\n🚀 **Boosts:** ${interaction.guild.premiumSubscriptionCount || 0}\n📅 **Created:** <t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>\n📜 **Server ID:** ${interaction.guild.id}` 
            })
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testUserInfo(interaction) {
    const userAvatar = interaction.user.displayAvatarURL({ size: 128 });

    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: `# ${interaction.user.username}\nUser Information`,
              accessory: thumbnail(userAvatar)
            }),
            separator(),
            section({ 
              content: `**Tag:** ${interaction.user.tag}\n**ID:** ${interaction.user.id}\n**Bot:** ${interaction.user.bot ? 'Yes' : 'No'}\n**Account Created:** <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:R>` 
            })
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testTicket(interaction) {
    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: '# 🎟️ Support Tickets\nClick a button below to create a ticket.' 
            }),
            separator(),
            section({ 
              content: '**🛒 Order Ticket** - For order-related inquiries\n**❓ Enquiry Ticket** - For general questions\n**🎟️ Support Ticket** - For technical support' 
            }),
            separator(),
            actionRow([
              button({ custom_id: 'create_order_ticket', label: 'Order', style: 1, emoji: '🛒' }),
              button({ custom_id: 'create_enquiry_ticket', label: 'Enquiry', style: 2, emoji: '❓' }),
              button({ custom_id: 'create_support_ticket', label: 'Support', style: 3, emoji: '🎟️' })
            ])
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testModeration(interaction) {
    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: '# You have been banned\nYou have been banned from the server.' 
            }),
            separator(),
            section({ 
              content: `**Server:** ${interaction.guild.name}\n**Reason:** Breaking server rules` 
            })
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testAnnounce(interaction) {
    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: '# 📢 Important Announcement\nThis is a test announcement message.' 
            }),
            separator(),
            section({ 
              content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is the announcement content with **bold** and *italic* text.' 
            }),
            separator(),
            section({ 
              content: `**Announcement by:** ${interaction.user.tag}` 
            })
          ]
        })
      ],
      ephemeral: true
    });
  },

  async testLeaderboard(interaction) {
    await replyComponentsV2(interaction, {
      components: [
        container({
          components: [
            section({ 
              content: `# 🏆 ${interaction.guild.name} Leaderboard\nTop users by XP` 
            }),
            separator(),
            section({ 
              content: '**1.** User#1234 - 12,345 XP\n**2.** User#5678 - 10,000 XP\n**3.** User#9012 - 8,500 XP\n**4.** User#3456 - 7,200 XP\n**5.** User#7890 - 6,100 XP' 
            }),
            separator(),
            section({ 
              content: '**Page 1 of 3**' 
            })
          ]
        })
      ],
      ephemeral: true
    });
  }
};
