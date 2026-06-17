import { Skeleton } from "../../components/Skeleton";

export default function PartidosLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-12 w-80 mb-3" />
      <Skeleton className="h-5 w-96 mb-10" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
