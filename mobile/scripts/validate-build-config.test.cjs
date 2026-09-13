const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const valid = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-public-key-never-log',
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key-never-log',
};
function validate(overrides) {
  return spawnSync(process.execPath, [path.join(__dirname, 'validate-build-config.cjs')], {
    env: { ...process.env, ...valid, ...overrides, EXPO_NO_DOTENV: '1' }, encoding: 'utf8',
  });
}
test('accepts populated release configuration without printing key values', () => {
  const result = validate({});
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!result.stdout.includes(valid.EXPO_PUBLIC_SUPABASE_ANON_KEY));
});
for (const name of Object.keys(valid)) {
  test(`rejects missing ${name}`, () => {
    const result = validate({ [name]: '' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(name));
  });
  test(`rejects literal EAS substitution for ${name}`, () => {
    const result = validate({ [name]: '$' + name });
    assert.equal(result.status, 1);
  });
}
test('rejects malformed and insecure Supabase URLs', () => {
  for (const url of ['not-a-url', 'http://example.supabase.co']) {
    assert.equal(validate({ EXPO_PUBLIC_SUPABASE_URL: url }).status, 1);
  }
});
