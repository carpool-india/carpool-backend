import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch, safetyPost } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { liveOrMock, MOCK_USERS, paginate } from "../lib/mockData";

interface AdminUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  trust_score: number;
  is_admin: boolean;
  is_active: boolean;
  aadhaar_verified: boolean;
  dl_verified: boolean;
  face_match_done: boolean;
  created_at: string;
}

export function UsersScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["admin-users", page, search, role],
    queryFn: () => {
      const needle = search.trim().toLowerCase();
      const filtered = MOCK_USERS.filter(
        (user) =>
          (!needle || (user.name ?? "").toLowerCase().includes(needle) || user.phone.toLowerCase().includes(needle)) &&
          (!role || user.role === role)
      );
      return liveOrMock(
        () =>
          bookingGet<{ items: AdminUser[]; total: number }>(
            `/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}${
              role ? `&role=${role}` : ""
            }`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function toggleAdmin(user: AdminUser) {
    setNotice(null);
    try {
      await bookingPatch(`/admin/users/${user.id}`, { isAdmin: !user.is_admin });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update admin flag");
    }
    queryClient.setQueryData<{ items: AdminUser[]; total: number }>(["admin-users", page, search, role], (old) =>
      old
        ? {
            ...old,
            items: old.items.map((item) => (item.id === user.id ? { ...item, is_admin: !item.is_admin } : item)),
          }
        : old
    );
  }

  async function toggleActive(user: AdminUser) {
    setNotice(null);
    try {
      await bookingPatch(`/admin/users/${user.id}`, { isActive: !user.is_active });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update account status");
    }
    queryClient.setQueryData<{ items: AdminUser[]; total: number }>(["admin-users", page, search, role], (old) =>
      old
        ? {
            ...old,
            items: old.items.map((item) => (item.id === user.id ? { ...item, is_active: !item.is_active } : item)),
          }
        : old
    );
  }

  async function flagUser(user: AdminUser) {
    const reason = window.prompt(`Fraud reason for ${user.name ?? user.phone}?`, "Ops fraud review");
    if (!reason) {
      return;
    }
    setNotice(null);
    try {
      await safetyPost("/admin/fraud-flag", { userId: user.id, reason });
      setNotice("Fraud flag recorded.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to flag user");
    }
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name or phone…"
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        >
          <option value="">All roles</option>
          <option value="passenger">Passenger</option>
          <option value="driver">Driver</option>
          <option value="both">Both</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Name",
            render: (user) => (
              <>
                {user.name ?? "—"} {user.is_admin ? <Badge label="admin" tone="brand" /> : null}
              </>
            ),
          },
          { header: "Phone", render: (user) => user.phone },
          { header: "Role", render: (user) => <Badge label={user.role} tone="neutral" /> },
          { header: "Trust", render: (user) => user.trust_score },
          {
            header: "KYC",
            render: (user) => {
              const kycDone = user.aadhaar_verified && user.dl_verified && user.face_match_done;
              return <Badge label={kycDone ? "verified" : "incomplete"} tone={kycDone ? "good" : "warn"} />;
            },
          },
          {
            header: "Status",
            render: (user) => (
              <Badge label={user.is_active ? "active" : "deactivated"} tone={user.is_active ? "good" : "critical"} />
            ),
          },
          {
            header: "Actions",
            align: "right",
            width: "240px",
            wrap: true,
            render: (user) => (
              <div className="table-actions">
                <button type="button" onClick={() => navigate(`/kyc?userId=${user.id}`)} className="table-action table-action-brand">
                  Documents
                </button>
                <button type="button" onClick={() => void flagUser(user)} className="table-action">
                  Flag
                </button>
                <button onClick={() => void toggleAdmin(user)} className="table-action">
                  {user.is_admin ? "Revoke admin" : "Make admin"}
                </button>
                <button onClick={() => void toggleActive(user)} className="table-action">
                  {user.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(user) => user.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load users" : null}
        emptyTitle="No users yet"
        emptyHint="The user table is ready. New sign-ups will show up here automatically."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
