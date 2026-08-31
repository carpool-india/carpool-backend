import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { safetyGet, safetyPatch } from "../lib/api";
import { Pagination } from "../components/Pagination";
import { DataTable } from "../components/DataTable";
import { FilterBar } from "../components/FilterBar";
import { ActionBanner } from "../components/ActionBanner";
import { liveOrMock, MOCK_RATINGS, paginate } from "../lib/mockData";

interface AdminRating {
  id: string;
  stars: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
  rater: { name: string | null; phone: string } | null;
  ratee: { name: string | null; phone: string } | null;
}

export function RatingsScreen() {
  const [page, setPage] = useState(1);
  const [maxStars, setMaxStars] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-ratings", page, maxStars],
    queryFn: () => {
      const filtered = MOCK_RATINGS.filter((rating) => !maxStars || rating.stars <= Number(maxStars));
      return liveOrMock(
        () =>
          safetyGet<{ items: AdminRating[]; total: number }>(
            `/admin/ratings?page=${page}&limit=20${maxStars ? `&maxStars=${maxStars}` : ""}`
          ),
        paginate(filtered, page, 20),
        (data) => data.items.length === 0
      );
    },
  });

  async function hide(rating: AdminRating) {
    if (!window.confirm("Hide this rating from the public feed?")) {
      return;
    }
    setNotice(null);
    try {
      await safetyPatch(`/admin/ratings/${rating.id}/hide`, {});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to hide rating");
    }
    queryClient.setQueryData<{ items: AdminRating[]; total: number }>(["admin-ratings", page, maxStars], (old) =>
      old ? { ...old, items: old.items.filter((item) => item.id !== rating.id), total: Math.max(0, old.total - 1) } : old
    );
  }

  return (
    <div className="page-frame page-frame-fill">
      <ActionBanner message={notice} onDismiss={() => setNotice(null)} />
      <FilterBar>
        <select
          value={maxStars}
          onChange={(e) => {
            setPage(1);
            setMaxStars(e.target.value);
          }}
        >
          <option value="">All ratings</option>
          <option value="2">2 stars or below</option>
          <option value="3">3 stars or below</option>
        </select>
      </FilterBar>
      <DataTable
        columns={[
          { header: "Stars", width: "120px", render: (rating) => <span className="font-bold text-amber-500">{"★".repeat(rating.stars)}</span> },
          { header: "From", render: (rating) => rating.rater?.name ?? rating.rater?.phone ?? "—" },
          { header: "About", render: (rating) => rating.ratee?.name ?? rating.ratee?.phone ?? "—" },
          {
            header: "Comment",
            clip: true,
            render: (rating) => <span title={rating.comment ?? undefined}>{rating.comment ?? "—"}</span>,
          },
          { header: "When", render: (rating) => new Date(rating.created_at).toLocaleString("en-IN") },
          {
            header: "Actions",
            align: "right",
            wrap: true,
            render: (rating) => (
              <div className="table-actions">
                <button type="button" className="table-action" onClick={() => void hide(rating)}>
                  Hide
                </button>
              </div>
            ),
          },
        ]}
        rows={query.data?.items ?? []}
        rowKey={(rating) => rating.id}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : query.error ? "Unable to load ratings" : null}
        emptyTitle="No ratings yet"
        emptyHint="Passenger and driver ratings will fill this table after trips complete."
        footer={<Pagination page={page} total={query.data?.total ?? 0} limit={20} onPageChange={setPage} />}
      />
    </div>
  );
}
