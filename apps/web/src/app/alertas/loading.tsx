import { Skeleton } from "../../components/Skeleton";

export default function AlertasLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-12 w-80 mb-3" />
      <Skeleton className="h-5 w-96 mb-10" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
