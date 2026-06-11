import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { dashboardAPI } from "../utils/api";
import NotificationsWidget from "../components/dashboard/NotificationsWidget";
import AuraOrb from "../components/common/AuraOrb";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: () => dashboardAPI.get().then((r) => r.data.dashboard),
  });

  return (
    <div
      className="responsive-container page-shell"
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}
    >
      <AuraOrb
        color="rgba(124, 109, 250, 0.15)"
        size="520px"
        top="-10%"
        left="-10%"
        delay={0}
      />
      <AuraOrb
        color="rgba(0, 242, 254, 0.12)"
        size="420px"
        top="60%"
        left="60%"
        delay={4}
      />

      <div
        className="dashboard-header-premium"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px 24px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <AuraOrb
          color="var(--accent)"
          size={200}
          top="-60px"
          left="-30px"
          delay={0}
          duration={15}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
          <Bell
            className="text-accent aura-float"
            size={28}
          />
          <div>
            <h1
              className="dashboard-title"
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                fontFamily: "Syne, sans-serif",
                margin: 0,
                color: "var(--text)"
              }}
            >
              Notifications
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text2)", margin: "4px 0 0" }}>
              Signals and upcoming deadlines
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        <NotificationsWidget data={data} navigate={navigate} />
      </div>
    </div>
  );
}
