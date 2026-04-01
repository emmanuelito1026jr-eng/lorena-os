interface SkeletonProps {
  className?: string;
}

function SkeletonBase({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-dashboard-border rounded ${className}`}
    />
  );
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-xl border border-dashboard-border p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-32" />
          <SkeletonBase className="h-3 w-20" />
        </div>
        <SkeletonBase className="h-6 w-14 rounded-full" />
      </div>
      <SkeletonBase className="h-3 w-full mb-2" />
      <SkeletonBase className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 5, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <SkeletonBase className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBase className="h-3.5 w-40" />
            <SkeletonBase className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

const mdColsMap: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

export function SkeletonStats({ count = 4, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`grid grid-cols-2 ${mdColsMap[count] ?? 'md:grid-cols-4'} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-dashboard-border p-4">
          <SkeletonBase className="h-3 w-20 mb-2" />
          <SkeletonBase className="h-7 w-16 mb-1" />
          <SkeletonBase className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPropertyCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white border border-gray-200 overflow-hidden ${className}`}>
      <SkeletonBase className="h-56 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <SkeletonBase className="h-7 w-32" />
        <SkeletonBase className="h-4 w-48" />
        <SkeletonBase className="h-3 w-36" />
        <div className="flex gap-4 pt-3 border-t border-gray-100">
          <SkeletonBase className="h-4 w-16" />
          <SkeletonBase className="h-4 w-16" />
          <SkeletonBase className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPropertyGrid({ count = 6, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPropertyCard key={i} />
      ))}
    </div>
  );
}

export { SkeletonBase as Skeleton };
