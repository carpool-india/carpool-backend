import { useCallback, useEffect, useState, type FormEvent } from "react";
import { indianPhoneSchema } from "@rideshare/utils";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { Alert, Avatar, Card, EmptyState, Page, PageHeader } from "../components/ui";
import { DataFeedback } from "../components/DataFeedback";

interface Contact { id: string; name: string; phone: string; relationship: string; }

export function EmergencyContactsPage() {
  const userId = useAuthStore(state => state.user?.id);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await supabase.from("emergency_contacts").select("id,name,phone,relationship").eq("user_id", userId).order("created_at", { ascending: true });
      if (result.error) throw result.error;
      setContacts(result.data ?? []);
    } catch (reason) { setLoadError(reason instanceof Error ? reason.message : "Unable to load your contacts."); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    const digits = phone.replace(/[\s()-]/g, "");
    const parsed = indianPhoneSchema.safeParse(/^\d{10}$/.test(digits) ? "+91" + digits : digits);
    if (name.trim().length < 2 || relationship.trim().length < 2 || !parsed.success) {
      setError("Enter a name, relationship, and valid Indian mobile number.");
      return;
    }
    setBusy("add"); setError(null); setNotice("");
    try {
      const result = await supabase.from("emergency_contacts").insert({ user_id: userId, name: name.trim(), phone: parsed.data, relationship: relationship.trim() }).select("id,name,phone,relationship").single();
      if (result.error) throw result.error;
      setContacts(previous => [...previous, result.data]);
      setName(""); setPhone(""); setRelationship(""); setNotice("Emergency contact added.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add this contact."); }
    finally { setBusy(null); }
  }

  async function remove(id: string) {
    if (!userId) return;
    setBusy(id); setError(null); setNotice("");
    try {
      const result = await supabase.from("emergency_contacts").delete().eq("id", id).eq("user_id", userId);
      if (result.error) throw result.error;
      setContacts(previous => previous.filter(item => item.id !== id));
      setConfirmRemove(null); setNotice("Emergency contact removed.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to remove this contact."); }
    finally { setBusy(null); }
  }

  return <Page width="full"><PageHeader kicker="THE PEOPLE YOU TRUST" title="Emergency contacts" subtitle="Keep your trusted contacts up to date before your next journey." />
    {error && <Alert tone="red">{error}</Alert>}{notice && <p role="status" className="mb-5 text-sm text-brand">{notice}</p>}
    <div className="workspace-two-col"><section><DataFeedback loading={loading} error={loadError} onRetry={() => void load()} />{!loading && !loadError && (contacts.length ? <div className="workspace-list">{contacts.map(item => <article key={item.id} className="workspace-list-item"><Avatar name={item.name} /><div className="item-copy"><h2>{item.name}</h2><p>{item.phone} · {item.relationship}</p></div>{confirmRemove === item.id ? <div className="workspace-actions !mt-0"><span className="text-xs">Remove contact?</span><button className="workspace-secondary" disabled={busy !== null} onClick={() => setConfirmRemove(null)}>Keep</button><button className="workspace-secondary !text-red-700" disabled={busy !== null} onClick={() => void remove(item.id)}>{busy === item.id ? "Removing…" : "Remove"}</button></div> : <button className="workspace-secondary" onClick={() => setConfirmRemove(item.id)}>Remove</button>}</article>)}</div> : <Card><EmptyState title="Who's in your corner?" body="Add a trusted person so their contact details are ready when you need them." /></Card>)}</section>
    <Card className="workspace-panel"><h2>Add a contact</h2><form className="workspace-form" onSubmit={event => void add(event)}><label>Full name<input className="workspace-input" value={name} onChange={event => setName(event.target.value)} autoComplete="off" required minLength={2} maxLength={100} /></label><label>Indian mobile number<input className="workspace-input" type="tel" inputMode="tel" placeholder="+91 98765 43210" value={phone} onChange={event => setPhone(event.target.value)} required maxLength={20} /></label><label>Relationship<input className="workspace-input" placeholder="Parent, partner, friend…" value={relationship} onChange={event => setRelationship(event.target.value)} required minLength={2} maxLength={50} /></label><button className="workspace-primary" disabled={busy !== null || loading || !!loadError}>{busy === "add" ? "Adding contact…" : "Add contact"}</button></form><p className="workspace-note">Choose someone who knows you and can respond if you need help.</p></Card></div>
  </Page>;
}

