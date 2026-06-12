export function LoadingGrid() {
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className='bg-white rounded-xl border border-gray-200 h-72 shadow-sm animate-pulse'
        >
          {/* Banner skeleton */}
          <div className='h-36 bg-gray-100 rounded-t-xl' />
          {/* Body skeleton */}
          <div className='px-4 pt-3.5 flex flex-col gap-2.5'>
            <div className='h-3.5 bg-gray-100 rounded w-3/4' />
            <div className='h-3 bg-gray-100 rounded w-full' />
            <div className='h-3 bg-gray-100 rounded w-5/6' />
          </div>
        </div>
      ))}
    </div>
  );
}
