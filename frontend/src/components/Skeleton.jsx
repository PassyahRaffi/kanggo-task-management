const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const KanbanSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {['Pending', 'In Progress', 'Done'].map((label) => (
      <div key={label} className="flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b-2 bg-gray-50 border-gray-200">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
          <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="ml-auto h-5 w-6 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-h-[200px] p-2 rounded-b-xl border border-t-0 border-gray-200 bg-gray-50 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="border-t border-gray-100 pt-2 flex gap-1.5">
                <div className="flex-1 h-5 bg-gray-100 rounded" />
                <div className="flex-1 h-5 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i}>
        <div className="h-3 w-16 bg-gray-200 rounded mb-1.5" />
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    ))}
    <div className="h-10 bg-gray-200 rounded-lg mt-2" />
  </div>
);

export const CommentsSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between mb-2">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    ))}
  </div>
);

export const ActivitySkeleton = () => (
  <div className="animate-pulse relative border-l border-gray-200 ml-3 space-y-5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="ml-5 relative">
        <div className="absolute -left-8 top-0 w-5 h-5 rounded-full bg-gray-200" />
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
      </div>
    ))}
  </div>
);

export default Skeleton;
