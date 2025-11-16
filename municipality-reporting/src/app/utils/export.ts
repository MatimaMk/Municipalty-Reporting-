// utils/export.ts
import { Issue } from "./localStorage";

export const exportUtils = {
  // Convert issues to CSV
  toCSV(issues: Issue[]): string {
    if (issues.length === 0) return "";

    const headers = [
      "Report ID",
      "Title",
      "Description",
      "Category",
      "Priority",
      "Status",
      "Location",
      "Latitude",
      "Longitude",
      "Reported By",
      "Created Date",
      "Updated Date",
      "Assigned To",
      "AI Confidence",
      "Issue Type",
      "Keywords",
      "Safety Risk Level",
    ];

    const rows = issues.map((issue) => [
      issue.id.substring(0, 8).toUpperCase(),
      `"${issue.title.replace(/"/g, '""')}"`,
      `"${issue.description.replace(/"/g, '""')}"`,
      issue.category,
      issue.priority,
      issue.status,
      `"${(issue.location || "").replace(/"/g, '""')}"`,
      issue.latitude || "",
      issue.longitude || "",
      `"${issue.userName.replace(/"/g, '""')}"`,
      new Date(issue.createdAt).toLocaleString(),
      new Date(issue.updatedAt).toLocaleString(),
      issue.assignedTo || "Unassigned",
      issue.aiConfidence ? Math.round(issue.aiConfidence * 100) + "%" : "",
      issue.aiAnalysis?.issueType || "",
      `"${(issue.aiAnalysis?.keywords || []).join(", ")}"`,
      issue.aiAnalysis?.safetyConsiderations?.riskLevel || "",
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  },

  // Download CSV file
  downloadCSV(issues: Issue[], filename: string = "municipality_reports.csv"): void {
    const csv = this.toCSV(issues);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Convert to JSON with full details
  toJSON(issues: Issue[]): string {
    return JSON.stringify(issues, null, 2);
  },

  // Download JSON file
  downloadJSON(issues: Issue[], filename: string = "municipality_reports.json"): void {
    const json = this.toJSON(issues);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Generate summary report text
  generateSummaryReport(issues: Issue[]): string {
    const total = issues.length;
    const pending = issues.filter((i) => i.status === "pending").length;
    const inProgress = issues.filter((i) => i.status === "in-progress").length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    const rejected = issues.filter((i) => i.status === "rejected").length;

    const categoryCount: { [key: string]: number } = {};
    issues.forEach((issue) => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });

    const priorityCount: { [key: string]: number } = {};
    issues.forEach((issue) => {
      priorityCount[issue.priority] = (priorityCount[issue.priority] || 0) + 1;
    });

    return `
POLOKWANE MUNICIPALITY
Service Delivery Reports Summary
Generated: ${new Date().toLocaleString()}
================================================================

OVERVIEW
--------
Total Reports: ${total}
Pending: ${pending} (${Math.round((pending / total) * 100)}%)
In Progress: ${inProgress} (${Math.round((inProgress / total) * 100)}%)
Resolved: ${resolved} (${Math.round((resolved / total) * 100)}%)
Rejected: ${rejected} (${Math.round((rejected / total) * 100)}%)

CATEGORY BREAKDOWN
------------------
${Object.entries(categoryCount)
      .map(([cat, count]) => `${cat}: ${count} (${Math.round((count / total) * 100)}%)`)
      .join("\n")}

PRIORITY BREAKDOWN
------------------
${Object.entries(priorityCount)
      .map(([pri, count]) => `${pri}: ${count} (${Math.round((count / total) * 100)}%)`)
      .join("\n")}

================================================================
Peace, Unity and Prosperity
`;
  },

  // Download summary report
  downloadSummary(issues: Issue[], filename: string = "reports_summary.txt"): void {
    const summary = this.generateSummaryReport(issues);
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export filtered data with options
  exportFiltered(
    issues: Issue[],
    format: "csv" | "json" | "summary",
    filename?: string
  ): void {
    const timestamp = new Date().toISOString().split("T")[0];
    const defaultFilename = `reports_${timestamp}`;

    switch (format) {
      case "csv":
        this.downloadCSV(issues, filename || `${defaultFilename}.csv`);
        break;
      case "json":
        this.downloadJSON(issues, filename || `${defaultFilename}.json`);
        break;
      case "summary":
        this.downloadSummary(issues, filename || `${defaultFilename}.txt`);
        break;
    }
  },
};
