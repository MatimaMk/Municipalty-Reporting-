"use client";

import React from "react";
import { analyticsUtils, AnalyticsSummary } from "@/app/utils/analytics";
import styles from "./SmartInsights.module.css";

interface SmartInsightsProps {
  summary: AnalyticsSummary;
}

export default function SmartInsights({ summary }: SmartInsightsProps) {
  const insights = analyticsUtils.generateInsights(summary);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>💡</span>
        <h3 className={styles.title}>Smart Insights</h3>
      </div>

      <div className={styles.insightsList}>
        {insights.map((insight, index) => (
          <div key={index} className={styles.insightItem}>
            <div className={styles.insightBullet}></div>
            <p className={styles.insightText}>{insight}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerIcon}>🤖</span>
        <span className={styles.footerText}>AI-generated insights based on your data</span>
      </div>
    </div>
  );
}
