/**
 * Discord Components V2 Builder Utilities
 * * This module provides reusable builder functions for creating Discord Components V2 messages.
 * Components V2 uses a container-based layout system with Sections, Text Displays, and Separators.
 * * @module componentsV2Builder
 */

const { REST, Routes } = require('discord.js');

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
  
  // Filter out any null or undefined components to prevent errors
  const cleanComponents = components.filter(c => c !== null && c !== undefined);

  return {
    type: 17,
    accent_color,
    components: cleanComponents
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
  // Convert content to array of text display components
  let components;
  
  if (typeof content === 'string') {
    // Single string - convert to text display
    components = [textDisplay(content)];
  } else if (Array.isArray(content)) {
    // Array - convert each item to text display
    components = content.map(c => typeof c === 'string' ? textDisplay(c) : c);
  } else if (content && typeof content === 'object') {
    // Already a component object
    components = [content];
  } else {
    components = [];
  }
  
  const sec = { type: 9, components };
  
  // FIX APPLIED HERE: 
  // Only attach accessory if it exists AND has a 'type' property.
  // This prevents sending empty objects {} which cause API 50035 errors.
  if (accessory && accessory.type) {
    sec.accessory = accessory;
  }
  
  return sec;
}

/**
 * Creates a Text Display component (type 10)
 * Text displays show formatted text content with markdown support
 * * @param {string} content - Text content (supports markdown: bold, italic, headers, code, etc.)
 * @returns {Object} Text Display component object
 */
function textDisplay(content) {
  if (typeof content !== 'string' && typeof content !== 'number') {
    // Fallback for null/undefined content to avoid crashes
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
 * * @param {number} [spacing=1] - Spacing value (typically 1)
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
 * Buttons can be interactive (with custom_id) or links (with url)
 * * @param {Object} options - Button options
 * @param {string} [options.custom_id] - Custom ID for interactive buttons
 * @param {string} [options.url] - URL for link buttons
 * @param {string} options.label - Button label text
 * @param {number} [options.style=2] - Button style (1=Primary, 2=Secondary, 3=Success, 4=Danger, 5=Link)
 * @param {boolean} [options.disabled=false] - Whether button is disabled
 * @param {Object|string} [options.emoji] - Button emoji (object or string)
 * @returns {Object} Button component object
 */
function button({ custom_id, label, style = 2, url, disabled = false, emoji }) {
  if (!label && !emoji) {
     // Buttons must have at least a label or an emoji
     label = "Button";
  }
  
  const btn = { type: 2, style };
  
  if (label) btn.label = label;
  
  if (url) {
    btn.url = url;
    btn.style = 5; // Force link style if URL is present
  } else if (custom_id) {
    btn.custom_id = custom_id;
  } else {
    // Fallback random ID if missing
    btn.custom_id = "btn_" + Math.random().toString(36).substring(7);
  }
  
  if (disabled) btn.disabled = true;
  
  if (emoji) {
    // Handle emoji as string or object
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
 * Action rows hold buttons and other interactive components
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
 * Thumbnails are small images displayed alongside section content
 * * @param {string} url - Image URL
 * @returns {Object} Thumbnail accessory object
 */
function thumbnail(url) {
  if (!url || typeof url !== 'string') {
    return null; // Return null instead of throwing to allow safe usage in ternaries
  }
  
  return {
    type: 11,
    media: { url }
  };
}

/**
 * Sends a Components V2 message via REST API
 * This is required because Components V2 requires the IS_COMPONENTS_V2 flag
 * * @param {Object} client - Discord.js client instance
 * @param {string} channelId - Channel ID to send message to
 * @param {Object} payload - Message payload
 * @param {string} [payload.content] - Message text content
 * @param {Array} [payload.components] - Array of container components
 * @param {Array} [payload.files] - Array of file attachments
 * @param {boolean} [payload.ephemeral=false] - Whether message is ephemeral
 * @returns {Promise<Object>} Discord API response
 */
async function sendComponentsV2Message(client, channelId, payload) {
  if (!client || !channelId) {
    throw new Error('Client and channelId are required');
  }
  
  // Use client.rest if available, otherwise create new REST instance
  const rest = client.rest || new REST({ version: '10' }).setToken(client.token);
  
  // Build the request body with IS_COMPONENTS_V2 flag
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2 flag (32768)
    ...payload
  };
  
  // Add EPHEMERAL flag if specified
  if (payload.ephemeral) {
    body.flags |= 1 << 6; // EPHEMERAL flag (64)
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
 * This helper wraps interaction.reply() with proper flags for Components V2
 * * @param {Object} interaction - Discord.js interaction object
 * @param {Object} payload - Reply payload
 * @param {string} [payload.content] - Message text content
 * @param {Array} [payload.components] - Array of container components
 * @param {Array} [payload.files] - Array of file attachments
 * @param {boolean} [payload.ephemeral=false] - Whether reply is ephemeral
 * @returns {Promise<Object>} Interaction reply response
 */
async function replyComponentsV2(interaction, payload) {
  if (!interaction) {
    throw new Error('Interaction is required');
  }
  
  // Build the reply payload with IS_COMPONENTS_V2 flag
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2 flag (32768)
    ...payload
  };
  
  // Add EPHEMERAL flag if specified
  if (payload.ephemeral) {
    body.flags |= 1 << 6; // EPHEMERAL flag (64)
  }
  
  try {
    // Check if interaction is already replied or deferred
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
 * * @param {Object} message - Discord.js message object
 * @param {Object} payload - Edit payload
 * @param {string} [payload.content] - Message text content
 * @param {Array} [payload.components] - Array of container components
 * @returns {Promise<Object>} Edited message
 */
async function editComponentsV2Message(message, payload) {
  if (!message) {
    throw new Error('Message is required');
  }
  
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2 flag (32768)
    ...payload
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
