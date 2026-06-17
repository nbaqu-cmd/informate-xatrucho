export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-paper-200 animate-pulse ${className}`} />;
}
