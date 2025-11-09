"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./resident.module.css";
import { storageUtils, User, Issue } from "@/app/utils/localStorage";
import {
  getCurrentLocation,
  formatCoordinates,
  getGoogleMapsUrl,
} from "@/app/utils/geoLocation";
import {
  categorizeIssue,
  getPriorityFromCategory,
  getCategoryDisplayName,
} from "@/app/utils/aiCategorization";

export default function ResidentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "roads",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    photoData: undefined as string | undefined,
    priority: "medium" as Issue["priority"],
  });

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
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      storageUtils.logout();
      router.push("/landing");
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Get AI categorization results
    const aiResult = await categorizeIssue(formData.title, formData.description);

    const newIssue = storageUtils.addIssue({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      photoData: formData.photoData,
      aiCategory: aiResult.category,
      aiConfidence: aiResult.confidence,
      status: "pending",
      priority: formData.priority,
    });

    setMyIssues([newIssue, ...myIssues]);
    setShowModal(false);
    setPhotoPreview(null);
    setAiSuggestion("");
    setFormData({
      title: "",
      description: "",
      category: "roads",
      location: "",
      latitude: undefined,
      longitude: undefined,
      photoData: undefined,
      priority: "medium",
    });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setFormData((prev) => ({ ...prev, photoData: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setFormData((prev) => ({
        ...prev,
        location:
          location.address ||
          formatCoordinates(location.latitude, location.longitude),
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      alert(`Location detected: ${location.address || "Coordinates saved"}`);
    } catch (error: any) {
      alert(error.message || "Could not get location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAICategorize = async () => {
    if (!formData.title && !formData.description) {
      alert("Please enter a title or description first");
      return;
    }

    setAiSuggestion("Analyzing with AI...");

    try {
      const result = await categorizeIssue(formData.title, formData.description);
      const suggestedPriority = getPriorityFromCategory(result.category);

      setFormData((prev) => ({
        ...prev,
        category: result.category,
        priority: suggestedPriority,
      }));

      setAiSuggestion(
        `AI suggests: ${getCategoryDisplayName(result.category)} (${Math.round(
          result.confidence * 100
        )}% confidence) - Priority: ${suggestedPriority.toUpperCase()}`
      );
    } catch (error) {
      setAiSuggestion("AI categorization failed. Please select manually.");
      console.error("AI categorization error:", error);
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
            onClick={() => setShowModal(true)}
          >
            <span>📝</span> Report New Issue
          </button>
        </section>

        {/* Statistics Grid */}
        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardPending}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Pending</span>
              <span className={styles.statIcon}>⏳</span>
            </div>
            <div className={styles.statValue}>{getStatusCount("pending")}</div>
            <p className={styles.statDescription}>Awaiting review</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardProgress}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>In Progress</span>
              <span className={styles.statIcon}>🔧</span>
            </div>
            <div className={styles.statValue}>
              {getStatusCount("in-progress")}
            </div>
            <p className={styles.statDescription}>Being addressed</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardResolved}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Resolved</span>
              <span className={styles.statIcon}>✅</span>
            </div>
            <div className={styles.statValue}>{getStatusCount("resolved")}</div>
            <p className={styles.statDescription}>Successfully completed</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardRejected}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Total Issues</span>
              <span className={styles.statIcon}>📊</span>
            </div>
            <div className={styles.statValue}>{myIssues.length}</div>
            <p className={styles.statDescription}>All reported issues</p>
          </div>
        </section>

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
                onClick={() => setShowModal(true)}
              >
                <span>📝</span> Report Your First Issue
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

      {/* Report Issue Modal */}
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Report New Issue</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Issue Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={styles.input}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category" className={styles.label}>
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={styles.select}
                  required
                >
                  <option value="roads">Roads & Infrastructure</option>
                  <option value="water">Water & Sanitation</option>
                  <option value="electricity">Electricity</option>
                  <option value="waste">Waste Management</option>
                  <option value="safety">Public Safety</option>
                  <option value="parks">Parks & Recreation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="location" className={styles.label}>
                  Location <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className={styles.input}
                  placeholder="Street address or area"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="priority" className={styles.label}>
                  Priority <span className={styles.required}>*</span>
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Issue["priority"],
                    })
                  }
                  className={styles.select}
                  required
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Needs attention</option>
                  <option value="high">High - Significant problem</option>
                  <option value="urgent">Urgent - Immediate danger</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={styles.textarea}
                  placeholder="Detailed description of the issue..."
                  required
                />
              </div>

              {/* GPS Location Button */}
              <div className={styles.formGroup}>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className={styles.locationButton}
                  disabled={loadingLocation}
                >
                  {loadingLocation ? "Getting Location..." : "📍 Get Current Location"}
                </button>
                {formData.latitude && formData.longitude && (
                  <p style={{ fontSize: "0.85rem", color: "#2d6a4f", marginTop: "0.5rem" }}>
                    Location captured: {formatCoordinates(formData.latitude, formData.longitude)}
                  </p>
                )}
              </div>

              {/* Photo Upload */}
              <div className={styles.formGroup}>
                <label htmlFor="photo" className={styles.label}>
                  Add Photo (Optional)
                </label>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className={styles.fileInput}
                />
                {photoPreview && (
                  <div style={{ marginTop: "1rem" }}>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                        border: "2px solid #dee2e6"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* AI Categorization */}
              <div className={styles.formGroup}>
                <button
                  type="button"
                  onClick={handleAICategorize}
                  className={styles.aiButton}
                >
                  🤖 Suggest Category & Priority
                </button>
                {aiSuggestion && (
                  <p style={{
                    fontSize: "0.9rem",
                    color: "#2d6a4f",
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: "#d4edda",
                    borderRadius: "6px"
                  }}>
                    {aiSuggestion}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className={styles.submitButton}>
                  Submit Issue
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
