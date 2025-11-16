"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { storageUtils, User } from "@/app/utils/localStorage";
import { analyzeImage, ImageAnalysisResult } from "@/app/utils/aiCategorization";
import { getCurrentLocation } from "@/app/utils/geoLocation";
import styles from "./create-report.module.css";

export default function CreateReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [location, setLocation] = useState<{ address?: string; latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("Initializing camera...");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentUser = storageUtils.getCurrentUser();

    // Allow guest reporting - don't redirect if no user
    if (currentUser) {
      // If logged in as staff, redirect to staff dashboard
      if (currentUser.role === "staff") {
        router.push("/staff-dashboard");
        return;
      }
      setUser(currentUser);
    }

    setLoading(false);

    // Automatically get location when page loads
    autoGetLocation();
  }, [router]);

  const autoGetLocation = async () => {
    setGettingLocation(true);
    setStatusMessage("📍 Detecting your location...");
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setStatusMessage("✅ Location detected successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error: any) {
      console.error("Location error:", error);
      setStatusMessage("⚠️ Could not detect location automatically. You can continue without it.");
      setTimeout(() => setStatusMessage(""), 5000);
    } finally {
      setGettingLocation(false);
    }
  };

  const startCamera = async () => {
    try {
      setDetectionStatus("Requesting camera access...");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported on this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });

      setStream(mediaStream);
      setShowCamera(true);

      // Use a small delay to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          // Force play after metadata loads
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log("Video playing successfully");
                  setDetectionStatus("✅ Camera ready - Position issue in frame");
                  setCameraReady(true);
                  // Start detection after video is confirmed playing
                  setTimeout(() => {
                    startObjectDetection();
                  }, 1000);
                })
                .catch((playError) => {
                  console.error("Video play error:", playError);
                  // Even if autoplay fails, mark as ready so user can still capture
                  setDetectionStatus("✅ Camera ready - Ready to capture!");
                  setCameraReady(true);
                });
            }
          };
        }
      }, 100);
    } catch (error: any) {
      console.error("Camera error:", error);
      let errorMessage = "Could not access camera. ";

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found. Please connect a camera device and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application. Please close other apps using the camera.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera doesn't meet the requirements. Trying with default settings...";
        // Try again with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(simpleStream);
          setShowCamera(true);
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.play();
            setDetectionStatus("✅ Camera ready!");
            setCameraReady(true);
          }
          return;
        } catch (retryError) {
          errorMessage = "Could not access camera with any settings.";
        }
      }

      alert(errorMessage);
      setDetectionStatus("Camera access failed");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setShowCamera(false);
    setCameraReady(false);
    setDetectionStatus("Initializing camera...");
  };

  // Simple object detection based on image analysis
  const startObjectDetection = () => {
    // Clear any existing interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Check video quality and provide feedback every 2 seconds
    detectionIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw current frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Analyze image quality
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Calculate average brightness
          let totalBrightness = 0;
          let pixelCount = 0;
          for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for performance
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalBrightness += (r + g + b) / 3;
            pixelCount++;
          }
          const avgBrightness = totalBrightness / pixelCount;

          // Calculate edge detection (simple variance check)
          let variance = 0;
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            variance += Math.abs(r - avgBrightness);
          }
          const avgVariance = variance / pixelCount;

          // Provide feedback
          if (avgBrightness < 50) {
            setDetectionStatus("⚠️ Too dark - Move to better lighting");
          } else if (avgBrightness > 200) {
            setDetectionStatus("⚠️ Too bright - Reduce glare");
          } else if (avgVariance < 20) {
            setDetectionStatus("⚠️ Image unclear - Focus on issue");
          } else {
            setDetectionStatus("✅ Good lighting - Ready to capture!");
          }
        }
      }
    }, 2000); // Check every 2 seconds
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        setPhotoPreview(base64);
        stopCamera();
        // Automatically trigger AI analysis
        analyzeAndSubmit(base64);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);

      // Automatically trigger AI analysis
      await analyzeAndSubmit(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeAndSubmit = async (imageBase64: string) => {
    setAnalyzingImage(true);
    setStatusMessage("🤖 AI is analyzing your image and generating a comprehensive report...");

    try {
      const analysis = await analyzeImage(
        imageBase64,
        location?.latitude,
        location?.longitude
      );

      setAiAnalysisResult(analysis);
      setStatusMessage("✅ AI analysis complete! Submitting report to municipality...");

      // Support guest reporting - use guest ID and name if not logged in
      const userId = user?.id || `guest-${Date.now()}`;
      const userName = user ? `${user.firstName} ${user.lastName}` : "Anonymous Resident";

      // Automatically submit the report with comprehensive AI analysis
      const newIssue = storageUtils.addIssue({
        userId: userId,
        userName: userName,
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        location: location?.address || "Location not specified",
        latitude: location?.latitude,
        longitude: location?.longitude,
        photoData: imageBase64,
        aiCategory: analysis.category,
        aiConfidence: analysis.confidence,
        status: "pending",
        priority: analysis.priority,
        aiAnalysis: {
          issueType: analysis.issueType,
          keywords: analysis.keywords,
          detailedAnalysis: analysis.detailedAnalysis,
          recommendations: analysis.recommendations,
          estimatedResolution: analysis.estimatedResolution,
          safetyConsiderations: analysis.safetyConsiderations,
        },
      });

      setStatusMessage("🎉 Report submitted successfully!");

      // Show success alert with different message for guests
      setTimeout(() => {
        const guestMessage = !user
          ? `\n\n⚠️ Note: Report submitted as guest. Create an account to track your reports!`
          : `\n\nYou can view the full report now.`;

        alert(
          `✅ Report submitted successfully!\n\n` +
          `Case ID: ${newIssue.id.substring(0, 8).toUpperCase()}\n` +
          `Issue: ${analysis.title}\n` +
          `Priority: ${analysis.priority.toUpperCase()}\n` +
          `Category: ${analysis.category}\n\n` +
          `The municipality will review your report and take action.${guestMessage}`
        );

        // Redirect to the report view page or landing page for guests
        if (user) {
          router.push(`/report/${newIssue.id}`);
        } else {
          // For guests, show the report then redirect to landing with option to login
          router.push(`/report/${newIssue.id}`);
        }
      }, 1000);

    } catch (error) {
      console.error("Error analyzing image:", error);
      setStatusMessage("❌ AI analysis failed. Please try again.");
      setAnalyzingImage(false);
      setPhotoPreview(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
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
            <span className={styles.logoText}>AI-Powered Reporting</span>
          </div>
          <button
            onClick={() => router.push(user ? "/resident-dashboard" : "/landing")}
            className={styles.backButton}
          >
            ← Back to {user ? "Dashboard" : "Home"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero Section - Full Width */}
        <div className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>🤖 AI-Powered Issue Reporting</h1>
            <p className={styles.heroDescription}>
              Our advanced AI technology revolutionizes municipal reporting. Simply upload or capture a photo,
              and let artificial intelligence handle the rest.
            </p>

            {/* Location Status */}
            {gettingLocation && (
              <div className={styles.locationStatus}>
                <div className={styles.spinner}></div>
                <span>Detecting your location...</span>
              </div>
            )}

            {location && !gettingLocation && (
              <div className={styles.locationSuccess}>
                <span>📍 Location: {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</span>
              </div>
            )}
          </div>

          <div className={styles.heroRight}>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔍</div>
                <h3>Smart Detection</h3>
                <p>AI identifies and categorizes issues instantly</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📊</div>
                <h3>Detailed Analysis</h3>
                <p>Comprehensive reports with severity assessment</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💰</div>
                <h3>Cost Estimates</h3>
                <p>Automatic calculation of resources and costs</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🚀</div>
                <h3>Instant Submission</h3>
                <p>Direct delivery to municipality staff</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`${styles.statusMessage} ${analyzingImage ? styles.analyzing : styles.success}`}>
            {statusMessage}
          </div>
        )}

        {/* Photo Upload Section */}
        {!photoPreview && !analyzingImage && !showCamera && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadContainer}>
              <div className={styles.uploadLeft}>
                <div className={styles.uploadIcon}>📸</div>
                <h2 className={styles.uploadTitle}>Capture or Upload Photo</h2>
                <p className={styles.uploadDescription}>
                  Take a clear photo showing the municipal issue. Our AI will automatically analyze it and generate a comprehensive professional report.
                </p>
                <div className={styles.buttonGroup}>
                  <button onClick={startCamera} className={styles.cameraButton}>
                    📹 Open Camera
                  </button>
                  <label htmlFor="photo-upload" className={styles.uploadButton}>
                    📷 Choose from Gallery
                  </label>
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className={styles.fileInput}
                  disabled={analyzingImage}
                />
                <p className={styles.uploadNote}>
                  Maximum file size: 5MB | Formats: JPG, PNG
                </p>
              </div>

              <div className={styles.uploadRight}>
                <div className={styles.stepsBox}>
                  <h3>📋 How AI Reporting Works</h3>
                  <div className={styles.stepsList}>
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <h4>Capture Issue</h4>
                        <p>Take or upload a photo of the municipal problem</p>
                      </div>
                    </div>
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <h4>AI Analysis</h4>
                        <p>Advanced vision AI analyzes and categorizes the issue</p>
                      </div>
                    </div>
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>3</div>
                      <div className={styles.stepContent}>
                        <h4>Report Generation</h4>
                        <p>Comprehensive report with recommendations and estimates</p>
                      </div>
                    </div>
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>4</div>
                      <div className={styles.stepContent}>
                        <h4>Automatic Submission</h4>
                        <p>Report sent directly to Polokwane Municipality</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        {showCamera && !photoPreview && (
          <div className={styles.cameraSection}>
            <h2 className={styles.cameraTitle}>📹 Camera Active - AI Detection Enabled</h2>

            {/* Detection Status Banner */}
            <div className={styles.detectionBanner} data-status={detectionStatus.includes("✅") ? "good" : "warning"}>
              <div className={styles.detectionIcon}>
                {detectionStatus.includes("✅") ? "✅" : detectionStatus.includes("⚠️") ? "⚠️" : "🔄"}
              </div>
              <div className={styles.detectionText}>{detectionStatus}</div>
            </div>

            <div className={styles.cameraWrapper}>
              <div className={styles.cameraContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.video}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className={styles.cameraOverlay}>
                  <div className={styles.targetBox}>
                    <div className={styles.corner} style={{ top: 0, left: 0 }}></div>
                    <div className={styles.corner} style={{ top: 0, right: 0 }}></div>
                    <div className={styles.corner} style={{ bottom: 0, left: 0 }}></div>
                    <div className={styles.corner} style={{ bottom: 0, right: 0 }}></div>
                    <div className={styles.targetLabel}>Position Issue Here</div>
                  </div>
                  {cameraReady && (
                    <div className={styles.detectionOverlay}>
                      <div className={styles.scanLine}></div>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.cameraSidebar}>
                <div className={styles.cameraTips}>
                  <h3>🤖 AI Detection Tips</h3>
                  <ul>
                    <li>✅ Position issue in the target box</li>
                    <li>💡 Ensure good, even lighting</li>
                    <li>📏 Keep camera steady</li>
                    <li>🎯 Show full extent of problem</li>
                    <li>🌍 Include surrounding context</li>
                    <li>⏱️ Wait for "Ready to capture" status</li>
                  </ul>
                </div>
                <div className={styles.cameraControls}>
                  <button
                    onClick={capturePhoto}
                    className={styles.captureButton}
                    disabled={!cameraReady || detectionStatus.includes("⚠️")}
                  >
                    📸 {cameraReady ? "Capture Photo" : "Loading..."}
                  </button>
                  <button onClick={stopCamera} className={styles.cancelCameraButton}>
                    ✕ Cancel
                  </button>
                </div>
              </div>
            </div>
            <p className={styles.cameraHint}>
              💡 AI is analyzing the image quality in real-time to ensure best results
            </p>
          </div>
        )}

        {/* Photo Preview & Analysis */}
        {photoPreview && (
          <div className={styles.previewSection}>
            <h2 className={styles.previewTitle}>
              {analyzingImage ? "🤖 AI Analyzing Image..." : "✅ Analysis Complete"}
            </h2>

            <div className={styles.previewContainer}>
              <div className={styles.previewLeft}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  className={styles.preview}
                  style={{ opacity: analyzingImage ? 0.6 : 1 }}
                />
              </div>

              <div className={styles.previewRight}>
                {analyzingImage && (
                  <div className={styles.analyzingBox}>
                    <div className={styles.spinner}></div>
                    <p className={styles.analyzingText}>AI is generating comprehensive report...</p>
                    <div className={styles.progressSteps}>
                      <div className={styles.step}>🔍 Analyzing image...</div>
                      <div className={styles.step}>📝 Generating report...</div>
                      <div className={styles.step}>📊 Calculating estimates...</div>
                      <div className={styles.step}>📤 Submitting to municipality...</div>
                    </div>
                  </div>
                )}

                {aiAnalysisResult && !analyzingImage && (
                  <div className={styles.resultBox}>
                    <div className={styles.resultHeader}>
                      <h3>🎉 Report Generated Successfully!</h3>
                      <p>Redirecting to full report...</p>
                    </div>
                    <div className={styles.resultGrid}>
                      <div className={styles.resultItem}>
                        <span className={styles.resultLabel}>Title:</span>
                        <span className={styles.resultValue}>{aiAnalysisResult.title}</span>
                      </div>
                      <div className={styles.resultItem}>
                        <span className={styles.resultLabel}>Category:</span>
                        <span className={styles.resultValue}>{aiAnalysisResult.category}</span>
                      </div>
                      <div className={styles.resultItem}>
                        <span className={styles.resultLabel}>Priority:</span>
                        <span className={`${styles.resultValue} ${styles[`priority${aiAnalysisResult.priority}`]}`}>
                          {aiAnalysisResult.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.resultItem}>
                        <span className={styles.resultLabel}>Confidence:</span>
                        <span className={styles.resultValue}>
                          {Math.round(aiAnalysisResult.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 Polokwane Municipality. All rights reserved.</p>
        <p>Peace, Unity and Prosperity</p>
      </footer>
    </div>
  );
}
