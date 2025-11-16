// utils/analytics.ts
import { Issue, storageUtils } from "./localStorage";

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  rejectedReports: number;
  avgResolutionTime: number; // in days
  categoryBreakdown: CategoryStats[];
  priorityBreakdown: PriorityStats[];
  statusBreakdown: StatusStats[];
  monthlyTrend: TrendData[];
  topIssueTypes: { type: string; count: number }[];
  aiConfidenceAverage: number;
}

export const analyticsUtils = {
  // Calculate resolution time in days
  calculateResolutionTime(issue: Issue): number | null {
    if (issue.status !== "resolved") return null;
    const created = new Date(issue.createdAt);
    const updated = new Date(issue.updatedAt);
    const diffTime = Math.abs(updated.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Get category breakdown
  getCategoryBreakdown(issues: Issue[]): CategoryStats[] {
    const total = issues.length;
    if (total === 0) return [];

    const counts: { [key: string]: number } = {};
    issues.forEach((issue) => {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  },

  // Get priority breakdown
  getPriorityBreakdown(issues: Issue[]): PriorityStats[] {
    const total = issues.length;
    if (total === 0) return [];

    const counts: { [key: string]: number } = {};
    issues.forEach((issue) => {
      counts[issue.priority] = (counts[issue.priority] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
      });
  },

  // Get status breakdown
  getStatusBreakdown(issues: Issue[]): StatusStats[] {
    const total = issues.length;
    if (total === 0) return [];

    const counts: { [key: string]: number } = {};
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  },

  // Get monthly trend (last 6 months)
  getMonthlyTrend(issues: Issue[]): TrendData[] {
    const months: { [key: string]: number } = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }

    // Count issues per month
    issues.forEach((issue) => {
      const date = new Date(issue.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (months.hasOwnProperty(key)) {
        months[key]++;
      }
    });

    return Object.entries(months).map(([date, count]) => ({
      date,
      count,
    }));
  },

  // Get top issue types
  getTopIssueTypes(issues: Issue[], limit: number = 5): { type: string; count: number }[] {
    const counts: { [key: string]: number } = {};

    issues.forEach((issue) => {
      const type = issue.aiAnalysis?.issueType || "Unknown";
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  // Get average AI confidence
  getAverageAIConfidence(issues: Issue[]): number {
    const withConfidence = issues.filter((i) => i.aiConfidence);
    if (withConfidence.length === 0) return 0;

    const sum = withConfidence.reduce((acc, i) => acc + (i.aiConfidence || 0), 0);
    return Math.round((sum / withConfidence.length) * 100);
  },

  // Get comprehensive analytics summary
  getAnalyticsSummary(userId?: string): AnalyticsSummary {
    let issues = storageUtils.getIssues();

    // Filter by user if provided (for residents)
    if (userId) {
      issues = issues.filter((i) => i.userId === userId);
    }

    const resolvedIssues = issues.filter((i) => i.status === "resolved");
    const resolutionTimes = resolvedIssues
      .map((i) => this.calculateResolutionTime(i))
      .filter((t) => t !== null) as number[];

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 0;

    return {
      totalReports: issues.length,
      pendingReports: issues.filter((i) => i.status === "pending").length,
      inProgressReports: issues.filter((i) => i.status === "in-progress").length,
      resolvedReports: resolvedIssues.length,
      rejectedReports: issues.filter((i) => i.status === "rejected").length,
      avgResolutionTime,
      categoryBreakdown: this.getCategoryBreakdown(issues),
      priorityBreakdown: this.getPriorityBreakdown(issues),
      statusBreakdown: this.getStatusBreakdown(issues),
      monthlyTrend: this.getMonthlyTrend(issues),
      topIssueTypes: this.getTopIssueTypes(issues),
      aiConfidenceAverage: this.getAverageAIConfidence(issues),
    };
  },

  // Smart insights generator
  generateInsights(summary: AnalyticsSummary): string[] {
    const insights: string[] = [];

    // Resolution rate insight
    const resolutionRate = Math.round(
      (summary.resolvedReports / summary.totalReports) * 100
    );
    if (resolutionRate > 75) {
      insights.push(`✅ Excellent resolution rate of ${resolutionRate}%`);
    } else if (resolutionRate < 50) {
      insights.push(`⚠️ Resolution rate is ${resolutionRate}%, consider increasing resources`);
    }

    // Avg resolution time insight
    if (summary.avgResolutionTime > 0) {
      if (summary.avgResolutionTime <= 3) {
        insights.push(`🚀 Fast average resolution time of ${summary.avgResolutionTime} days`);
      } else if (summary.avgResolutionTime > 7) {
        insights.push(`⏰ Average resolution time is ${summary.avgResolutionTime} days - consider optimization`);
      }
    }

    // Category insights
    const topCategory = summary.categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push(`📊 ${topCategory.category} issues represent ${topCategory.percentage}% of all reports`);
    }

    // Priority insights
    const urgentCount = summary.priorityBreakdown.find((p) => p.priority === "urgent")?.count || 0;
    if (urgentCount > summary.totalReports * 0.2) {
      insights.push(`🚨 High number of urgent issues (${urgentCount}) - immediate attention required`);
    }

    // AI confidence insight
    if (summary.aiConfidenceAverage > 85) {
      insights.push(`🤖 AI analysis shows ${summary.aiConfidenceAverage}% average confidence`);
    }

    // Pending backlog insight
    if (summary.pendingReports > summary.inProgressReports * 2) {
      insights.push(`📋 Growing backlog: ${summary.pendingReports} pending reports need assignment`);
    }

    return insights;
  },
};
