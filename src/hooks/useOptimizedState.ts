
import { useState, useCallback, useRef, useEffect } from 'react';

export const useOptimizedState = <T>(initialState: T, delay: number = 300) => {
  const [state, setState] = useState<T>(initialState);
  const [debouncedState, setDebouncedState] = useState<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setOptimizedState = useCallback((newState: T | ((prev: T) => T)) => {
    const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(state) : newState;
    setState(resolvedState);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedState(resolvedState);
    }, delay);
  }, [state, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setOptimizedState, debouncedState] as const;
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const ref = useRef<T>(callback);
  const depsRef = useRef(deps);
  
  // Check if dependencies have changed
  const depsChanged = deps.some((dep, index) => dep !== depsRef.current[index]);
  
  if (depsChanged) {
    ref.current = callback;
    depsRef.current = deps;
  }
  
  return ref.current;
};

export const useThrottledValue = <T>(value: T, delay: number = 100): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdate.current >= delay) {
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, delay - (now - lastUpdate.current));
      
      return () => clearTimeout(timeoutId);
    }
  }, [value, delay]);

  return throttledValue;
};
