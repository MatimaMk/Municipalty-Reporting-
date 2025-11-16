"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { storageUtils, Issue } from "@/app/utils/localStorage";
import styles from "./report.module.css";

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const issueId = params.id as string;
    if (!issueId) {
      router.push("/resident-dashboard");
      return;
    }

    const issues = storageUtils.getIssues();
    const foundIssue = issues.find((i) => i.id === issueId);

    if (!foundIssue) {
      router.push("/resident-dashboard");
      return;
    }

    setIssue(foundIssue);
    setLoading(false);

    // Fetch address from coordinates if available
    if (foundIssue.latitude && foundIssue.longitude) {
      fetchAddress(foundIssue.latitude, foundIssue.longitude);
    }
  }, [params.id, router]);

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
        if (data.address.state) parts.push(data.address.state);
        if (data.address.postcode) parts.push(data.address.postcode);

        setAddress(parts.join(", ") || data.display_name);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const downloadPDF = async () => {
    if (!issue) return;

    setDownloading(true);

    try {
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentWidth);

        lines.forEach((line: string) => {
          if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin, yPos);
          yPos += fontSize * 0.5;
        });
        yPos += 3;
      };

      // Header
      doc.setFillColor(41, 106, 79);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("POLOKWANE MUNICIPALITY", pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(14);
      doc.text("Intelligent Service Delivery Report", pageWidth / 2, 27, { align: "center" });

      yPos = 50;
      doc.setTextColor(0, 0, 0);

      addText(`Report ID: ${issue.id.substring(0, 8).toUpperCase()}`, 10, true);
      addText(`Generated: ${new Date(issue.createdAt).toLocaleString()}`, 10);
      addText(`Status: ${issue.status.toUpperCase()}`, 10);
      addText(`Priority: ${issue.priority.toUpperCase()}`, 10, true, [220, 53, 69]);
      yPos += 5;

      addText("ISSUE TITLE", 12, true, [41, 106, 79]);
      addText(issue.title, 10);

      addText("EXECUTIVE SUMMARY", 12, true, [41, 106, 79]);
      addText(issue.description, 10);

      addText("LOCATION", 12, true, [41, 106, 79]);
      addText(address || issue.location || "Location not specified", 10);

      if (issue.aiAnalysis) {
        addText("DETAILED ANALYSIS", 12, true, [41, 106, 79]);
        addText(`Problem: ${issue.aiAnalysis.detailedAnalysis.problemIdentification}`, 10);
        addText(`Severity: ${issue.aiAnalysis.detailedAnalysis.severityAssessment}`, 10);
        addText(`Impact: ${issue.aiAnalysis.detailedAnalysis.impactAnalysis}`, 10);

        addText("RECOMMENDATIONS", 12, true, [41, 106, 79]);
        issue.aiAnalysis.recommendations.immediateActions.forEach((action, i) => {
          addText(`${i + 1}. ${action}`, 10);
        });

        addText("ESTIMATED RESOLUTION", 12, true, [41, 106, 79]);
        addText(`Timeframe: ${issue.aiAnalysis.estimatedResolution.timeframe}`, 10);
        addText(`Cost: ${issue.aiAnalysis.estimatedResolution.estimatedCost}`, 10);
        addText(`Workers: ${issue.aiAnalysis.estimatedResolution.workersRequired}`, 10);

        addText("SAFETY CONSIDERATIONS", 12, true, [41, 106, 79]);
        addText(`Risk Level: ${issue.aiAnalysis.safetyConsiderations.riskLevel.toUpperCase()}`, 10, true);
        issue.aiAnalysis.safetyConsiderations.hazards.forEach((hazard, i) => {
          addText(`${i + 1}. ${hazard}`, 10);
        });
      }

      yPos = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Polokwane Municipality - Peace, Unity and Prosperity", pageWidth / 2, yPos, { align: "center" });

      doc.save(`Municipality_Report_${issue.id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download PDF. Please install jsPDF: npm install jspdf");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading report...</p>
      </div>
    );
  }

  if (!issue) return null;

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
              <div className={styles.logoText}>Polokwane Municipality</div>
              <div className={styles.logoSubtext}>Intelligent Service Delivery Report</div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button onClick={downloadPDF} className={styles.downloadButton} disabled={downloading}>
              {downloading ? "📥 Generating..." : "📄 Download PDF"}
            </button>
            <button onClick={() => router.back()} className={styles.backButton}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Report Content - Full Width */}
      <main className={styles.main}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.title}>{issue.title}</h1>
            <div className={styles.metadata}>
              <span className={styles.reportId}>
                Report ID: <strong>{issue.id.substring(0, 8).toUpperCase()}</strong>
              </span>
              <span className={`${styles.status} ${styles[`status${issue.status.charAt(0).toUpperCase() + issue.status.slice(1).replace("-", "")}`]}`}>
                {issue.status.toUpperCase()}
              </span>
              <span className={`${styles.priority} ${styles[`priority${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}`]}`}>
                {issue.priority.toUpperCase()} PRIORITY
              </span>
            </div>
            <div className={styles.timestamps}>
              <div>📅 Reported: {new Date(issue.createdAt).toLocaleString()}</div>
              <div>🔄 Updated: {new Date(issue.updatedAt).toLocaleString()}</div>
            </div>
          </div>
          <div className={styles.heroRight}>
            {issue.photoData && (
              <img
                src={issue.photoData}
                alt="Issue evidence"
                className={styles.heroImage}
              />
            )}
          </div>
        </div>

        {/* Main Grid - Two Columns */}
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.column}>
            {/* Summary Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>📋 Executive Summary</h2>
              <p className={styles.cardText}>{issue.description}</p>
            </div>

            {/* Classification Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>🏷️ Classification</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Category</span>
                  <span className={styles.infoValue}>{issue.category}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Issue Type</span>
                  <span className={styles.infoValue}>{issue.aiAnalysis?.issueType || "Not specified"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>AI Confidence</span>
                  <span className={styles.infoValue}>{issue.aiConfidence ? `${Math.round(issue.aiConfidence * 100)}%` : "N/A"}</span>
                </div>
                {issue.aiAnalysis?.keywords && (
                  <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
                    <span className={styles.infoLabel}>Keywords</span>
                    <div className={styles.tags}>
                      {issue.aiAnalysis.keywords.map((keyword, i) => (
                        <span key={i} className={styles.tag}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>📍 Location</h2>
              <p className={styles.cardText}>
                {address || issue.location || "Location not specified"}
              </p>
              {issue.latitude && issue.longitude && (
                <>
                  <p className={styles.coordinates}>
                    Coordinates: {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapLink}
                  >
                    🗺️ View on Google Maps
                  </a>
                </>
              )}
            </div>

            {/* Safety Card */}
            {issue.aiAnalysis?.safetyConsiderations && (
              <div className={`${styles.card} ${styles.cardDanger}`}>
                <h2 className={styles.cardTitle}>⚠️ Safety Considerations</h2>
                <div className={styles.riskBadge} data-risk={issue.aiAnalysis.safetyConsiderations.riskLevel}>
                  Risk Level: {issue.aiAnalysis.safetyConsiderations.riskLevel.toUpperCase()}
                </div>
                <div className={styles.listSection}>
                  <h3>Identified Hazards:</h3>
                  <ul>
                    {issue.aiAnalysis.safetyConsiderations.hazards.map((hazard, i) => (
                      <li key={i}>{hazard}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.listSection}>
                  <h3>Safety Precautions:</h3>
                  <ul>
                    {issue.aiAnalysis.safetyConsiderations.precautions.map((precaution, i) => (
                      <li key={i}>{precaution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className={styles.column}>
            {/* Detailed Analysis */}
            {issue.aiAnalysis?.detailedAnalysis && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🔍 Detailed Analysis</h2>

                <div className={styles.analysisSection}>
                  <h3>Problem Identification</h3>
                  <p>{issue.aiAnalysis.detailedAnalysis.problemIdentification}</p>
                </div>

                <div className={styles.analysisSection}>
                  <h3>Severity Assessment</h3>
                  <p>{issue.aiAnalysis.detailedAnalysis.severityAssessment}</p>
                </div>

                <div className={styles.analysisSection}>
                  <h3>Impact Analysis</h3>
                  <p>{issue.aiAnalysis.detailedAnalysis.impactAnalysis}</p>
                </div>

                <div className={styles.analysisSection}>
                  <h3>Root Cause</h3>
                  <p>{issue.aiAnalysis.detailedAnalysis.rootCause}</p>
                </div>

                {issue.aiAnalysis.detailedAnalysis.visualEvidence.length > 0 && (
                  <div className={styles.analysisSection}>
                    <h3>Visual Evidence Observed:</h3>
                    <ul>
                      {issue.aiAnalysis.detailedAnalysis.visualEvidence.map((evidence, i) => (
                        <li key={i}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {issue.aiAnalysis?.recommendations && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>💡 Recommendations</h2>

                <div className={styles.listSection}>
                  <h3>Immediate Actions:</h3>
                  <ol>
                    {issue.aiAnalysis.recommendations.immediateActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ol>
                </div>

                <div className={styles.listSection}>
                  <h3>Long-Term Solutions:</h3>
                  <ol>
                    {issue.aiAnalysis.recommendations.longTermSolutions.map((solution, i) => (
                      <li key={i}>{solution}</li>
                    ))}
                  </ol>
                </div>

                <div className={styles.listSection}>
                  <h3>Preventive Measures:</h3>
                  <ol>
                    {issue.aiAnalysis.recommendations.preventiveMeasures.map((measure, i) => (
                      <li key={i}>{measure}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Resolution Estimates */}
            {issue.aiAnalysis?.estimatedResolution && (
              <div className={`${styles.card} ${styles.cardSuccess}`}>
                <h2 className={styles.cardTitle}>⏱️ Estimated Resolution</h2>

                <div className={styles.estimateGrid}>
                  <div className={styles.estimateItem}>
                    <span className={styles.estimateLabel}>⏰ Timeframe</span>
                    <span className={styles.estimateValue}>{issue.aiAnalysis.estimatedResolution.timeframe}</span>
                  </div>
                  <div className={styles.estimateItem}>
                    <span className={styles.estimateLabel}>💰 Estimated Cost</span>
                    <span className={styles.estimateValue}>{issue.aiAnalysis.estimatedResolution.estimatedCost}</span>
                  </div>
                  <div className={styles.estimateItem}>
                    <span className={styles.estimateLabel}>👷 Workers Required</span>
                    <span className={styles.estimateValue}>{issue.aiAnalysis.estimatedResolution.workersRequired}</span>
                  </div>
                </div>

                <div className={styles.listSection}>
                  <h3>Required Resources:</h3>
                  <ul>
                    {issue.aiAnalysis.estimatedResolution.resources.map((resource, i) => (
                      <li key={i}>{resource}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Staff Notes */}
            {issue.staffNotes && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>📝 Staff Notes</h2>
                <p className={styles.cardText}>{issue.staffNotes}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 Polokwane Municipality. All rights reserved.</p>
        <p>Peace, Unity and Prosperity</p>
      </footer>
    </div>
  );
}
