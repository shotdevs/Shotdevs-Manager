/**
 * Discord Components V2 Builder Utilities
 * * This module provides reusable builder functions for creating Discord Components V2 messages.
 * Components V2 uses a container-based layout system with Sections, Text Displays, and Separators.
 * * @module componentsV2Builder
 */

const { REST, Routes } = require('discord.js');

// --- HELPER: Payload Sanitizer ---
/**
 * Recursively removes invalid accessories from components to prevent API 50035 errors.
 * This ensures that if a raw config object is passed with empty accessories, they are stripped out.
 */
function cleanComponents(components) {
  if (!Array.isArray(components)) return components;

  return components.map(c => {
    if (!c || typeof c !== 'object') return c;

    // Create a shallow copy to avoid mutating the original reference permanently
    const safeC = { ...c };

    // 1. Recursively clean children (for Containers, Action Rows, etc.)
    if (safeC.components && Array.isArray(safeC.components)) {
      safeC.components = cleanComponents(safeC.components);
    }

    // 2. Check for invalid accessory (exists but has no type)
    // This catches cases like accessory: {} which causes "BASE_TYPE_REQUIRED"
    if (safeC.accessory) {
      if (!safeC.accessory.type) {
        delete safeC.accessory;
      }
    }

    return safeC;
  });
}

/**
 * Creates a Container component (type 17)
 * Containers are the top-level component that holds sections, separators, and action rows
 * * @param {Object} options - Container options
 * @param {number|null} [options.accent_color=null] - Accent color (null for transparent)
 * @param {Array} options.components - Array of sections, separators, and action rows
 * @returns {Object} Container component object
 */
function container({ accent_color = null, components }) {
  if (!Array.isArray(components)) {
    throw new Error('Container components must be an array');
  }
  
  // Filter out any null or undefined components
  const cleanComponentsList = components.filter(c => c !== null && c !== undefined);

  return {
    type: 17,
    accent_color,
    components: cleanComponentsList
  };
}

/**
 * Creates a Section component (type 9)
 * Sections contain text displays and can have an optional accessory (like a thumbnail)
 * * @param {Object} options - Section options
 * @param {string|Array|Object} [options.content=[]] - Text content (string, array of strings, or text display objects)
 * @param {Object|null} [options.accessory=null] - Optional accessory (thumbnail, etc.)
 * @returns {Object} Section component object
 */
function section({ content = [], accessory = null }) {
  let components;
  
  if (typeof content === 'string') {
    components = [textDisplay(content)];
  } else if (Array.isArray(content)) {
    components = content.map(c => typeof c === 'string' ? textDisplay(c) : c);
  } else if (content && typeof content === 'object') {
    components = [content];
  } else {
    components = [];
  }
  
  const sec = { type: 9, components };
  
  // Safety check: Only attach accessory if it has a valid type
  if (accessory && accessory.type) {
    sec.accessory = accessory;
  }
  
  return sec;
}

/**
 * Creates a Text Display component (type 10)
 * Text displays show formatted text content with markdown support
 * * @param {string} content - Text content
 * @returns {Object} Text Display component object
 */
function textDisplay(content) {
  if (typeof content !== 'string' && typeof content !== 'number') {
    content = " "; 
  }
  
  return { 
    type: 10, 
    content: String(content) 
  };
}

/**
 * Creates a Separator component (type 14)
 * Separators create visual dividers between sections
 * * @param {number} [spacing=1] - Spacing value
 * @returns {Object} Separator component object
 */
function separator(spacing = 1) {
  return { 
    type: 14, 
    divider: true, 
    spacing 
  };
}

/**
 * Creates a Button component (type 2)
 * * @param {Object} options - Button options
 * @returns {Object} Button component object
 */
function button({ custom_id, label, style = 2, url, disabled = false, emoji }) {
  if (!label && !emoji) label = "Button";
  
  const btn = { type: 2, style };
  
  if (label) btn.label = label;
  
  if (url) {
    btn.url = url;
    btn.style = 5; 
  } else if (custom_id) {
    btn.custom_id = custom_id;
  } else {
    btn.custom_id = "btn_" + Math.random().toString(36).substring(7);
  }
  
  if (disabled) btn.disabled = true;
  
  if (emoji) {
    if (typeof emoji === 'string') {
      btn.emoji = { name: emoji };
    } else {
      btn.emoji = emoji;
    }
  }
  
  return btn;
}

/**
 * Creates an Action Row component (type 1)
 * * @param {Array} components - Array of button components
 * @returns {Object} Action Row component object
 */
function actionRow(components) {
  if (!Array.isArray(components)) {
    throw new Error('Action row components must be an array');
  }
  
  return { 
    type: 1, 
    components 
  };
}

/**
 * Creates a Thumbnail accessory (type 11)
 * * @param {string} url - Image URL
 * @returns {Object} Thumbnail accessory object
 */
function thumbnail(url) {
  if (!url || typeof url !== 'string') {
    return null; 
  }
  
  return {
    type: 11,
    media: { url }
  };
}

/**
 * Sends a Components V2 message via REST API
 * * Automatically sanitizes invalid accessories before sending.
 */
async function sendComponentsV2Message(client, channelId, payload) {
  if (!client || !channelId) {
    throw new Error('Client and channelId are required');
  }
  
  const rest = client.rest || new REST({ version: '10' }).setToken(client.token);
  
  // Prepare safe payload
  const safePayload = { ...payload };
  if (safePayload.components) {
    safePayload.components = cleanComponents(safePayload.components);
  }
  
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    ...safePayload
  };
  
  if (payload.ephemeral) {
    body.flags |= 1 << 6;
  }
  
  try {
    return await rest.post(Routes.channelMessages(channelId), { body });
  } catch (error) {
    console.error('Error sending Components V2 message:', error);
    throw error;
  }
}

/**
 * Replies to an interaction with a Components V2 message
 * * Automatically sanitizes invalid accessories before sending.
 */
async function replyComponentsV2(interaction, payload) {
  if (!interaction) {
    throw new Error('Interaction is required');
  }
  
  // Prepare safe payload
  const safePayload = { ...payload };
  if (safePayload.components) {
    safePayload.components = cleanComponents(safePayload.components);
  }
  
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    ...safePayload
  };
  
  if (payload.ephemeral) {
    body.flags |= 1 << 6;
  }
  
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(body);
    } else {
      return await interaction.reply(body);
    }
  } catch (error) {
    console.error('Error replying with Components V2:', error);
    throw error;
  }
}

/**
 * Edits a message with Components V2 content
 * * Automatically sanitizes invalid accessories before sending.
 */
async function editComponentsV2Message(message, payload) {
  if (!message) {
    throw new Error('Message is required');
  }

  // Prepare safe payload
  const safePayload = { ...payload };
  if (safePayload.components) {
    safePayload.components = cleanComponents(safePayload.components);
  }
  
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    ...safePayload
  };
  
  try {
    return await message.edit(body);
  } catch (error) {
    console.error('Error editing Components V2 message:', error);
    throw error;
  }
}

// Export all builder functions
module.exports = {
  container,
  section,
  textDisplay,
  separator,
  button,
  actionRow,
  thumbnail,
  sendComponentsV2Message,
  replyComponentsV2,
  editComponentsV2Message
};
