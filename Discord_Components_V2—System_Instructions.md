# Discord Components V2 — System Instructions + Examples (discord.js v14)

> A single-file developer reference and system instructions for an AI agent (or dev) to update a Discord bot built around discord.js v14 to support Components V2 (IS_COMPONENTS_V2), modern layout/content/interactive components, and beautiful container styles.

---

## Quick summary (what this doc contains)

* System instructions for an AI agent to migrate/implement Components V2
* Ready-to-use code snippets (discord.js v14 + REST calls) for messages, modals, and interactions
* Builder/utility functions to construct Component V2 payloads programmatically
* Templates: polished *Container* style update messages (color-coded categories)
* Modal examples (labels + text input + file upload)
* Best practices, error handling, rate-limit and testing checklist
* Accessibility & i18n notes

---

## System Instructions (for an AI agent / automation)

These are the *system-level directives* your AI agent (or developer automation) should follow when handling component V2 tasks and making changes to a discord.js v14 bot.

1. **Feature Detection & Versioning**

   * Detect whether the installation is using `discord.js` v14 or later. If `discord.js` is older, recommend `npm install discord.js@14` and show changelog highlights. Always preserve a `LEGACY_MODE` flag in config for compatibility.

2. **Use REST for V2 messages**

   * When creating messages with `IS_COMPONENTS_V2`, use raw REST `POST /channels/{channel.id}/messages` (discord.js `client.rest.post(Routes.channelMessages(channelId), { body })`) instead of the high-level `TextChannel.send()` to ensure flags and advanced payload fields are honored.

3. **Custom ID strategy & state**

   * Use stable `custom_id` conventions: `module:action:sha` or JSON-safe base64 encoded state like `mod:action:$b64` (max 100 chars). Always include a version prefix `v1`/`v2` to allow breaking-change migrations.

4. **Interaction handling**

   * `interactionCreate` should handle `InteractionType.MESSAGE_COMPONENT` (component clicks/selects) and `InteractionType.ModalSubmit`. Parse `interaction.data.custom_id` or `interaction.data.components` accordingly.

5. **Safety & Rate Limits**

   * Wrap REST calls with a small queue/backoff (exponential). Use `client.rest` and rely on discord.js internal rate-limit handling; when implementing your own fetch, implement `Retry-After` handling.

6. **Attachments & Files**

   * For components referencing files (`attachment://`), upload the files via `multipart/form-data` and reference them in the component `file.url: "attachment://filename.ext"`.

7. **Testing / Visual QA**

   * Provide debug commands that send preview messages in a `#bot-dev` testing channel. Render components with sample data and fallback to legacy content if the V2 flag fails.

8. **Accessibility & i18n**

   * Provide `label` and `description` fields for Labels; short button text; avoid reliance on emoji-only buttons. Provide translation keys and template tokens for Text Display components.

9. **Logging & Telemetry**

   * Log component interactions with sanitized `custom_id` and userId, channelId, timestamp for analytics; avoid logging user content or private file data.

10. **Fallback Plan**

* If V2 fails per-message, fall back to legacy components with a small banner: `This message uses an older layout — recommend updating client`.

---

## Minimal discord.js v14 example: send Components V2 message via REST

```javascript
// Requires discord.js v14
const { Client, GatewayIntentBits, Routes } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const { REST } = require('@discordjs/rest');
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
const { channel } = require('process');

async function sendComponentsV2(channelId) {
  const body = {
    flags: 1 << 15, // IS_COMPONENTS_V2
    components: [
      {
        type: 17, // Container
        accent_color: 0x10b981,
        components: [
          {
            type: 9,
            components: [
              { type: 10, content: '# ✨ New Feature Release' }
            ],
            accessory: {
              type: 11,
              media: { url: 'https://i.imgur.com/AfFp7pu.png' }
            }
          },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content: "We're excited to announce our new feature!" },
          { type: 1, components: [
              { type: 2, custom_id: 'accept_feature_v1', label: 'Accept', style: 1 },
              { type: 2, custom_id: 'decline_feature_v1', label: 'Decline', style: 4 },
              { type: 2, label: 'Docs', style: 5, url: 'https://example.com/docs' }
            ]
          }
        ]
      }
    ]
  };

  return rest.post(Routes.channelMessages(channelId), { body });
}

client.once('ready', () => console.log('Ready'));
client.login(process.env.BOT_TOKEN);

// usage: sendComponentsV2('123456789012345678')
```

**Notes:** Using `rest.post(Routes.channelMessages(channelId), { body })` gives full control over `flags` and `components` payload. If you prefer `client.api` or `client.channels.cache.get(...).send()`, be careful: high-level helpers might ignore `flags` or mutate body.

---

## Interaction handler (component clicks & selects)

```javascript
// in your main bot file
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isMessageComponent()) {
      const data = interaction.data || interaction.customId || {};
      // If using modern structure, data.custom_id may be found in interaction.data.custom_id
      const customId = interaction.customId || (interaction.data && interaction.data.custom_id) || '';

      // custom_id pattern: v1:module:action:payload
      const [ver, moduleName, action, payload] = customId.split(':');

      switch (`${moduleName}:${action}`) {
        case 'feature:accept':
          await interaction.reply({ content: 'Thanks for accepting!', ephemeral: true });
          break;
        case 'feature:decline':
          await interaction.reply({ content: 'Understood — declined.', ephemeral: true });
          break;
        default:
          await interaction.reply({ content: `Clicked customId: ${customId}`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit()) {
      // interaction.fields: parse modal responses
      const textValue = interaction.fields.getTextInputValue('game_feedback');
      await interaction.reply({ content: `Got feedback: ${textValue.slice(0,120)}`, ephemeral: true });
    }
  } catch (err) {
    console.error('Interaction handler error', err);
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: 'Internal error', ephemeral: true }); } catch(e){}
    }
  }
});
```

---

## Component Builder utilities (JS)

Use these helper functions to programmatically build components and keep payloads DRY.

```javascript
function button({ custom_id, label, style = 2, url, disabled = false, sku_id }) {
  const b = { type: 2, label, style };
  if (sku_id) b.sku_id = sku_id; // premium button
  if (url) b.url = url; // link button
  if (!url && !sku_id) b.custom_id = custom_id;
  if (disabled) b.disabled = true;
  return b;
}

function actionRow(components) { return { type: 1, components }; }

function textDisplay(content) { return { type: 10, content }; }

function container({ accent_color, components }) {
  return { type: 17, accent_color, components };
}

function section({ texts = [], accessory }) {
  return { type: 9, components: texts.map(t => textDisplay(t)), accessory };
}

// usage example
const payload = {
  flags: 1 << 15,
  components: [
    container({ accent_color: 0x3b82f6, components: [
      section({ texts: ['# Announcement'], accessory: { type: 11, media: { url: 'https://i.imgur.com/AfFp7pu.png' } } }),
      { type: 1, components: [button({ custom_id: 'v1:announce:ok:1', label: 'Acknowledge', style: 1 })] }
    ]})
  ]
};
```

---

## Modal examples (Label + Text Input + File Upload)

```javascript
const modalPayload = {
  type: 9, // modal
  data: {
    custom_id: 'bug_modal_v1',
    title: 'Bug Report',
    components: [
      {
        type: 18,
        label: 'Describe the bug',
        description: 'Please include steps to reproduce (100+ chars recommended)',
        component: {
          type: 4,
          custom_id: 'bug_description',
          style: 2,
          min_length: 20,
          max_length: 4000,
          required: true
        }
      },
      {
        type: 18,
        label: 'Attach screenshot',
        description: 'Optional - upload useful images',
        component: {
          type: 19,
          custom_id: 'bug_screenshots',
          min_values: 0,
          max_values: 5,
          required: false
        }
      }
    ]
  }
};

// send modal as InteractionCallbackType.MODAL (type 9) when responding to an interaction
```

---

## Beautiful Container Templates (copy/paste)

### Palette (hex values as integers)

* **General**: 0x6b7280 (gray)
* **Feature**: 0x10b981 (green)
* **Bug Fix**: 0xef4444 (red)
* **Announcement**: 0x3b82f6 (blue)
* **Maintenance**: 0xf59e0b (amber)

### Feature release template (polished)

```json
{
  "flags": 32768,
  "components": [
    {
      "type": 17,
      "accent_color": 10987457,
      "components": [
        { "type": 9, "components": [ { "type": 10, "content": "# ✨ Feature Release: Fast Sync" } ], "accessory": { "type": 11, "media": { "url": "https://i.imgur.com/AfFp7pu.png" } } },
        { "type": 14, "divider": true, "spacing": 1 },
        { "type": 10, "content": "**What's new**\n- Faster data sync between servers\n- Lower memory usage on startup\n- New `/sync status` command" },
        { "type": 14, "divider": true, "spacing": 1 },
        { "type": 1, "components": [ { "type": 2, "custom_id": "v1:feature:accept:fastsync", "label": "Yes, enable", "style": 1 }, { "type": 2, "custom_id": "v1:feature:later:fastsync", "label": "Maybe later", "style": 2 }, { "type": 2, "label": "Docs", "style": 5, "url": "https://docs.example.com/fastsync" } ] }
      ]
    }
  ]
}
```

(You can paste the JSON into the `body` for `client.rest.post(Routes.channelMessages(channelId), { body })`)

---

## File upload notes (multipart/form-data)

When your components include `attachment://` URLs (for `File` or `Thumbnail`), you must send a multipart request. Example pseudocode with `form-data` in Node.js:

```javascript
const FormData = require('form-data');
const fs = require('fs');
const form = new FormData();
form.append('payload_json', JSON.stringify(body));
form.append('files[0]', fs.createReadStream('./game.zip'), { filename: 'game.zip' });

// send using node-fetch with headers = form.getHeaders() and body = form
```

---

## Best Practices (short)

* Keep `custom_id` ≤ 100 chars; include versioning
* Use `ephemeral: true` replies for UI confirmations
* Only send components V2 when your bot and workflows are fully tested
* Avoid storing user-provided text in the `custom_id`
* Use `Label` for text inputs in modals (ActionRow-textInput is deprecated)

---

## Testing checklist

1. Send Component V2 preview message to a test channel
2. Click buttons & select options to verify `interactionCreate` handler
3. Submit modals and validate `interaction.isModalSubmit()` handling
4. Test file uploads in modal (max file count, sizes)
5. Test fallback to legacy message if API rejects `flags`
6. Validate ephemeral replies and permissions

---

## Debugging common problems

* **`400 Bad Request`**: validate `flags` and ensure component `type` values are integers; `attachment://` must match uploaded filename.
* **Missing custom_id**: interactive components need `custom_id` unless link/premium.
* **Large payload**: split into multiple messages or reduce Text Display length.
* **Rate limits**: respect `Retry-After` headers and let discord.js Rest auto-handle when possible.

---

## Example: Full feature flow (send message → handle click → show modal)

1. Bot sends announcement with Accept button (`v1:feature:accept:fastsync`).
2. User clicks → `interactionCreate` receives `component` interaction.
3. Bot responds with a modal to configure the feature.
4. User submits modal → `isModalSubmit()` handler reads fields and applies settings.

(All example code snippets above illustrate these steps.)

---

## Appendix: Useful constants mapping

```javascript
const ComponentType = { ACTION_ROW: 1, BUTTON: 2, STRING_SELECT: 3, TEXT_INPUT: 4, USER_SELECT: 5, ROLE_SELECT: 6, MENTIONABLE_SELECT: 7, CHANNEL_SELECT: 8, SECTION: 9, TEXT_DISPLAY: 10, THUMBNAIL: 11, MEDIA_GALLERY: 12, FILE: 13, SEPARATOR: 14, CONTAINER: 17, LABEL: 18, FILE_UPLOAD: 19 };
const ButtonStyle = { PRIMARY: 1, SECONDARY: 2, SUCCESS: 3, DANGER: 4, LINK: 5, PREMIUM: 6 };
```

---
*End of document.*
