import { useEffect, useRef, useState } from 'react';

type Size = {
  width: number;
  height: number;
};

/**
 * useResizeObserver
 *
 * A hook that observes size changes of a target element.
 *
 * @param targetRef - React ref pointing to the element you want to observe
 * @returns size object {width, height}
 */
export function useResizeObserver<T extends HTMLElement>() {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const ref = useRef<T>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return { ref, width: size.width, height: size.height };
}
