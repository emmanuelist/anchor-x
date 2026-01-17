import { ShimmerSkeleton } from './skeleton';
import { GlowCard } from './GlowCard';

export function TransactionsSkeleton() {
  return (
    <>
      {/* Title */}
      <ShimmerSkeleton className="h-6 w-32 mb-4 sm:mb-6" />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <ShimmerSkeleton className="h-9 sm:h-10 w-full rounded-md" />
        <div className="flex gap-2 sm:gap-3">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <ShimmerSkeleton key={i} className="h-9 sm:h-10 w-16 rounded-lg" />
            ))}
          </div>
          <div className="w-px bg-border/50 hidden sm:block" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <ShimmerSkeleton key={i} className="h-9 sm:h-10 w-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5 sm:space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <GlowCard key={i} className="space-y-2.5 sm:space-y-3 p-3 sm:p-4" hover={false}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <ShimmerSkeleton className="h-5 w-5 rounded-full" />
                  <ShimmerSkeleton className="h-3 w-3" />
                  <ShimmerSkeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <ShimmerSkeleton className="h-4 w-28" />
                  <ShimmerSkeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShimmerSkeleton className="h-5 w-20 rounded-full" />
                <ShimmerSkeleton className="h-4 w-4" />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-border/50">
              <div className="space-y-1">
                <ShimmerSkeleton className="h-3 w-10" />
                <ShimmerSkeleton className="h-4 w-32" />
              </div>
              <div className="space-y-1">
                <ShimmerSkeleton className="h-3 w-8" />
                <ShimmerSkeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Fee & Explorer */}
            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-border/50">
              <ShimmerSkeleton className="h-3 w-20" />
              <ShimmerSkeleton className="h-3 w-28" />
            </div>
          </GlowCard>
        ))}
      </div>
    </>
  );
}