import { useAuth } from "../store/AuthContext";

export function NotAuthorizedScreen() {
  const { signOut, recheckAdmin } = useAuth();

  return (
    <div className="login-screen flex-col gap-4 text-center">
      <div className="max-w-sm rounded-xl bg-white p-7 text-left shadow-lg">
        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Not an admin yet</h1>
        <p className="mt-2 text-[13px] leading-5 text-slate-500">
          You're signed in, but this account doesn't have admin access. Ask an existing admin to set
          your <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">is_admin</code> flag, then
          try again.
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
