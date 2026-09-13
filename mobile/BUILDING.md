# Android preview builds

Run EAS commands from `mobile/`. Preview uses the EAS `preview` environment and produces an APK for internal testing.

Required EAS variables (plain text or sensitive visibility):

- `EXPO_PUBLIC_SUPABASE_URL`: the project's HTTPS URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: the public anon/publishable key, never a service-role key.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: an Android Maps key configured for this app.
- `EXPO_PUBLIC_RAZORPAY_KEY_ID`: the public checkout key when testing payments.

Do not put values such as `"$EXPO_PUBLIC_SUPABASE_URL"` in `eas.json`. They are literal strings, override the EAS environment, and previously caused the installed app to crash during Supabase initialization.

The `eas-build-post-install` hook rejects missing, placeholder, or malformed required configuration before native compilation. `.easignore` excludes local environment files and the unrelated nested checkout from cloud uploads.

```sh
eas env:pull --environment preview
npm run validate:build
npm run typecheck
node --test scripts/validate-build-config.test.cjs
eas build --platform android --profile preview
```

Install the newly generated APK; an already installed APK retains its old bundled environment values. Test cold launch, returning from the background, and login. For an Android startup failure, capture the relevant log with:

```sh
adb logcat -b crash -d
```

Build success alone is not runtime verification. Confirm the installed app reaches its login screen and remains running. Push token registration is optional and its failures are caught independently of navigation.

See [Expo's EAS environment documentation](https://docs.expo.dev/eas/environment-variables/) for managing variables.
