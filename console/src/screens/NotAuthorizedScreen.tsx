import { useAuth } from "../store/AuthContext";

export function NotAuthorizedScreen() {
  const { signOut, recheckAdmin, status } = useAuth();

  return (
    <div className="login-screen flex-col gap-4 text-center">
      <div className="max-w-sm rounded-xl bg-white p-7 text-left shadow-lg">
        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">{status === "unavailable" ? "Unable to check access" : "Admin access required"}</h1>
        <p className="mt-2 text-[13px] leading-5 text-slate-500">
          {status === "unavailable"
            ? "The admin service is temporarily unavailable. Check your connection and try again."
            : "This account does not have admin access. Contact an existing administrator, then try again."}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => void recheckAdmin()}
            className="flex-1 rounded-lg bg-brand-light py-2 text-[13px] font-semibold text-brand"
          >
            Try again
          </button>
          <button
            onClick={() => void signOut()}
            className="flex-1 rounded-lg bg-slate-100 py-2 text-[13px] font-semibold text-slate-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
