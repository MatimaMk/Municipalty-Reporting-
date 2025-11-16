"use client";

import React from "react";
import styles from "./StatsCard.module.css";

interface StatsCardProps {
  icon: string;
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red" | "purple";
}

export default function StatsCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color = "blue",
}: StatsCardProps) {
  return (
    <div className={`${styles.card} ${styles[`card${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <div className={styles.content}>
          <h4 className={styles.title}>{title}</h4>
          <div className={styles.value}>{value}</div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      {trend && (
        <div className={styles.trend}>
          <span className={`${styles.trendIcon} ${trend.isPositive ? styles.trendUp : styles.trendDown}`}>
            {trend.isPositive ? "↗" : "↘"}
          </span>
          <span className={styles.trendValue}>
            {Math.abs(trend.value)}% {trend.isPositive ? "increase" : "decrease"}
          </span>
        </div>
      )}
    </div>
  );
}
