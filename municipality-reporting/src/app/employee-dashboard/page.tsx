"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { storageUtils, User, Issue } from "@/app/utils/localStorage";
import styles from "./employee.module.css";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showModal, setShowModal] = useState(false);
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

    if (currentUser.role !== "employee") {
      router.push(currentUser.role === "staff" ? "/staff-dashboard" : "/resident-dashboard");
      return;
    }

    setUser(currentUser);
    loadAssignedIssues(currentUser.id);
    setLoading(false);
  }, [router]);

  const loadAssignedIssues = (employeeId: string) => {
    const issues = storageUtils.getIssuesAssignedToEmployee(employeeId);
    setAssignedIssues(
      issues.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      storageUtils.logout();
      router.push("/landing");
    }
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
    if (!selectedIssue || !user) return;

    const updates: Partial<Issue> = {
      status: modalData.status,
      staffNotes: modalData.staffNotes,
    };

    if (modalData.status === "resolved" && selectedIssue.status !== "resolved") {
      updates.resolvedAt = new Date().toISOString();
    }

    storageUtils.updateIssue(
      selectedIssue.id,
      updates,
      `${user.firstName} ${user.lastName}`,
      `Status updated by employee`
    );

    if (user) {
      loadAssignedIssues(user.id);
    }
    setShowModal(false);
    setSelectedIssue(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59f00";
      case "in-progress":
        return "#339af0";
      case "resolved":
        return "#40c057";
      case "rejected":
        return "#fa5252";
      default:
        return "#868e96";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#fa5252";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#f59f00";
      case "low":
        return "#868e96";
      default:
        return "#868e96";
    }
  };

  const stats = {
    total: assignedIssues.length,
    pending: assignedIssues.filter((i) => i.status === "pending").length,
    inProgress: assignedIssues.filter((i) => i.status === "in-progress").length,
    resolved: assignedIssues.filter((i) => i.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

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
            <div>
              <div className={styles.logoText}>
                Polokwane Municipality
                <span className={styles.employeeBadge}>Employee</span>
              </div>
              {user?.department && (
                <div className={styles.departmentName}>
                  {user.department.charAt(0).toUpperCase() + user.department.slice(1)} Department
                </div>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className={styles.logoutButton} type="button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.title}>My Assigned Issues</h1>
          <p className={styles.subtitle}>
            Manage and update issues assigned to you
          </p>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#e7f5ff" }}>
              📋
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Assigned</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#fff3e0" }}>
              ⏳
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.pending}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#d0ebff" }}>
              🔧
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.inProgress}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "#d3f9d8" }}>
              ✅
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.resolved}</div>
              <div className={styles.statLabel}>Resolved</div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className={styles.issuesSection}>
          <h2 className={styles.sectionTitle}>Assigned Issues</h2>

          {assignedIssues.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No Issues Assigned Yet</h3>
              <p>You don't have any issues assigned to you at the moment.</p>
            </div>
          ) : (
            <div className={styles.issuesGrid}>
              {assignedIssues.map((issue) => (
                <div key={issue.id} className={styles.issueCard}>
                  <div className={styles.issueHeader}>
                    <div className={styles.issueTitle}>{issue.title}</div>
                    <div className={styles.issueBadges}>
                      <span
                        className={styles.statusBadge}
                        style={{ background: getStatusColor(issue.status) }}
                      >
                        {issue.status}
                      </span>
                      <span
                        className={styles.priorityBadge}
                        style={{ background: getPriorityColor(issue.priority) }}
                      >
                        {issue.priority}
                      </span>
                    </div>
                  </div>

                  <div className={styles.issueDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailIcon}>📍</span>
                      <span className={styles.detailText}>{issue.location}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailIcon}>📅</span>
                      <span className={styles.detailText}>
                        {formatDate(issue.createdAt)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailIcon}>👤</span>
                      <span className={styles.detailText}>
                        Reported by: {issue.userName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewIssue(issue)}
                    className={styles.viewButton}
                    type="button"
                  >
                    View & Update
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal for viewing/updating issue */}
      {showModal && selectedIssue && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Update Issue Status</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.issueInfo}>
                <h3>{selectedIssue.title}</h3>
                <p>{selectedIssue.description}</p>

                {selectedIssue.photoData && (
                  <div className={styles.photoPreview}>
                    <img
                      src={selectedIssue.photoData}
                      alt="Issue"
                      className={styles.issuePhoto}
                    />
                  </div>
                )}
              </div>

              {/* Resident Confirmation/Rejection Status */}
              {selectedIssue.residentConfirmed && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #d3f9d8 0%, #b2f2bb 100%)",
                    padding: "1rem 1.5rem",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                    border: "2px solid #40c057",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "#40c057",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#2b8a3e",
                    }}
                  >
                    Confirmed by resident - Great work!
                  </span>
                </div>
              )}

              {selectedIssue.residentRejected && selectedIssue.residentFeedback && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #ffe3e3 0%, #ffc9c9 100%)",
                    padding: "1rem 1.5rem",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                    border: "2px solid #fa5252",
                  }}
                >
                  <h4
                    style={{
                      color: "#c92a2a",
                      marginTop: 0,
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "1rem",
                    }}
                  >
                    <span>💬</span> Resident Feedback - Needs Attention
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: "#495057",
                      fontSize: "0.95rem",
                      lineHeight: "1.6",
                      fontStyle: "italic",
                      background: "white",
                      padding: "0.75rem",
                      borderRadius: "8px",
                    }}
                  >
                    &ldquo;{selectedIssue.residentFeedback}&rdquo;
                  </p>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Update Status</label>
                <select
                  className={styles.select}
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
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Work Notes</label>
                <textarea
                  className={styles.textarea}
                  value={modalData.staffNotes}
                  onChange={(e) =>
                    setModalData((prev) => ({
                      ...prev,
                      staffNotes: e.target.value,
                    }))
                  }
                  placeholder="Add notes about your work, actions taken, or findings..."
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleUpdateIssue}
                type="button"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}