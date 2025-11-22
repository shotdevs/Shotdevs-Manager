/**
 * Discord Components V2 Builder Utilities
 * * This module provides reusable builder functions for creating Discord Components V2 messages.
 * Components V2 uses a container-based layout system with Sections, Text Displays, and Separators.
 * * @module componentsV2Builder
 */

const { REST, Routes } = require('discord.js');

// --- HELPER: Deep Payload Sanitizer ---
/**
 * Recursively removes invalid accessories from components to prevent API 50035 errors.
 * This function uses JSON serialization to break references and ensure a clean object tree.
 */
function cleanComponents(components) {
  if (!Array.isArray(components)) return components;

  // 1. Deep Clone: Forces 'undefined' keys to vanish and breaks references
  const plainComponents = JSON.parse(JSON.stringify(components));

  // 2. Recursive Cleaning Function
  const scanAndClean = (nodes) => {
    return nodes.map(node => {
      if (!node || typeof node !== 'object') return node;

      // VALIDATE ACCESSORY
      // If 'accessory' key exists (even as null), we must check it.
      if ('accessory' in node) {
        const acc = node.accessory;
        
        // Rule: Accessory MUST be an object, NOT null, and MUST have a 'type'.
        // If it violates any of these, we DELETE the key entirely.
        const isValid = acc && typeof acc === 'object' && acc.type !== undefined && acc.type !== null;
        
        if (!isValid) {
          delete node.accessory;
        }
      }

      // RECURSE into children (components array)
      if (Array.isArray(node.components)) {
        node.components = scanAndClean(node.components);
      }

      return node;
    });
  };

  return scanAndClean(plainComponents);
}

/**
 * Creates a Container component (type 17)
 */
function container({ accent_color = null, components }) {
  if (!Array.isArray(components)) {
    throw new Error('Container components must be an array');
  }
  const cleanComponentsList = components.filter(c => c !== null && c !== undefined);
  return { type: 17, accent_color, components: cleanComponentsList };
}

/**
 * Creates a Section component (type 9)
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
  
  // Builder Safety: Only attach if strictly valid
  if (accessory && typeof accessory === 'object' && accessory.type) {
    sec.accessory = accessory;
  }
  
  return sec;
}

/**
 * Creates a Text Display component (type 10)
 */
function textDisplay(content) {
  if (typeof content !== 'string' && typeof content !== 'number') content = " "; 
  return { type: 10, content: String(content) };
}

/**
 * Creates a Separator component (type 14)
 */
function separator(spacing = 1) {
  return { type: 14, divider: true, spacing };
}

/**
 * Creates a Button component (type 2)
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
    if (typeof emoji === 'string') btn.emoji = { name: emoji };
    else btn.emoji = emoji;
  }
  return btn;
}

/**
 * Creates an Action Row component (type 1)
 */
function actionRow(components) {
  if (!Array.isArray(components)) throw new Error('Action row components must be an array');
  return { type: 1, components };
}

/**
 * Creates a Thumbnail accessory (type 11)
 */
function thumbnail(url) {
  if (!url || typeof url !== 'string') return null; 
  return { type: 11, media: { url } };
}

/**
 * Sends a Components V2 message via REST API
 * Uses deep sanitization before sending.
 */
async function sendComponentsV2Message(client, channelId, payload) {
  if (!client || !channelId) throw new Error('Client and channelId are required');
  
  const rest = client.rest || new REST({ version: '10' }).setToken(client.token);
  
  // 1. Clean components deeply
  const safePayload = { ...payload };
  if (safePayload.components) {
    safePayload.components = cleanComponents(safePayload.components);
  }
  
  // 2. Construct Body
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    ...safePayload
  };

  if (payload.ephemeral) body.flags |= 1 << 6;

  try {
    return await rest.post(Routes.channelMessages(channelId), { body });
  } catch (error) {
    console.error('Error sending Components V2 message:', error);
    // Log the EXACT body being sent for final debugging
    console.error('Final Body Sent:', JSON.stringify(body, null, 2));
    throw error;
  }
}

/**
 * Replies to an interaction with a Components V2 message
 * Uses deep sanitization before sending.
 */
async function replyComponentsV2(interaction, payload) {
  if (!interaction) throw new Error('Interaction is required');
  
  const safePayload = { ...payload };
  if (safePayload.components) {
    safePayload.components = cleanComponents(safePayload.components);
  }
  
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    ...safePayload
  };
  
  if (payload.ephemeral) body.flags |= 1 << 6;

  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(body);
    } else {
      return await interaction.reply(body);
    }
  } catch (error) {
    console.error('Error replying with Components V2:', error);
    console.error('Final Body Sent:', JSON.stringify(body, null, 2));
    throw error;
  }
}

/**
 * Edits a message with Components V2 content
 * Uses deep sanitization before sending.
 */
async function editComponentsV2Message(message, payload) {
  if (!message) throw new Error('Message is required');

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
    console.error('Final Body Sent:', JSON.stringify(body, null, 2));
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
