import { Skeleton } from "../../components/Skeleton";

export default function LeyesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-12 w-72 mb-3" />
      <Skeleton className="h-5 w-96 mb-10" />
      <div className="flex gap-2 mb-2 border-t border-b border-border py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="py-6 border-b border-border">
          <Skeleton className="h-4 w-48 mb-3" />
          <Skeleton className="h-7 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
