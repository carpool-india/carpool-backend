import { useCallback, useEffect, useState } from "react";
import { bookingGet, paymentGet } from "../services/api";

/** Ignore outdated responses when a page unmounts or the requested resource changes. */
export function useRemoteData<T>(path: string, service: "booking" | "payment" = "booking") {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    const request = service === "payment" ? paymentGet<T> : bookingGet<T>;
    request(path)
      .then(result => { if (active) setData(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load this information."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, service, revision]);
  return { data, loading, error, reload };
}

