import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingGet, bookingPatch } from "../lib/api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { ActionMenu } from "../components/ActionMenu";
import { liveOrMock, MOCK_VEHICLES, paginate } from "../lib/mockData";

interface AdminVehicle {
  id: string;
  driver_id: string;
  make: string | null;
  model: string | null;
  color: string | null;
  registration_number: string;
  year: number | null;
  vehicle_type: string;
  is_verified: boolean;
  users: { id: string; name: string | null; phone: string } | null;
  driver_profile: {
    dl_number?: string | null;
    cancellation_count?: number;
    reliability_score?: number;
    years_of_experience?: number;
  } | null;
}

export function VehiclesScreen() {
  const [page, setPage] = useState(1);
  const [verified, setVerified] = useState<"" | "true" | "false">("false");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-vehicles", page, verified],
    queryFn: () => {
      const filtered = MOCK_VEHICLES.filter((row) =>
        verified === "" ? true : verified === "true" ? row.is_verified : !row.is_verified
      );
      return liveOrMock(
        () =>
          bookingGet<{ items: AdminVehicle[]; total: number }>(
            `/admin/vehicles?page=${page}&limit=20${verified ? `&verified=${verified}` : ""}`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function setVerifiedFlag(vehicle: AdminVehicle, isVerified: boolean) {
    setNotice(null);
    try {
      await bookingPatch(`/admin/vehicles/${vehicle.id}`, { isVerified });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update vehicle");
    }
    queryClient.setQueryData<{ items: AdminVehicle[]; total: number }>(["admin-vehicles", page, verified], (old) =>
      old
        ? { ...old, items: old.items.map((item) => (item.id === vehicle.id ? { ...item, is_verified: isVerified } : item)) }
        : old
    );
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={verified}
          onChange={(e) => {
            setPage(1);
            setVerified(e.target.value as typeof verified);
          }}
        >
          <option value="false">Unverified</option>
          <option value="true">Verified</option>
          <option value="">All vehicles</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          {
            header: "Vehicle",
            render: (row) => (
              <>
                {[row.make, row.model].filter(Boolean).join(" ") || "—"}{" "}
                <span className="muted">{row.color}</span>
              </>
            ),
          },
          { header: "Reg. no.", render: (row) => row.registration_number },
          { header: "Type", render: (row) => <Badge label={row.vehicle_type} tone="neutral" /> },
          {
            header: "Driver",
            render: (row) => (
              <>
                {row.users?.name ?? "—"} <span className="muted">{row.users?.phone}</span>
              </>
            ),
          },
          { header: "DL", render: (row) => row.driver_profile?.dl_number ?? "—" },
          {
            header: "Reliability",
            render: (row) =>
              row.driver_profile?.reliability_score != null
                ? `${Math.round(Number(row.driver_profile.reliability_score) * 100)}%`
                : "—",
          },
          {
            header: "Status",
            render: (row) => <Badge label={row.is_verified ? "verified" : "pending"} tone={row.is_verified ? "good" : "warn"} />,
          },
          {
            header: "Actions",
            align: "right",
            width: "64px",
            render: (row) => (
              <ActionMenu
                items={[
                  {
                    label: row.is_verified ? "Revoke" : "Verify",
                    tone: row.is_verified ? "default" : "brand",
                    onSelect: () => void setVerifiedFlag(row, !row.is_verified),
                  },
                ]}
              />
            ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load vehicles" : null}
        emptyTitle="No vehicles yet"
        emptyHint="Cars and bikes added by drivers will appear here for verification."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
