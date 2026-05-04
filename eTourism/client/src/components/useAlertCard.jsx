import { useState, useCallback, useRef } from "react";
import { AlertCard } from "./AlertCard";

export const useAlertCard = () => {
  const [state, setState] = useState({ open: false });
  const resolverRef = useRef(null);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const alert = useCallback((tone, message, title) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, kind: "alert", tone, message, title });
    });
  }, []);

  const confirm = useCallback((message, opts = {}) => {
    const { title, tone = "info", confirmLabel, cancelLabel } = opts;
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, kind: "confirm", tone, message, title, confirmLabel, cancelLabel });
    });
  }, []);

  const onConfirm = useCallback(() => {
    close();
    const r = resolverRef.current;
    resolverRef.current = null;
    r?.(true);
  }, [close]);

  const onCancel = useCallback(() => {
    close();
    const r = resolverRef.current;
    resolverRef.current = null;
    r?.(false);
  }, [close]);

  const card = <AlertCard state={state} onConfirm={onConfirm} onCancel={onCancel} />;
  return { alert, confirm, card };
};
