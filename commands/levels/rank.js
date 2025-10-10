node:events:486                                              throw er; // Unhandled 'error' event                   ^                                                                                                       DiscordAPIError[40060]: Interaction has already been acknowledged.                                                at handleErrors (/data/data/com.termux/files/home/Shotdevs/node_modules/@discordjs/rest/dist/index.js:762:13)                                                        at process.processTicksAndRejections (node:internal/process/task_queues:105:5)                                at async BurstHandler.runRequest (/data/data/com.termux/files/home/Shotdevs/node_modules/@discordjs/rest/dist/index.js:866:23)                                       at async _REST.request (/data/data/com.termux/files/home/Shotdevs/node_modules/@discordjs/rest/dist/index.js:1307:22)
//     at async ChatInputCommandInteraction.reply (/data/data/com.termux/files/home/Shotdevs/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:193:22)                                                     at async Object.execute (/data/data/com.termux/files/home/Shotdevs/events/interactionCreate.js:17:17)     Emitted 'error' event on Client instance at:               at emitUnhandledRejectionOrErr (node:events:391:10)    at process.processTicksAndRejections (node:internal/process/task_queues:92:21) {                            requestBody: {                                           files: [],
    json: {                                                  type: 4,                                               data: {                                                  content: 'There was an error while executing this command!',                                                  tts: false,                                            nonce: undefined,                                      enforce_nonce: false,                                  embeds: undefined,                                     components: undefined,                                 username: undefined,                                   avatar_url: undefined,                                 allowed_mentions: undefined,                           flags: 64,                                             message_reference: undefined,                          attachments: undefined,                                sticker_ids: undefined,                                thread_name: undefined,
            applied_tags: undefined,                               poll: undefined                                      }                                                    }                                                    },                                                     rawError: {
                message: 'Interaction has already been acknowledged.',                                                        code: 40060                                          },                                                     code: 40060,                                           status: 400,                                           method: 'POST',                                        url: 'https://discord.com/api/v10/interactions/1426230672757883154/aW50ZXJhY3Rpb246MTQyNjIzMDY3Mjc1Nzg4MzE1NDp1eWlIbHBDTGYwYVF0eHY3UkhVQXNaejd5V2Vwc21kaGEybll4V0dmNjhOMzFwZG1xUDNKcEZjUWtwQlNtY2lla3A0b1RBME1NejV6azBpSmpWMHdZMFZvV3dLR1dzSFp4U2NLNzBSbzl2bUR4RTJyRGdWOWQ1V0JDY0RXeHllSw/callback?with_response=false'                 }                                                                                                             Node.js v24.9.0
                { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
// We are removing require('canvacord') from the top
const MemberProfile = require('../../models/MemberProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your rank and level.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Select a user to view their rank')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Use RankCardBuilder from canvacord
            const { RankCardBuilder, Font } = await import('canvacord');

            // Ensure the default font is loaded
            if (Font && typeof Font.loadDefault === 'function') {
                Font.loadDefault();
            }

            const target = interaction.options.getUser('target') || interaction.user;
            const member = interaction.guild.members.cache.get(target.id);

            let memberData = await MemberProfile.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!memberData) {
                memberData = { xp: 0, level: 0 };
            }

            const allMembers = await MemberProfile.find({ guildId: interaction.guild.id }).sort({ xp: -1 });
            const userRank = allMembers.findIndex(m => m.userId === target.id) + 1 || allMembers.length + 1;

            const nextLevelXP = (memberData.level + 1) * 100;

            const rankCard = new RankCardBuilder()
                .setAvatar(target.displayAvatarURL({ extension: 'png' }))
                .setCurrentXP(memberData.xp)
                .setLevel(memberData.level)
                .setRank(userRank)
                .setRequiredXP(nextLevelXP)
                .setDisplayName(target.username)
                .setStatus(member?.presence?.status || "offline")
                .setBackground("https://i.ibb.co/9N6y0sM/custom-bg.png");

            const cardBuffer = await rankCard.build({ format: 'png' });
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: '❌ An error occurred while generating the rank card.'
            });
        }
    }
};
