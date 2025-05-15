import { useEffect, useRef } from 'react';

export function useSafeAsyncEffect(effect: (isCancelled: () => boolean) => void | Promise<void>, deps: React.DependencyList) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const maybePromise = effect(() => cancelledRef.current);

    return () => {
      cancelledRef.current = true;
    };
  }, deps);
}

