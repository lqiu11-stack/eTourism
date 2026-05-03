import { useEffect, useState } from "react";
import axios from "axios";
import { NETWORK_GOOD_SAMPLE_RATE } from "../constants/enums";

const API_BASE = import.meta.env.VITE_API_URL;
const SLOW_THRESHOLD_MS = 3000;
const ROLLING_WINDOW = 10;
const UNSTABLE_THRESHOLD = 3;
const SELF_HEADER = "x-network-monitor-self";

let installed = false;
let currentExperienceId = null;
const recentOutcomes = [];
const listeners = new Set();
let currentStatus = computeStatus();

export function setExperienceContext(experienceId) {
  currentExperienceId = experienceId || null;
}

export function installAxiosInterceptors(instance = axios) {
  if (installed) return;
  installed = true;

  instance.interceptors.request.use((config) => {
    config.metadata = { startedAt: Date.now() };
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      if (!isSelfRequest(response.config)) {
        const duration = Date.now() - (response.config.metadata?.startedAt ?? Date.now());
        const quality = duration > SLOW_THRESHOLD_MS ? "slow" : "good";
        recordOutcome(quality, quality === "slow" ? `Slow response: ${duration}ms` : null);
      }
      return response;
    },
    (error) => {
      if (!isSelfRequest(error.config)) {
        const duration = Date.now() - (error.config?.metadata?.startedAt ?? Date.now());
        const quality = classifyError(error);
        const detail = buildErrorDetail(error, duration);
        recordOutcome(quality, detail);
      }
      return Promise.reject(error);
    }
  );

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      pushOutcome("good");
      emit();
    });
    window.addEventListener("offline", () => {
      pushOutcome("offline");
      emit();
    });
  }
}

export function useNetworkStatus() {
  const [status, setStatus] = useState(currentStatus);
  useEffect(() => {
    listeners.add(setStatus);
    setStatus(currentStatus);
    return () => listeners.delete(setStatus);
  }, []);
  return status;
}

function recordOutcome(quality, errorDetails) {
  pushOutcome(quality);
  emit();
  if (quality !== "good") {
    sendIssue(quality, errorDetails);
  } else if (Math.random() < NETWORK_GOOD_SAMPLE_RATE) {
    sendIssue("good", null);
  }
}

function pushOutcome(quality) {
  recentOutcomes.push(quality);
  if (recentOutcomes.length > ROLLING_WINDOW) recentOutcomes.shift();
  currentStatus = computeStatus();
}

function computeStatus() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  if (recentOutcomes.length === 0) return "good";
  const last = recentOutcomes.slice(-ROLLING_WINDOW);
  if (last[last.length - 1] === "offline") return "offline";
  const poor = last.filter((q) => q !== "good").length;
  return poor >= UNSTABLE_THRESHOLD ? "unstable" : "good";
}

function emit() {
  for (const fn of listeners) fn(currentStatus);
}

function classifyError(error) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  if (error?.code === "ECONNABORTED") return "failed";
  if (!error?.response) return "failed";
  if (error.response.status >= 500) return "failed";
  return "good";
}

function buildErrorDetail(error, duration) {
  const status = error?.response?.status ? `HTTP ${error.response.status}` : (error?.code || "network error");
  const url = error?.config?.url || "";
  return `${status} ${url} (${duration}ms)`.slice(0, 500);
}

function sendIssue(quality, errorDetails) {
  if (!API_BASE) return;
  const token = localStorage.getItem("token");
  if (!token) return;
  const body = {
    connection_quality: quality,
    error_details: errorDetails,
    experience_id: currentExperienceId,
  };
  axios
    .post(`${API_BASE}/network-logs`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        [SELF_HEADER]: "1",
      },
      timeout: 5000,
    })
    .catch(() => {});
}

function isSelfRequest(config) {
  return Boolean(config?.headers?.[SELF_HEADER]);
}
