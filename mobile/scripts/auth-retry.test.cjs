const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the hook's async workflow with isolated hook storage and mocked services.
function setup() {
  const states = [];
  const calls = [];
  const session = { access_token: 'access', refresh_token: 'refresh', user: { id: 'auth-id' } };
  let profileError = null;
  let pending;
  let inserted = 0;
  const table = {
    select() { return this; }, eq() { return this; },
    async maybeSingle() { return { data: profileError ? null : { id: 'user-id', name: 'Rider' }, error: profileError }; },
    insert() { inserted++; throw new Error('Unexpected profile creation'); },
  };
  const mocks = {
    react: {
      useRef: (current) => ({ current }),
      useCallback: (callback) => callback,
      useState: (value) => {
        const index = states.push(value) - 1;
        return [value, (next) => { states[index] = next; }];
      },
    },
    '../lib/supabase': { supabase: { from: () => table, auth: { setSession: async () => ({ error: null }) } } },
    '../services/api': { notificationPost: async (url, body) => {
      calls.push({ url, body });
      if (pending) await pending;
      return { session };
    } },
    '../store/authStore': { useAuthStore: (selector) => selector({ setSession() {} }) },
  };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/hooks/useSupabaseAuth.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in mocks)) throw new Error('Unexpected import: ' + name);
    return mocks[name];
  }, Error });
  return {
    hook: exports.useSupabaseAuth(), states, calls,
    failProfile(error) { profileError = error; },
    holdRequest(promise) { pending = promise; },
    get inserted() { return inserted; },
  };
}

const phone = '+919876543210';
test('profile failures remain visible and retry uses the verified session instead of the consumed OTP', async () => {
  const h = setup();
  h.failProfile({ message: 'Profile service unavailable' });
  await assert.rejects(h.hook.verifyOtp(phone, '123456'));
  assert.equal(h.states[0], false);
  assert.equal(h.states[1], 'Profile service unavailable');
  assert.equal(h.inserted, 0);
  h.failProfile(null);
  assert.equal((await h.hook.verifyOtp(phone, '123456')).name, 'Rider');
  assert.equal(h.calls.length, 1);
  assert.equal(h.states[1], null);
});

test('duplicate verification taps send only one HTTP request', async () => {
  const h = setup();
  let release;
  h.holdRequest(new Promise(resolve => { release = resolve; }));
  const first = h.hook.verifyOtp(phone, '123456');
  await assert.rejects(h.hook.verifyOtp(phone, '123456'), /Please wait/);
  assert.equal(h.calls.length, 1);
  release();
  await first;
  assert.equal(h.states[0], false);
});

test('resending invalidates the previously verified session', async () => {
  const h = setup();
  h.failProfile({ message: 'Profile service unavailable' });
  await assert.rejects(h.hook.verifyOtp(phone, '123456'));
  await h.hook.sendOtp(phone);
  h.failProfile(null);
  await h.hook.verifyOtp(phone, '654321');
  assert.deepEqual(h.calls.map(call => call.url), ['/auth/otp/verify', '/auth/otp/request', '/auth/otp/verify']);
});
