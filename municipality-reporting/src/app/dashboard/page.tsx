"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { storageUtils, User } from "@/app/utils/localStorage";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [accountAge, setAccountAge] = useState<string>("");

  useEffect(() => {
    // Check if user is logged in
    const currentUser = storageUtils.getCurrentUser();

    if (!currentUser) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    setUser(currentUser);

    // Get all users for statistics
    const users = storageUtils.getUsers();
    setAllUsers(users);

    // Calculate account age
    const createdDate = new Date(currentUser.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      setAccountAge("Today");
    } else if (diffDays === 1) {
      setAccountAge("1 day ago");
    } else if (diffDays < 30) {
      setAccountAge(`${diffDays} days ago`);
    } else {
      const months = Math.floor(diffDays / 30);
      setAccountAge(`${months} month${months > 1 ? "s" : ""} ago`);
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
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
      month: "long",
      day: "numeric",
    });
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
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              color: "#2d6a4f",
            }}
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

  if (!user) {
    return null;
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
            <span className={styles.logoText}>Limpopo Government Portal</span>
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
                <span className={styles.userEmail}>{user.email}</span>
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
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {user.firstName}!
            </h1>
            <p className={styles.welcomeSubtitle}>
              Peace, Unity and Prosperity - Your government services dashboard
            </p>
          </div>
          <Image
            src="/images/coat-of-arms.webp"
            alt="Limpopo Coat of Arms"
            width={120}
            height={120}
            className={styles.welcomeImage}
          />
        </section>

        {/* Statistics Grid */}
        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Total Users</span>
              <span className={styles.statIcon}>👥</span>
            </div>
            <div className={styles.statValue}>{allUsers.length}</div>
            <p className={styles.statDescription}>Registered on the platform</p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardOrange}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Account Status</span>
              <span className={styles.statIcon}>✅</span>
            </div>
            <div className={styles.statValue}>Active</div>
            <p className={styles.statDescription}>
              Your account is in good standing
            </p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Services</span>
              <span className={styles.statIcon}>🏛️</span>
            </div>
            <div className={styles.statValue}>6</div>
            <p className={styles.statDescription}>
              Available government services
            </p>
          </div>

          <div className={`${styles.statCard} ${styles.statCardPurple}`}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Member Since</span>
              <span className={styles.statIcon}>📅</span>
            </div>
            <div className={styles.statValue} style={{ fontSize: "1.5rem" }}>
              {accountAge}
            </div>
            <p className={styles.statDescription}>
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>
            <span>⚡</span> Quick Actions
          </h2>
          <div className={styles.actionsGrid}>
            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>📄</div>
              <h3 className={styles.actionTitle}>Apply for Permit</h3>
              <p className={styles.actionDescription}>
                Submit permit applications
              </p>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>📊</div>
              <h3 className={styles.actionTitle}>View Documents</h3>
              <p className={styles.actionDescription}>Access your documents</p>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>💬</div>
              <h3 className={styles.actionTitle}>Contact Support</h3>
              <p className={styles.actionDescription}>Get help from our team</p>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>📍</div>
              <h3 className={styles.actionTitle}>Find Office</h3>
              <p className={styles.actionDescription}>Locate nearest office</p>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>📰</div>
              <h3 className={styles.actionTitle}>Latest News</h3>
              <p className={styles.actionDescription}>Provincial updates</p>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>⚙️</div>
              <h3 className={styles.actionTitle}>Settings</h3>
              <p className={styles.actionDescription}>Manage your account</p>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.recentActivity}>
          <h2 className={styles.sectionTitle}>
            <span>📋</span> Recent Activity
          </h2>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div
                className={`${styles.activityIconWrapper} ${styles.activityIconGreen}`}
              >
                ✓
              </div>
              <div className={styles.activityContent}>
                <h3 className={styles.activityTitle}>Account Created</h3>
                <p className={styles.activityDescription}>
                  Your account was successfully created and verified
                </p>
              </div>
              <span className={styles.activityTime}>
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div className={styles.activityItem}>
              <div
                className={`${styles.activityIconWrapper} ${styles.activityIconBlue}`}
              >
                🔐
              </div>
              <div className={styles.activityContent}>
                <h3 className={styles.activityTitle}>Login Successful</h3>
                <p className={styles.activityDescription}>
                  You logged in to your dashboard
                </p>
              </div>
              <span className={styles.activityTime}>Just now</span>
            </div>

            <div className={styles.activityItem}>
              <div
                className={`${styles.activityIconWrapper} ${styles.activityIconOrange}`}
              >
                📧
              </div>
              <div className={styles.activityContent}>
                <h3 className={styles.activityTitle}>Welcome Email Sent</h3>
                <p className={styles.activityDescription}>
                  Check your email for important information
                </p>
              </div>
              <span className={styles.activityTime}>
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </section>

        {/* Account Information */}
        <section className={styles.accountInfo}>
          <h2 className={styles.sectionTitle}>
            <span>👤</span> Account Information
          </h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>Full Name</p>
              <p className={styles.infoValue}>
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>Email Address</p>
              <p className={styles.infoValue}>{user.email}</p>
            </div>

            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>User ID</p>
              <p className={styles.infoValue}>{user.id}</p>
            </div>

            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>Registration Date</p>
              <p className={styles.infoValue}>{formatDate(user.createdAt)}</p>
            </div>

            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>Account Type</p>
              <p className={styles.infoValue}>Citizen</p>
            </div>

            <div className={styles.infoItem}>
              <p className={styles.infoLabel}>Status</p>
              <p className={styles.infoValue}>Active & Verified</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2025 Limpopo Provincial Government. All rights reserved.</p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Peace, Unity and Prosperity
          </p>
        </div>
      </footer>
    </div>
  );
}
