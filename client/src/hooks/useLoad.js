import { useEffect, useRef, useState } from "react";
import { apiError } from "../utils/format";

export function useLoad(loader, deps = []) {
  const loaderRef = useRef(loader);
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(deps);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => active && setState({ data, error: "", loading: false }))
      .catch((err) =>
        active && setState({ data: null, error: apiError(err, "Не удалось загрузить данные"), loading: false })
      );
    return () => {
      active = false;
    };
  }, [key, attempt]);

  const setData = (data) => setState((prev) => ({ ...prev, data }));
  const reload = () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    setAttempt((n) => n + 1);
  };

  return { ...state, setData, reload };
}
