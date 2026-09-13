/** Only return to an internal product route after authentication. */
export function afterLoginPath(from?: string): string {
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.includes("\\")) return "/dashboard";
  const path = from.split(/[?#]/)[0];
  if (["/", "/login", "/otp", "/profile-setup"].includes(path)) return "/dashboard";
  return from;
}

