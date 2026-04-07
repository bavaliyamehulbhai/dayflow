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

      <div className="page-header" style={{ paddingTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            className="auth-logo-icon aura-float"
            style={{ width: 54, height: 54, marginBottom: 0 }}
          >
            <Bell size={24} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="page-title">Notifications</div>
            <div className="page-subtitle">Signals and upcoming deadlines</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        <NotificationsWidget data={data} navigate={navigate} />
      </div>
    </div>
  );
}
