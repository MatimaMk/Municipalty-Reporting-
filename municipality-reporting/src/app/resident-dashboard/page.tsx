"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./resident.module.css";
import { storageUtils, User, Issue } from "@/app/utils/localStorage";
import { analyticsUtils } from "@/app/utils/analytics";
import SmartInsights from "@/app/components/SmartInsights";
import StatsCard from "@/app/components/StatsCard";

export default function ResidentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);

  useEffect(() => {
    const currentUser = storageUtils.getCurrentUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "resident") {
      router.push("/staff-dashboard");
      return;
    }

    setUser(currentUser);
    loadMyIssues(currentUser.id);
    setLoading(false);
  }, [router]);

  const loadMyIssues = (userId: string) => {
    const issues = storageUtils.getIssuesByUser(userId);
    setMyIssues(
      issues.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );

    // Load analytics
    const summary = analyticsUtils.getAnalyticsSummary(userId);
    setAnalyticsSummary(summary);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      storageUtils.logout();
      router.push("/landing");
    }
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
    });
  };

  const getStatusCount = (status: Issue["status"]) => {
    return myIssues.filter((issue) => issue.status === status).length;
  };

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
            Loading dashboard...
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
            <span className={styles.logoText}>Resident Portal</span>
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
                <span className={styles.userRole}>Resident</span>
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
          <h1 className={styles.welcomeTitle}>Welcome, {user.firstName}!</h1>
          <p className={styles.welcomeSubtitle}>
            Report community issues and track their progress
          </p>
          <button
            className={styles.reportButton}
            onClick={() => router.push("/create-report")}
          >
            <span>🤖</span> AI-Powered Report
          </button>
        </section>

        {/* Smart Insights */}
        {analyticsSummary && myIssues.length > 0 && (
          <SmartInsights summary={analyticsSummary} />
        )}

        {/* Statistics Grid - Using StatsCard Component */}
        <section className={styles.statsGrid}>
          <StatsCard
            icon="⏳"
            title="Pending"
            value={getStatusCount("pending")}
            subtitle="Awaiting review"
            color="orange"
          />
          <StatsCard
            icon="🔧"
            title="In Progress"
            value={getStatusCount("in-progress")}
            subtitle="Being addressed"
            color="blue"
          />
          <StatsCard
            icon="✅"
            title="Resolved"
            value={getStatusCount("resolved")}
            subtitle="Successfully completed"
            color="green"
          />
          <StatsCard
            icon="📊"
            title="Total Issues"
            value={myIssues.length}
            subtitle="All reported issues"
            color="purple"
          />
        </section>

        {/* Analytics Summary */}
        {analyticsSummary && myIssues.length > 0 && (
          <section className={styles.analyticsSection}>
            <h2 className={styles.sectionTitle}>
              <span>📊</span> Your Report Statistics
            </h2>
            <div className={styles.analyticsGrid}>
              <div className={styles.analyticsCard}>
                <h3>📈 Average Resolution Time</h3>
                <div className={styles.analyticsValue}>
                  {analyticsSummary.avgResolutionTime > 0
                    ? `${analyticsSummary.avgResolutionTime} days`
                    : "N/A"}
                </div>
                <p>Time to resolve your reports</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>🎯 AI Confidence</h3>
                <div className={styles.analyticsValue}>
                  {analyticsSummary.aiConfidenceAverage}%
                </div>
                <p>AI analysis accuracy</p>
              </div>
              <div className={styles.analyticsCard}>
                <h3>📋 Top Category</h3>
                <div className={styles.analyticsValue}>
                  {analyticsSummary.categoryBreakdown[0]?.category || "N/A"}
                </div>
                <p>Most reported issue type</p>
              </div>
            </div>
          </section>
        )}

        {/* My Issues */}
        <section className={styles.myIssues}>
          <h2 className={styles.sectionTitle}>
            <span>📋</span> My Reported Issues
          </h2>

          {myIssues.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <p className={styles.emptyText}>
                You haven&apos;t reported any issues yet
              </p>
              <button
                className={styles.reportButton}
                onClick={() => router.push("/create-report")}
              >
                <span>🤖</span> AI-Powered Report
              </button>
            </div>
          ) : (
            <div className={styles.issuesList}>
              {myIssues.map((issue) => (
                <div key={issue.id} className={styles.issueCard}>
                  <div className={styles.issueHeader}>
                    <div>
                      <h3 className={styles.issueTitle}>{issue.title}</h3>
                      <div className={styles.issueMeta}>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[
                              `status${
                                issue.status.charAt(0).toUpperCase() +
                                issue.status.slice(1).replace("-", "")
                              }`
                            ]
                          }`}
                        >
                          {issue.status}
                        </span>
                        <span
                          className={`${styles.priorityBadge} ${
                            styles[
                              `priority${
                                issue.priority.charAt(0).toUpperCase() +
                                issue.priority.slice(1)
                              }`
                            ]
                          }`}
                        >
                          {issue.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.issueDescription}>{issue.description}</p>
                  <div className={styles.issueDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Category</span>
                      <span className={styles.detailValue}>
                        {issue.category}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Location</span>
                      <span className={styles.detailValue}>
                        {issue.location}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Reported</span>
                      <span className={styles.detailValue}>
                        {formatDate(issue.createdAt)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Last Updated</span>
                      <span className={styles.detailValue}>
                        {formatDate(issue.updatedAt)}
                      </span>
                    </div>
                  </div>
                  {issue.staffNotes && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "#e9ecef",
                        borderRadius: "8px",
                      }}
                    >
                      <span className={styles.detailLabel}>Staff Notes:</span>
                      <p style={{ marginTop: "0.5rem", color: "#666" }}>
                        {issue.staffNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 Limpopo Provincial Government. All rights reserved.</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          Peace, Unity and Prosperity
        </p>
      </footer>
    </div>
  );
}
