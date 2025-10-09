const fs = require('node:fs').promises; // <-- Use the promises version of fs
const path = require('node:path');

const configPath = path.join(__dirname, 'guild_configs.json');

// This is now an async function
async function readConfigs() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return empty object
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

// This is now an async function
async function writeConfigs(data) {
    await fs.writeFile(configPath, JSON.stringify(data, null, 4));
}

module.exports = {
    // This function is now async
    getConfig: async function(guildId) {
        const configs = await readConfigs();
        return configs[guildId] || {};
    },

    // This function is now async
    setConfig: async function(guildId, key, value) {
        const configs = await readConfigs();
        if (!configs[guildId]) {
            configs[guildId] = {};
        }
        configs[guildId][key] = value;
        await writeConfigs(configs);
    }
};
