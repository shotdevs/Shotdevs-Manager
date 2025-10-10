// test.js
try {
  console.log('Attempting to load discord.js...');
  const djs = require('discord.js');
  console.log('discord.js loaded successfully!');

  console.log(`Version: ${djs.version}`);

  if (djs.Events) {
    console.log('✅ The "Events" object exists.');
    console.log(`Example Event: Events.MessageCreate is "${djs.Events.MessageCreate}"`);
  } else {
    console.log('❌ The "Events" object does NOT exist on the loaded module.');
  }

} catch (e) {
  console.error('An error occurred while loading discord.js:', e);
}
