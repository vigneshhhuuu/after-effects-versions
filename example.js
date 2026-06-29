// Example usage of after-effects-versions library

const { findAfterEffectsVersions, findLatestAfterEffects } = require('./dist/index.js');

(async () => {
  console.log('🔍 Searching for Adobe After Effects installations...\n');

  try {
    // Example 1: Get all installed versions
    const installs = await findAfterEffectsVersions();

    if (installs.length === 0) {
      console.log('❌ No Adobe After Effects installations found.');
      console.log(`   Platform: ${process.platform}`);
      return;
    }

    console.log(`✅ Found ${installs.length} installation(s):\n`);

    installs.forEach((install, index) => {
      console.log(`${index + 1}. ${install.name}`);
      console.log(`   Platform: ${install.platform}`);
      console.log(`   Version:  ${install.version || 'Unknown'}`);
      console.log(`   Path:     ${install.path}`);
      if (install.exe) {
        console.log(`   Exe:      ${install.exe}`);
      }
      console.log('');
    });

    // Example 2: Get only the latest version
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Latest Version:\n');
    
    const latest = await findLatestAfterEffects();
    if (latest) {
      console.log(`   Name:     ${latest.name}`);
      console.log(`   Version:  ${latest.version || 'Unknown'}`);
      console.log(`   Path:     ${latest.path}`);
      if (latest.exe) {
        console.log(`   Exe:      ${latest.exe}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nJSON output (all versions):');
    console.log(JSON.stringify(installs, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
