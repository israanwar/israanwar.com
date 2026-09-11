import { useEffect, useState } from "react";

export function useAsync(factory, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    factory()
      .then((data) => {
        if (mounted) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (mounted) setState({ data: null, loading: false, error });
      });

    return () => {
      mounted = false;
    };
  }, deps);

  return state;
}
