import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import "../MeetingLinks/style.css";

const GROUP_RULE_OPTIONS = [
  { value: "any", label: "Any group" },
  { value: "no_all_male_groups", label: "Reject all-male groups" },
];

const DEFAULT_POLICY = {
  type: "tiered_refund_v1",
  tiers: [
    { min_days: 14, refund_pct: 100 },
    { min_days: 7, refund_pct: 50 },
    { min_days: 0, refund_pct: 0 },
  ],
};

const getTierRefund = (policy, minDays, fallback) => {
  if (!policy || !Array.isArray(policy.tiers)) return fallback;
  const tier = policy.tiers.find((t) => Number(t?.min_days) === minDays);
  return Number.isFinite(Number(tier?.refund_pct)) ? Number(tier.refund_pct) : fallback;
};

export const EhostBookingPreferences = () => {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [minNotice, setMinNotice] = useState("0");
  const [minGroupSize, setMinGroupSize] = useState("1");
  const [maxGroupSize, setMaxGroupSize] = useState("");
  const [groupRule, setGroupRule] = useState("any");
  const [refund14, setRefund14] = useState("100");
  const [refund7, setRefund7] = useState("50");
  const [refund0, setRefund0] = useState("0");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const selectedExperience = useMemo(
    () => experiences.find((e) => String(e.id) === String(selectedId)) || null,
    [experiences, selectedId]
  );

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get("/ehost/experiences");
      const list = res.data?.data || res.data || [];
      setExperiences(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        setSelectedId((prev) => prev || String(list[0].id));
      }
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load experiences" });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async (experienceId) => {
    if (!experienceId) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await apiClient.get(`/ehost/experiences/${experienceId}/booking-preferences`);
      const data = res.data?.data || null;
      const policy = data?.cancellation_policy || DEFAULT_POLICY;
      if (!data) {
        setMinNotice("0");
        setMinGroupSize("1");
        setMaxGroupSize("");
        setGroupRule("any");
        setRefund14(String(getTierRefund(DEFAULT_POLICY, 14, 100)));
        setRefund7(String(getTierRefund(DEFAULT_POLICY, 7, 50)));
        setRefund0(String(getTierRefund(DEFAULT_POLICY, 0, 0)));
        return;
      }
      setMinNotice(String(data.min_notice_minutes ?? 0));
      setMinGroupSize(String(data.min_group_size ?? 1));
      setMaxGroupSize(data.max_group_size == null ? "" : String(data.max_group_size));
      setGroupRule(data.group_rule || "any");
      setRefund14(String(getTierRefund(policy, 14, 100)));
      setRefund7(String(getTierRefund(policy, 7, 50)));
      setRefund0(String(getTierRefund(policy, 0, 0)));
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to load booking preferences" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  useEffect(() => {
    if (selectedId) {
      loadPreferences(selectedId);
    }
  }, [selectedId, loadPreferences]);

  const handleSave = async () => {
    if (!selectedId) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    const policy = {
      type: "tiered_refund_v1",
      tiers: [
        { min_days: 14, refund_pct: Number(refund14) },
        { min_days: 7, refund_pct: Number(refund7) },
        { min_days: 0, refund_pct: Number(refund0) },
      ],
    };
    try {
      await apiClient.put(`/ehost/experiences/${selectedId}/booking-preferences`, {
        min_notice_minutes: minNotice === "" ? 0 : Number(minNotice),
        min_group_size: minGroupSize === "" ? 1 : Number(minGroupSize),
        max_group_size: maxGroupSize === "" ? null : Number(maxGroupSize),
        group_rule: groupRule,
        cancellation_policy: policy,
      });
      setStatus({ type: "success", message: "Booking preferences saved" });
    } catch (err) {
      setStatus({ type: "error", message: err?.response?.data?.message || err?.response?.data?.error || "Failed to save" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/");
  };

  return (
    <div className="ml-page">
      <div className="ml-header">
        <div className="ml-title">Booking Preferences</div>
        <div className="ml-actions">
          <button className="ml-btn secondary" onClick={() => navigate("/ehost/meeting-links")}>
            Meeting Links
          </button>
          <button className="ml-btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="ml-card">
        <div className="ml-row">
          <label className="ml-label">Experience</label>
          <select className="ml-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={loading}>
            {experiences.map((e) => (
              <option key={e.id} value={String(e.id)}>
                #{e.id} · {e.location_name || "Experience"} · {e.status || ""}
              </option>
            ))}
          </select>
        </div>

        {selectedExperience && (
          <div className="ml-hint">
            Only upcoming experiences can be configured. If saving fails, confirm the experience start time is in the future.
          </div>
        )}

        <div className="ml-row">
          <label className="ml-label">Minimum Advance Booking (minutes)</label>
          <input
            className="ml-input"
            type="number"
            min="0"
            value={minNotice}
            onChange={(e) => setMinNotice(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Minimum Group Size</label>
          <input
            className="ml-input"
            type="number"
            min="1"
            value={minGroupSize}
            onChange={(e) => setMinGroupSize(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Maximum Group Size</label>
          <input
            className="ml-input"
            type="number"
            min="1"
            value={maxGroupSize}
            onChange={(e) => setMaxGroupSize(e.target.value)}
            placeholder="Leave empty to use capacity"
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Group Rule</label>
          <select className="ml-select" value={groupRule} onChange={(e) => setGroupRule(e.target.value)} disabled={loading}>
            {GROUP_RULE_OPTIONS.map((rule) => (
              <option key={rule.value} value={rule.value}>
                {rule.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-row">
          <label className="ml-label">Refund ≥ 14 Days (%)</label>
          <input
            className="ml-input"
            type="number"
            min="0"
            max="100"
            value={refund14}
            onChange={(e) => setRefund14(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Refund ≥ 7 Days (%)</label>
          <input
            className="ml-input"
            type="number"
            min="0"
            max="100"
            value={refund7}
            onChange={(e) => setRefund7(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="ml-row">
          <label className="ml-label">Refund &lt; 7 Days (%)</label>
          <input
            className="ml-input"
            type="number"
            min="0"
            max="100"
            value={refund0}
            onChange={(e) => setRefund0(e.target.value)}
            disabled={loading}
          />
        </div>

        {status.message && (
          <div className={`ml-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</div>
        )}

        <div className="ml-footer">
          <button className="ml-btn primary" onClick={handleSave} disabled={loading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
