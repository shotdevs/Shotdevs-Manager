const fs = require('fs').promises;
const path = require('path');

// Path to store guild configurations
const GUILD_CONFIGS_PATH = path.join(__dirname, 'guild_configs.json');

// Initialize or load guild configurations
let guildConfigs = {};

// Load existing configurations
async function loadConfigs() {
    try {
        const data = await fs.readFile(GUILD_CONFIGS_PATH, 'utf8');
        guildConfigs = JSON.parse(data);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error loading guild configs:', error);
        }
        // If file doesn't exist, we'll start with empty configs
        guildConfigs = {};
    }
}

// Save configurations to file
async function saveConfigs() {
    try {
        await fs.writeFile(GUILD_CONFIGS_PATH, JSON.stringify(guildConfigs, null, 2));
    } catch (error) {
        console.error('Error saving guild configs:', error);
    }
}

// Load configs when the module is first required
loadConfigs();

module.exports = {
    getConfig: async function(guildId) {
        if (!guildConfigs[guildId]) {
            guildConfigs[guildId] = {
                reactionRoles: {}
            };
            await saveConfigs();
        }
        return guildConfigs[guildId];
    },

    setConfig: async function(guildId, key, value) {
        if (!guildConfigs[guildId]) {
            guildConfigs[guildId] = {};
        }
        guildConfigs[guildId][key] = value;
        await saveConfigs();
        return value;
    }
};