const { load } = require('@expo/env');

load(require('node:path').resolve(__dirname, '..'));

const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'];
const invalid = required.filter((name) => {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('$') || /^(your[_-]|replace[_-]|<)/i.test(value)) return true;
  if (name.endsWith('_URL')) {
    try { return new URL(value).protocol !== 'https:'; } catch { return true; }
  }
  return false;
});
if (invalid.length) {
  console.error(`Build configuration is missing or invalid: ${invalid.join(', ')}. Set real values in the selected EAS environment (plain text or sensitive), then rebuild. Values are never printed by this check.`);
  process.exit(1);
}
console.log('Required mobile build configuration is valid.');
