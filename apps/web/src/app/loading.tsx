import { Skeleton } from "../components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-11 pt-10 pb-7 border-b border-border">
        <div className="lg:col-span-2">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-3" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          <Skeleton className="h-80 w-full mb-6" />
          <Skeleton className="h-24 w-full" />
        </div>
        <aside className="lg:col-span-1 flex flex-col gap-4 border-l border-border pl-6">
          <Skeleton className="h-6 w-40 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </aside>
      </section>
    </div>
  );
}
