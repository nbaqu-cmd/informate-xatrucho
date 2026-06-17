import { Skeleton } from "../../components/Skeleton";

export default function CongresistasLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-12 w-72 mb-3" />
      <Skeleton className="h-5 w-96 mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full mb-3" />
            <Skeleton className="h-4 w-full mb-1.5" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
