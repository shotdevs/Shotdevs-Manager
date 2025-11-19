// status-manager.js
const fs = require('node:fs');
const path = require('node:path');

const STORE_FILE = path.join(__dirname, 'last_status.json');

function readStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return {};
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('status-manager: failed to read store', e);
    return {};
  }
}

function writeStore(obj) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('status-manager: failed to write store', e);
  }
}

/**
 * Factory initializer. Pass your discord client instance.
 * Example: const statusManager = require('./status-manager')(client);
 */
module.exports = function initStatusManager(client, opts = {}) {
  if (!client) throw new Error('status-manager: client is required');

  // optional logger function (defaults to console)
  const logger = opts.logger || console;

  /**
   * Post or update a status message for a channel.
   * - channelId: string Snowflake
   * - content: string OR MessageOptions (e.g. { embeds: [...], content: '...' })
   * - opts: { forceDeleteInsteadOfEdit: boolean } optional
   */
  async function postOrUpdateStatus(channelId, content, options = {}) {
    if (!channelId) throw new Error('postOrUpdateStatus: channelId required');

    const store = readStore();
    let channel;
    try {
      channel = await client.channels.fetch(channelId);
    } catch (err) {
      logger.error(`status-manager: failed to fetch channel ${channelId}`, err);
      return null;
    }

    if (!channel || typeof channel.send !== 'function') {
      logger.error(`status-manager: channel ${channelId} not found or is not a text channel`);
      return null;
    }

    const lastId = store[channelId];
    // Try to edit existing message (cleanest)
    if (lastId && !options.forceDeleteInsteadOfEdit) {
      try {
        const prev = await channel.messages.fetch(lastId);
        if (prev) {
          // If content is plain string -> edit with content
          if (typeof content === 'string') {
            await prev.edit({ content });
          } else {
            // content could be { embeds: [...], content: '...' } or MessageEditOptions
            await prev.edit(content);
          }
          logger.debug?.(`status-manager: edited status in ${channelId}`);
          return prev;
        }
      } catch (err) {
        // Failed to fetch or edit; fallthrough to send new message
        logger.warn?.(`status-manager: cannot edit previous message (${lastId}) — will send new.`, err?.message ?? err);
      }
    }

    // Optional: delete previous message first if it exists and user prefers delete flow
    if (lastId && options.forceDeleteInsteadOfEdit) {
      try {
        const prev = await channel.messages.fetch(lastId);
        if (prev) await prev.delete().catch(() => null);
      } catch (e) {
        // ignore
      }
    }

    // Send new message
    try {
      const sent = (typeof content === 'string')
        ? await channel.send({ content })
        : await channel.send(content);

      // save message id
      const newStore = readStore();
      newStore[channelId] = sent.id;
      writeStore(newStore);

      logger.debug?.(`status-manager: sent new status in ${channelId} (id ${sent.id})`);
      return sent;
    } catch (err) {
      logger.error('status-manager: failed to send status message', err);
      return null;
    }
  }

  /**
   * Force delete previous message (if exists) then send new.
   * Convenience wrapper.
   */
  async function deletePrevAndSend(channelId, content) {
    return postOrUpdateStatus(channelId, content, { forceDeleteInsteadOfEdit: true });
  }

  return { postOrUpdateStatus, deletePrevAndSend };
};
