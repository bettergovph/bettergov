import { LoaderCircleIcon } from 'lucide-react';

export default function GuideLoading() {
  return (
    <main className='grid min-h-[55svh] grow place-items-center border-b border-ed-rule bg-ed-paper-2 px-6 py-16'>
      <div
        role='status'
        className='flex flex-col items-center gap-4 text-center text-ed-navy'
      >
        <span className='grid size-14 place-items-center rounded-full border border-ed-navy/10 bg-white'>
          <LoaderCircleIcon
            size={26}
            strokeWidth={1.5}
            aria-hidden='true'
            className='animate-spin motion-reduce:animate-none'
          />
        </span>
        <p className='font-serif-ed text-xl font-semibold max-md:text-lg'>
          Loading guide…
        </p>
      </div>
    </main>
  );
}
