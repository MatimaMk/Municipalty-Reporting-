"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./register.module.css";
import { storageUtils } from "@/app/utils/localStorage";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: "",
  });

  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | ""
  >("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Check password strength
    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength("");
    } else if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (
      password.length < 10 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: "",
    };

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (storageUtils.emailExists(formData.email)) {
      newErrors.email = "This email is already registered";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Register user
    const newUser = storageUtils.addUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    });

    // Auto-login after registration
    storageUtils.setCurrentUser(newUser);

    // Redirect to dashboard
    router.push("/dashboard");
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
          <h1 className={styles.welcomeTitle}>Join Us Today!</h1>
          <p className={styles.welcomeSubtitle}>
            Create your account to access all services and benefits of the
            Limpopo Provincial Government digital platform.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span className={styles.featureText}>
                Access government services online
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span className={styles.featureText}>
                Stay updated with latest news
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✓</span>
              <span className={styles.featureText}>Secure and private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Create Your Account</h2>
          <p className={styles.formSubtitle}>
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <span className={styles.errorMessage}>
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.label}>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <span className={styles.errorMessage}>{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
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
                Password <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="Create a password"
              />
              {errors.password && (
                <span className={styles.errorMessage}>{errors.password}</span>
              )}

              {passwordStrength && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div
                      className={`${styles.strengthFill} ${
                        passwordStrength === "weak"
                          ? styles.strengthWeak
                          : passwordStrength === "medium"
                          ? styles.strengthMedium
                          : styles.strengthStrong
                      }`}
                    ></div>
                  </div>
                  <span className={styles.strengthText}>
                    Password strength:{" "}
                    {passwordStrength.charAt(0).toUpperCase() +
                      passwordStrength.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <span className={styles.errorMessage}>
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <label htmlFor="agreeTerms" className={styles.checkboxLabel}>
                I agree to the <a href="#">Terms and Conditions</a> and{" "}
                <a href="#">Privacy Policy</a>
              </label>
            </div>
            {errors.agreeTerms && (
              <span className={styles.errorMessage}>{errors.agreeTerms}</span>
            )}

            <button type="submit" className={styles.submitButton}>
              Create Account
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>OR</span>
          </div>

          <p className={styles.loginPrompt}>
            Already have an account?{" "}
            <Link href="/login" className={styles.loginLink}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
