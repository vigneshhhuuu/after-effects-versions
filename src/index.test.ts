import { test } from 'node:test';
import assert from 'node:assert';
import { findAfterEffectsVersions, findLatestAfterEffects } from './index.js';

test('findAfterEffectsVersions returns an array', async () => {
  const result = await findAfterEffectsVersions();
  assert.ok(Array.isArray(result), 'Result should be an array');
});

test('each install has required properties', async () => {
  const result = await findAfterEffectsVersions();
  
  for (const install of result) {
    assert.ok(
      install.platform === 'mac' || install.platform === 'win',
      'Platform should be mac or win'
    );
    assert.ok(typeof install.name === 'string', 'Name should be a string');
    assert.ok(typeof install.path === 'string', 'Path should be a string');
    assert.ok(
      install.version === null || typeof install.version === 'string',
      'Version should be string or null'
    );
    
    // Windows installs should have exe property
    if (install.platform === 'win') {
      assert.ok(
        typeof install.exe === 'string',
        'Windows install should have exe path'
      );
    }
  }
});

test('returns empty array on unsupported platforms', async () => {
  // This test will only pass on unsupported platforms (not darwin or win32)
  const platform = process.platform;
  const result = await findAfterEffectsVersions();
  
  if (platform !== 'darwin' && platform !== 'win32') {
    assert.strictEqual(result.length, 0, 'Should return empty array on unsupported platform');
  }
});

test('macOS: paths should end with .app', async () => {
  const result = await findAfterEffectsVersions();
  
  const macInstalls = result.filter(i => i.platform === 'mac');
  for (const install of macInstalls) {
    assert.ok(
      install.path.endsWith('.app'),
      'macOS install path should end with .app'
    );
  }
});

test('Windows: should have exe in Support Files', async () => {
  const result = await findAfterEffectsVersions();
  
  const winInstalls = result.filter(i => i.platform === 'win');
  for (const install of winInstalls) {
    assert.ok(install.exe, 'Windows install should have exe property');
    assert.ok(
      install.exe?.includes('Support Files'),
      'AfterFX.exe should be in Support Files folder'
    );
    assert.ok(
      install.exe?.endsWith('AfterFX.exe'),
      'Exe path should end with AfterFX.exe'
    );
  }
});

test('findLatestAfterEffects returns null or valid install', async () => {
  const latest = await findLatestAfterEffects();
  
  if (latest !== null) {
    assert.ok(
      latest.platform === 'mac' || latest.platform === 'win',
      'Platform should be mac or win'
    );
    assert.ok(typeof latest.name === 'string', 'Name should be a string');
    assert.ok(typeof latest.path === 'string', 'Path should be a string');
  }
});

test('findLatestAfterEffects returns highest version', async () => {
  const all = await findAfterEffectsVersions();
  const latest = await findLatestAfterEffects();
  
  if (all.length > 0) {
    assert.ok(latest !== null, 'Should return a result when installations exist');
    
    // If we have versions to compare, latest should have the highest
    const withVersions = all.filter(i => i.version !== null);
    if (withVersions.length > 0 && latest?.version !== null) {
      const latestVersion = latest.version;
      
      // Verify no other install has a higher version
      for (const install of withVersions) {
        if (install.version) {
          const parts1 = latestVersion.split('.').map(p => parseInt(p, 10) || 0);
          const parts2 = install.version.split('.').map(p => parseInt(p, 10) || 0);
          
          // Latest should be >= all others
          assert.ok(
            parts1[0] >= parts2[0],
            `Latest version ${latestVersion} should be >= ${install.version}`
          );
        }
      }
    }
  } else {
    assert.strictEqual(latest, null, 'Should return null when no installations exist');
  }
});
