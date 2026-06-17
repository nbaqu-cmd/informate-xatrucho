import { Skeleton } from "../../../components/Skeleton";

export default function LawDetailLoading() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 pt-11 pb-2">
      <Skeleton className="h-4 w-20 mb-5" />
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-11 w-full mb-2" />
      <Skeleton className="h-11 w-2/3 mb-7" />
      <Skeleton className="h-12 w-full mb-7" />
      <Skeleton className="h-[360px] w-full mb-9" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-3/4" />
    </div>
  );
}
