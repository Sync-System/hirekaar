import { apiFetch } from "@/lib/api-server";

type Featured = {
  id: string;
  full_name: string;
  city: string | null;
  country: string;
  rating_avg: number;
};

export async function FeaturedWorkersSection() {
  let rows: Featured[] = [];
  try {
    const res = await apiFetch("/public/featured-workers", { cache: "no-store" });
    if (res.ok) rows = (await res.json()) as Featured[];
  } catch {
    rows = [];
  }
  if (rows.length === 0) return null;
  return (
    <section className="bg-[#f5f5ef] py-14">
      <div className="mx-auto max-w-6xl px-6">
        <p className="hk-eyebrow">Featured workers</p>
        <h2 className="hk-title">Boosted professionals</h2>
        <p className="hk-copy">
          Workers who boosted visibility — Pakistan first; same model scales worldwide.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((w) => (
            <li key={w.id} className="rounded-[1.75rem] bg-white p-5 shadow-sm">
              <div className="mb-6 h-12 w-12 rounded-2xl bg-lime-300" />
              <p className="font-black text-neutral-950">{w.full_name}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {w.city ?? "—"}, {w.country} · ★ {w.rating_avg}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
