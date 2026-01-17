import { ShimmerSkeleton } from './skeleton';
import { GlowCard } from './GlowCard';

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Title */}
      <ShimmerSkeleton className="h-7 w-32 mb-6 sm:mb-8" />

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <GlowCard className="h-full" hover={false}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShimmerSkeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
              <div className="space-y-2">
                <ShimmerSkeleton className="h-3 w-16" />
                <ShimmerSkeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <ShimmerSkeleton className="h-8 w-20" />
              <ShimmerSkeleton className="h-3 w-12 ml-auto" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ShimmerSkeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <ShimmerSkeleton className="h-6 w-28" />
              <ShimmerSkeleton className="h-3 w-12" />
            </div>
          </div>
        </GlowCard>

        <GlowCard className="h-full" hover={false}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShimmerSkeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
              <div className="space-y-2">
                <ShimmerSkeleton className="h-3 w-16" />
                <ShimmerSkeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <ShimmerSkeleton className="h-8 w-20" />
              <ShimmerSkeleton className="h-3 w-12 ml-auto" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ShimmerSkeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <ShimmerSkeleton className="h-6 w-28" />
              <ShimmerSkeleton className="h-3 w-12" />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Total & Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <GlowCard className="sm:col-span-1" hover={false}>
          <ShimmerSkeleton className="h-3 w-24 mb-2" />
          <ShimmerSkeleton className="h-8 w-32 mb-3" />
          <ShimmerSkeleton className="h-24 w-full rounded-lg" />
        </GlowCard>

        <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
          <ShimmerSkeleton className="h-[56px] sm:h-[64px] lg:h-[72px] rounded-lg" />
          <ShimmerSkeleton className="h-[56px] sm:h-[64px] lg:h-[72px] rounded-lg" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <ShimmerSkeleton className="h-5 w-40" />
          <ShimmerSkeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <GlowCard key={i} className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6" hover={false}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ShimmerSkeleton className="h-6 w-6 rounded-full" />
                  <ShimmerSkeleton className="h-3 w-3" />
                  <ShimmerSkeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <ShimmerSkeleton className="h-4 w-24" />
                  <ShimmerSkeleton className="h-3 w-16" />
                </div>
              </div>
              <ShimmerSkeleton className="h-6 w-20 rounded-full" />
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Network Status */}
      <div>
        <ShimmerSkeleton className="h-5 w-32 mb-3 sm:mb-4" />
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <GlowCard key={i} className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4" hover={false}>
              <ShimmerSkeleton className="h-3 w-3 rounded-full" />
              <ShimmerSkeleton className="h-4 w-16" />
              <ShimmerSkeleton className="h-3 w-10" />
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}