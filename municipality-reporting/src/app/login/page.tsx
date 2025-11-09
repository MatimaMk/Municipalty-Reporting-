"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { storageUtils } from "@/app/utils/localStorage";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate credentials
    const user = storageUtils.validateLogin(formData.email, formData.password);

    if (user) {
      storageUtils.setCurrentUser(user);
      // Redirect to appropriate dashboard based on role
      const dashboardPath = user.role === "staff" ? "/staff-dashboard" : "/resident-dashboard";
      router.push(dashboardPath);
    } else {
      setErrors((prev) => ({
        ...prev,
        general: "Invalid email or password. Please try again.",
      }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <Link href="/landing" className={styles.backLink}>
          ← Back to Home
        </Link>
        <div className={styles.logo}>
          <Image
            src="/images/coat-of-arms.webp"
            alt="Limpopo Coat of Arms"
            width={100}
            height={100}
            className={styles.logoImage}
          />
        </div>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>Welcome Back!</h1>
          <p className={styles.welcomeSubtitle}>
            Sign in to access your account and continue managing your services
            with the Limpopo Provincial Government.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Login to Your Account</h2>
          <p className={styles.formSubtitle}>
            Enter your credentials to continue
          </p>

          {errors.general && (
            <div
              className={styles.errorMessage}
              style={{
                background: "#fee",
                padding: "0.75rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your email"
              />
              {errors.email && (
                <span className={styles.errorMessage}>{errors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your password"
              />
              {errors.password && (
                <span className={styles.errorMessage}>{errors.password}</span>
              )}
            </div>

            <div className={styles.rememberForgot}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                Remember me
              </label>
              <Link href="#" className={styles.forgotLink}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className={styles.submitButton}>
              Sign In
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>OR</span>
          </div>

          <p className={styles.registerPrompt}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.registerLink}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
