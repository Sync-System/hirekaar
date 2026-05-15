import { apiFetch } from "@/lib/api-server";

export default async function AdminPage() {
  const statsRes = await apiFetch("/admin/stats");
  const usersRes = await apiFetch("/admin/users?limit=30");
  const stats = statsRes.ok ? await statsRes.json() : null;
  const users = usersRes.ok ? await usersRes.json() : [];
  const s = (stats as { users?: number; jobs?: number; bids?: number } | null) ?? {};
  const typedUsers = users as { id: string; phone: string; full_name: string; role: string; profile_completed: boolean }[];

  return (
    <div className="-mt-0 flex min-h-[calc(100dvh-3.5rem)] bg-white">
      <aside className="hidden w-64 shrink-0 flex-col bg-neutral-950 text-white md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-300 text-xl font-black text-neutral-950">
            H
          </div>
          <span className="text-xl font-black tracking-tighter">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-4 text-sm font-bold">
          <a className="flex items-center gap-3 rounded-xl bg-lime-300 p-3 text-neutral-950" href="#">
            Dashboard
          </a>
          <a className="flex items-center gap-3 rounded-xl p-3 text-white/80 transition hover:bg-white/10" href="#">
            Users & Workers
          </a>
          <a className="flex items-center gap-3 rounded-xl p-3 text-white/80 transition hover:bg-white/10" href="#">
            Active Jobs
          </a>
          <a className="flex items-center gap-3 rounded-xl p-3 text-white/80 transition hover:bg-white/10" href="#">
            Payments
          </a>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-sm font-black">Demo Admin</p>
            <p className="text-xs text-white/50">Superuser</p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-20 items-center justify-between border-b border-neutral-950/10 bg-white px-4 md:px-8">
          <div>
            <p className="hk-eyebrow">Admin console</p>
            <h1 className="text-2xl font-black tracking-tight">Dashboard Overview</h1>
          </div>
          <button className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-black">Export Report</button>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-950/10 bg-white p-6">
              <p className="text-sm font-medium text-neutral-500">Total Users</p>
              <h3 className="mt-1 text-3xl font-black">{s.users ?? 0}</h3>
              <div className="mt-2 text-sm font-bold text-lime-700">Registered marketplace users</div>
            </div>
            <div className="rounded-2xl border border-neutral-950/10 bg-white p-6">
              <p className="text-sm font-medium text-neutral-500">Active Jobs</p>
              <h3 className="mt-1 text-3xl font-black">{s.jobs ?? 0}</h3>
              <div className="mt-2 text-sm font-bold text-neutral-600">Requests created</div>
            </div>
            <div className="rounded-2xl border border-lime-300 bg-lime-300 p-6">
              <p className="text-sm font-medium text-neutral-700">Total Bids</p>
              <h3 className="mt-1 text-3xl font-black">{s.bids ?? 0}</h3>
              <div className="mt-2 text-sm font-bold text-neutral-700">Worker offers sent</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-950/10 bg-white p-6">
              <h4 className="mb-6 text-lg font-black">Job Volume</h4>
              <div className="flex h-48 items-end gap-3">
                {[40, 65, 48, 78, 56, 90, 72].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-xl bg-lime-300" style={{ height: `${h}%` }} />
                    <span className="text-[10px] font-bold text-neutral-400">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-950/10 bg-white p-6">
              <h4 className="mb-6 text-lg font-black">Worker Distribution</h4>
              <div className="space-y-4">
                {["Plumbing", "Electric", "Cleaning", "Painting", "HVAC"].map((x, i) => (
                  <div key={x}>
                    <div className="mb-1 flex justify-between text-xs font-bold">
                      <span>{x}</span>
                      <span>{[82, 70, 94, 44, 36][i]}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-neutral-100">
                      <div className="h-3 rounded-full bg-neutral-950" style={{ width: `${[82, 70, 94, 44, 36][i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-950/10 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-950/10 p-6">
              <h4 className="text-lg font-black">User & Worker Management</h4>
              <div className="rounded-xl bg-neutral-100 p-1 text-sm font-black">
                <span className="inline-block rounded-lg bg-white px-4 py-2 shadow-sm">All users</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-neutral-100 text-xs font-black uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Profile</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-950/10">
                  {typedUsers.map((u) => (
                    <tr key={u.id} className="transition hover:bg-neutral-50">
                      <td className="flex items-center gap-4 px-6 py-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-300 text-lg font-black">
                          {u.full_name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black">{u.full_name}</p>
                          <p className="text-xs text-neutral-500">{u.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-lime-300 bg-lime-300/20 px-3 py-1 text-xs font-black uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={u.profile_completed ? "font-bold text-lime-700" : "font-bold text-amber-600"}>
                          {u.profile_completed ? "Verified" : "Pending Review"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{u.phone}</td>
                      <td className="px-6 py-4">
                        <button className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-black">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
