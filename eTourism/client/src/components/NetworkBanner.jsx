import { useNetworkStatus } from "../utils/networkMonitor";
import "./NetworkBanner.css";

export function NetworkBanner() {
  const status = useNetworkStatus();
  if (status === "good") return null;

  const isOffline = status === "offline";
  const message = isOffline
    ? "You appear to be offline. Changes won't be saved until you reconnect."
    : "Your connection seems unstable. Some actions may take longer than usual.";

  return (
    <div
      className={`network-banner network-banner--${isOffline ? "offline" : "unstable"}`}
      role="status"
      aria-live="polite"
    >
      <span className="network-banner__dot" aria-hidden="true" />
      <span className="network-banner__text">{message}</span>
    </div>
  );
}
