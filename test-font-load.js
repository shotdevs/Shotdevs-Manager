(async () => {
  try {
    const { Font } = require('canvacord');
    console.log('Font export present:', !!Font);
    if (Font && typeof Font.loadDefault === 'function') {
      const f = Font.loadDefault();
      console.log('Font.loadDefault() returned:', !!f);
    } else {
      console.log('Font.loadDefault() not available');
    }
  } catch (err) {
    console.error('Error loading font:', err);
    process.exitCode = 1;
  }
})();