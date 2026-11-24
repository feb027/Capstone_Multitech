export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Memuat halaman admin">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-xl bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="h-3.5 w-72 rounded-lg bg-black/[0.05] dark:bg-white/[0.05]" />
        </div>
        <div className="h-11 w-40 rounded-full bg-black/[0.08] dark:bg-white/[0.08]" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-24 rounded-[22px] border border-black/[0.05] bg-white/75 p-4 dark:border-white/[0.06] dark:bg-[#1C1C1E]/80"
          />
        ))}
      </div>

      <div className="h-72 rounded-[26px] border border-black/[0.05] bg-white/75 p-5 dark:border-white/[0.06] dark:bg-[#1C1C1E]/80" />
    </div>
  );
}
