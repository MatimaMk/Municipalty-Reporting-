"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./staff.module.css";
import { storageUtils, User, Issue } from "@/app/utils/localStorage";
import { analyticsUtils } from "@/app/utils/analytics";
import { exportUtils } from "@/app/utils/export";
import SmartInsights from "@/app/components/SmartInsights";
import StatsCard from "@/app/components/StatsCard";

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
  });

  const [modalData, setModalData] = useState({
    status: "" as Issue["status"],
    staffNotes: "",
  });

  useEffect(() => {
    const currentUser = storageUtils.getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "staff") {
      router.push("/resident-dashboard");
      return;
    }

    setUser(currentUser);
    loadAllIssues();
    setLoading(false);
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [allIssues, filters]);

  const loadAllIssues = () => {
    const issues = storageUtils.getIssues();
    setAllIssues(
      issues.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );

    // Load analytics for all issues (staff sees everything)
    const summary = analyticsUtils.getAnalyticsSummary();
    setAnalyticsSummary(summary);
  };

  const handleExport = (format: "csv" | "json" | "summary") => {
    exportUtils.exportFiltered(filteredIssues, format);
  };

  const applyFilters = () => {
    let filtered = [...allIssues];

    if (filters.status !== "all") {
      filtered = filtered.filter((issue) => issue.status === filters.status);
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter(
        (issue) => issue.priority === filters.priority
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(
        (issue) => issue.category === filters.category
      );
    }

    setFilteredIssues(filtered);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      storageUtils.logout();
      router.push("/landing");
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setModalData({
      status: issue.status,
      staffNotes: issue.staffNotes || "",
    });
    setShowModal(true);
  };

  const handleUpdateIssue = () => {
    if (!selectedIssue) return;

    const updates: Partial<Issue> = {
      status: modalData.status,
      staffNotes: modalData.staffNotes,
    };

    if (
      modalData.status === "resolved" &&
      selectedIssue.status !== "resolved"
    ) {
      updates.resolvedAt = new Date().toISOString();
    }

    storageUtils.updateIssue(selectedIssue.id, updates);
    loadAllIssues();
    setShowModal(false);
    setSelectedIssue(null);
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStats = () => {
    return storageUtils.getIssuesStats();
  };

  const stats = getStats();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "3rem", marginBottom: "1rem", color: "#2d6a4f" }}
          >
            ⏳
          </div>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>
            Loading staff dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <Image
              src="/images/limpopo_province_government.jpg"
              alt="Limpopo Government"
              width={50}
              height={50}
              className={styles.logoImage}
            />
            <span className={styles.logoText}>
              Municipality Staff Portal
              <span className={styles.staffBadge}>STAFF</span>
            </span>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {getUserInitials(user.firstName, user.lastName)}
              </div>
              <div className={styles.userName}>
                <span className={styles.userNameText}>
                  {user.firstName} {user.lastName}
                </span>
                <span className={styles.userRole}>Municipality Staff</span>
              </div>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Staff Dashboard - Monitoring & Action Center
          </h1>
          <p className={styles.welcomeSubtitle}>
            Monitor all reported issues and take action to serve the community
          </p>
        </section>

        {/* Smart Insights */}
        {analyticsSummary && allIssues.length > 0 && (
          <SmartInsights summary={analyticsSummary} />
        )}

        {/* Statistics Grid - Using StatsCard Component */}
        <section className={styles.statsGrid}>
          <StatsCard
            icon="📋"
            title="Total Issues"
            value={stats.total}
            subtitle="All reported issues"
            color="purple"
          />
          <StatsCard
            icon="⏳"
            title="Pending"
            value={stats.pending}
            subtitle="Awaiting review"
            color="orange"
          />
          <StatsCard
            icon="🔄"
            title="In Progress"
            value={stats.inProgress}
            subtitle="Being addressed"
            color="blue"
          />
          <StatsCard
            icon="✅"
            title="Resolved"
            value={stats.resolved}
            subtitle="Successfully completed"
            color="green"
          />
          <StatsCard
            icon="🚨"
            title="Urgent"
            value={stats.urgent}
            subtitle="Requires immediate attention"
            color="red"
          />
          <StatsCard
            icon="❌"
            title="Rejected"
            value={stats.rejected}
            subtitle="Cannot be addressed"
            color="red"
          />
        </section>

        {/* Analytics Dashboard */}
        {analyticsSummary && allIssues.length > 0 && (
          <section className={styles.analyticsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span>📊</span> Analytics Dashboard
              </h2>
              <div className={styles.exportButtons}>
                <button
                  className={styles.exportButton}
                  onClick={() => handleExport("csv")}
                  title="Export to CSV"
                >
                  📄 CSV
                </button>
                <button
                  className={styles.exportButton}
                  onClick={() => handleExport("json")}
                  title="Export to JSON"
                >
                  📋 JSON
                </button>
                <button
                  className={styles.exportButton}
                  onClick={() => handleExport("summary")}
                  title="Export Summary"
                >
                  📝 Summary
                </button>
              </div>
            </div>

            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <h3>⏱️ Avg Resolution Time</h3>
                <div className={styles.analyticsValue}>
                  {analyticsSummary.avgResolutionTime > 0
                    ? `${analyticsSummary.avgResolutionTime} days`
                    : "N/A"}
                </div>
                <p>Average time to resolve issues</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>🤖 AI Confidence</h3>
                <div className={styles.analyticsValue}>
                  {analyticsSummary.aiConfidenceAverage}%
                </div>
                <p>AI analysis accuracy</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>📈 Resolution Rate</h3>
                <div className={styles.analyticsValue}>
                  {Math.round((stats.resolved / stats.total) * 100)}%
                </div>
                <p>Percentage of resolved issues</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>🏆 Top Category</h3>
                <div className={styles.analyticsValue} style={{ fontSize: '1.8rem' }}>
                  {analyticsSummary.categoryBreakdown[0]?.category || "N/A"}
                </div>
                <p>{analyticsSummary.categoryBreakdown[0]?.count || 0} reports</p>
              </div>
            </div>
          </section>
        )}

        {/* Filters Section */}
        <section className={styles.filtersSection}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Status</label>
              <select
                className={styles.filterSelect}
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                aria-label="Filter issues by status"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Priority</label>
              <select
                className={styles.filterSelect}
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                aria-label="Filter issues by priority"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Category</label>
              <select
                className={styles.filterSelect}
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                aria-label="Filter issues by category"
              >
                <option value="all">All Categories</option>
                <option value="roads">Roads & Infrastructure</option>
                <option value="water">Water & Sanitation</option>
                <option value="electricity">Electricity</option>
                <option value="waste">Waste Management</option>
                <option value="safety">Public Safety</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Issues Section */}
        <section className={styles.issuesSection}>
          <h2 className={styles.sectionTitle}>
            <span>📊</span> All Issues ({filteredIssues.length})
          </h2>

          {filteredIssues.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📭</div>
              <p className={styles.emptyStateText}>
                No issues found with the selected filters
              </p>
            </div>
          ) : (
            <div className={styles.issuesList}>
              {filteredIssues.map((issue) => (
                <div key={issue.id} className={styles.issueCard}>
                  <div className={styles.issueHeader}>
                    <div className={styles.issueHeaderLeft}>
                      <h3 className={styles.issueTitle}>{issue.title}</h3>
                      <div className={styles.issueMetaRow}>
                        <span className={styles.issueMetaItem}>
                          👤 {issue.userName}
                        </span>
                        <span className={styles.issueMetaItem}>
                          📍 {issue.location}
                        </span>
                        <span className={styles.issueMetaItem}>
                          📂 {issue.category}
                        </span>
                        <span className={styles.issueMetaItem}>
                          🕐 {formatDate(issue.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.issueHeaderRight}>
                      <span
                        className={`${styles.statusBadge} ${
                          issue.status === "pending"
                            ? styles.statusPending
                            : issue.status === "in-progress"
                            ? styles.statusInProgress
                            : issue.status === "resolved"
                            ? styles.statusResolved
                            : styles.statusRejected
                        }`}
                      >
                        {issue.status === "in-progress"
                          ? "In Progress"
                          : issue.status.charAt(0).toUpperCase() +
                            issue.status.slice(1)}
                      </span>
                      <span
                        className={`${styles.priorityBadge} ${
                          issue.priority === "urgent"
                            ? styles.priorityUrgent
                            : issue.priority === "high"
                            ? styles.priorityHigh
                            : issue.priority === "medium"
                            ? styles.priorityMedium
                            : styles.priorityLow
                        }`}
                      >
                        {issue.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className={styles.issueDescription}>{issue.description}</p>

                  <div className={styles.issueFooter}>
                    <div>
                      {issue.staffNotes && (
                        <span style={{ fontSize: "0.9rem", color: "#666" }}>
                          📝 Staff notes available
                        </span>
                      )}
                    </div>
                    <div className={styles.issueActions}>
                      <button
                        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                        onClick={() => handleViewIssue(issue)}
                      >
                        View & Update
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Update Issue Modal */}
      {showModal && selectedIssue && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Update Issue</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <h3 style={{ color: "#1e5128", marginBottom: "0.5rem" }}>
                  {selectedIssue.title}
                </h3>
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  {selectedIssue.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "1rem",
                  }}
                >
                  <span>👤 {selectedIssue.userName}</span>
                  <span>📍 {selectedIssue.location}</span>
                  <span>📂 {selectedIssue.category}</span>
                  <span>⚡ Priority: <strong>{selectedIssue.priority.toUpperCase()}</strong></span>
                </div>

                {/* AI Analysis Summary for Staff */}
                {selectedIssue.aiAnalysis && (
                  <div style={{
                    background: "linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                    border: "2px solid #339af0"
                  }}>
                    <h4 style={{ color: "#1971c2", marginTop: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>🤖</span> AI Analysis - Resource Requirements
                    </h4>

                    {/* Cost & Time Estimation */}
                    {selectedIssue.aiAnalysis.estimatedResolution && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1rem",
                        padding: "1rem",
                        background: "white",
                        borderRadius: "8px"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>⏰ Timeframe</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1971c2" }}>
                            {selectedIssue.aiAnalysis.estimatedResolution.timeframe}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>💰 Estimated Cost</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#2d6a4f" }}>
                            {selectedIssue.aiAnalysis.estimatedResolution.estimatedCost}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>👷 Workers Needed</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#e67700" }}>
                            {selectedIssue.aiAnalysis.estimatedResolution.workersRequired} workers
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resources Required */}
                    {selectedIssue.aiAnalysis.estimatedResolution?.resources && selectedIssue.aiAnalysis.estimatedResolution.resources.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1971c2", marginBottom: "0.5rem" }}>
                          🛠️ Required Resources:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.9rem", color: "#495057" }}>
                          {selectedIssue.aiAnalysis.estimatedResolution.resources.slice(0, 5).map((resource, i) => (
                            <li key={i} style={{ marginBottom: "0.25rem" }}>{resource}</li>
                          ))}
                          {selectedIssue.aiAnalysis.estimatedResolution.resources.length > 5 && (
                            <li style={{ fontStyle: "italic", color: "#868e96" }}>
                              ... and {selectedIssue.aiAnalysis.estimatedResolution.resources.length - 5} more (view full report)
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Safety Considerations */}
                    {selectedIssue.aiAnalysis.safetyConsiderations && (
                      <div style={{
                        background: selectedIssue.aiAnalysis.safetyConsiderations.riskLevel === "critical" || selectedIssue.aiAnalysis.safetyConsiderations.riskLevel === "high"
                          ? "#ffe3e3" : "#fff3e0",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        border: `2px solid ${selectedIssue.aiAnalysis.safetyConsiderations.riskLevel === "critical" || selectedIssue.aiAnalysis.safetyConsiderations.riskLevel === "high" ? "#e03131" : "#f59f00"}`
                      }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#c92a2a", marginBottom: "0.5rem" }}>
                          ⚠️ Risk Level: {selectedIssue.aiAnalysis.safetyConsiderations.riskLevel.toUpperCase()}
                        </div>
                        {selectedIssue.aiAnalysis.safetyConsiderations.hazards.length > 0 && (
                          <div style={{ fontSize: "0.85rem", color: "#495057" }}>
                            <strong>Hazards:</strong> {selectedIssue.aiAnalysis.safetyConsiderations.hazards.slice(0, 3).join(", ")}
                            {selectedIssue.aiAnalysis.safetyConsiderations.hazards.length > 3 && "..."}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Immediate Actions */}
                    {selectedIssue.aiAnalysis.recommendations?.immediateActions && selectedIssue.aiAnalysis.recommendations.immediateActions.length > 0 && (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1971c2", marginBottom: "0.5rem" }}>
                          ⚡ Immediate Actions Required:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: "1.5rem", fontSize: "0.9rem", color: "#495057" }}>
                          {selectedIssue.aiAnalysis.recommendations.immediateActions.slice(0, 3).map((action, i) => (
                            <li key={i} style={{ marginBottom: "0.25rem" }}>{action}</li>
                          ))}
                          {selectedIssue.aiAnalysis.recommendations.immediateActions.length > 3 && (
                            <li style={{ fontStyle: "italic", color: "#868e96" }}>
                              ... and {selectedIssue.aiAnalysis.recommendations.immediateActions.length - 3} more actions (view full report)
                            </li>
                          )}
                        </ol>
                      </div>
                    )}

                    {/* View Full Report Button */}
                    <button
                      onClick={() => {
                        setShowModal(false);
                        router.push(`/report/${selectedIssue.id}`);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "linear-gradient(135deg, #339af0 0%, #1c7ed6 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "1rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      📄 View Complete Report with All Details
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Update Status</label>
                <select
                  className={styles.select}
                  aria-label="Update Status"
                  value={modalData.status}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      status: e.target.value as Issue["status"],
                    }))
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Staff Notes</label>
                <textarea
                  className={styles.textarea}
                  value={modalData.staffNotes}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      staffNotes: e.target.value,
                    }))
                  }
                  placeholder="Add notes about actions taken, reasons for rejection, etc."
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleUpdateIssue}
              >
                Update Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 Limpopo Provincial Government - Staff Portal</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          Peace, Unity and Prosperity
        </p>
      </footer>
    </div>
  );
}
