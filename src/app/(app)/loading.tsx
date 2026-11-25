export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-3 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-8 w-52 rounded-xl bg-white/[0.07]" />
        </div>
        <div className="h-10 w-44 rounded-2xl bg-white/[0.05]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-3xl border border-white/[0.05] bg-white/[0.025]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-[340px] rounded-3xl border border-white/[0.05] bg-white/[0.025] lg:col-span-8" />
        <div className="h-[340px] rounded-3xl border border-white/[0.05] bg-white/[0.025] lg:col-span-4" />
      </div>
    </div>
  );
}
