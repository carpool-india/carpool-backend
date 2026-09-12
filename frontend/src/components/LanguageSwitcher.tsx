import { useAuthStore, type AppLanguage } from "../store/authStore";
import { t } from "../i18n/translations";

const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "ta", label: "தமிழ்" },
];

export function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);

  const tone =
    variant === "dark"
      ? "border-white/25 bg-white/10 text-white [color-scheme:dark]"
      : "border-line bg-white text-ink-soft";

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as AppLanguage)}
      aria-label={t(language, "language")}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${tone}`}
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value} className="text-ink">
          {option.label}
        </option>
      ))}
    </select>
  );
}
