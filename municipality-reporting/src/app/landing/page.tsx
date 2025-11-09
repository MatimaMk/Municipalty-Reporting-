"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./landing.module.css";
import { storageUtils } from "@/app/utils/localStorage";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardPath, setDashboardPath] = useState("/resident-dashboard");

  useEffect(() => {
    const user = storageUtils.getCurrentUser();
    setIsLoggedIn(!!user);
    if (user) {
      setDashboardPath(user.role === "staff" ? "/staff-dashboard" : "/resident-dashboard");
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image
            src="/images/limpopo_province_government.jpg"
            alt="Limpopo Government"
            width={60}
            height={60}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Limpopo Provincial Government</span>
        </div>
        <nav className={styles.nav}>
          {isLoggedIn ? (
            <>
              <Link href={dashboardPath} className={styles.navLink}>
                Dashboard
              </Link>
              <Link
                href="/landing"
                className={`${styles.navLink} ${styles.navLinkPrimary}`}
              >
                Home
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>
                Login
              </Link>
              <Link
                href="/register"
                className={`${styles.navLink} ${styles.navLinkPrimary}`}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <Image
          src="/images/Sunland-Baobab-before-5.jpg"
          alt="Limpopo Baobab Tree"
          fill
          className={styles.heroBackground}
          priority
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome to Limpopo Provincial Government Portal
          </h1>
          <p className={styles.heroSubtitle}>
            Peace, Unity and Prosperity - Your gateway to government services
            and information
          </p>
          <Link href="/register" className={styles.heroCTA}>
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Our Services</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🏛️</div>
            <h3 className={styles.featureTitle}>Government Services</h3>
            <p className={styles.featureDescription}>
              Access a wide range of provincial government services online, from
              permits to public information requests.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>District Information</h3>
            <p className={styles.featureDescription}>
              Comprehensive information about all five districts: Capricorn,
              Mopani, Sekhukhune, Vhembe, and Waterberg.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3 className={styles.featureTitle}>Digital Platform</h3>
            <p className={styles.featureDescription}>
              Modern, user-friendly digital platform accessible from anywhere,
              anytime on any device.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🤝</div>
            <h3 className={styles.featureTitle}>Community Engagement</h3>
            <p className={styles.featureDescription}>
              Stay connected with community programs, events, and public
              participation initiatives.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📚</div>
            <h3 className={styles.featureTitle}>Resources & News</h3>
            <p className={styles.featureDescription}>
              Latest news, announcements, and resources from the Limpopo
              Provincial Government.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3 className={styles.featureTitle}>Secure & Private</h3>
            <p className={styles.featureDescription}>
              Your information is protected with industry-standard security
              measures and privacy protocols.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLinks}>
            <Link href="#" className={styles.footerLink}>
              About Us
            </Link>
            <Link href="#" className={styles.footerLink}>
              Contact
            </Link>
            <Link href="#" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link href="#" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link href="#" className={styles.footerLink}>
              Help
            </Link>
          </div>
          <p>&copy; 2025 Limpopo Provincial Government. All rights reserved.</p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Peace, Unity and Prosperity
          </p>
        </div>
      </footer>
    </div>
  );
}
