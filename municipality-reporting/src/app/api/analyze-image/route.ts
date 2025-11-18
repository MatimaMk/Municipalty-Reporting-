import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDrvzfg3h4I04n7QXCI6JF14t6jiT5gykE";

interface AnalysisResult {
  title: string;
  description: string;
  category: string;
  priority: string;
  issueType: string;
  confidence: number;
  keywords: string[];
  detailedAnalysis: {
    problemIdentification: string;
    severityAssessment: string;
    impactAnalysis: string;
    rootCause: string;
    visualEvidence: string[];
  };
  recommendations: {
    immediateActions: string[];
    longTermSolutions: string[];
    preventiveMeasures: string[];
  };
  estimatedResolution: {
    timeframe: string;
    resources: string[];
    estimatedCost: string;
    workersRequired: number;
  };
  safetyConsiderations: {
    riskLevel: string;
    hazards: string[];
    precautions: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, latitude, longitude } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Remove the data:image/...;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Prepare the prompt for comprehensive analysis
    const prompt = `You are an AI assistant for Polokwane Municipality's Intelligent Service Delivery Reporting System. Analyze this image and provide a COMPREHENSIVE professional municipal report.

IMPORTANT: You must respond with ONLY valid JSON, no additional text before or after.

Analyze the image and identify municipal infrastructure issues such as:
- Potholes, road damage, traffic issues
- Sewer blockages, overflows, water leaks, burst pipes
- Uncollected garbage, illegal dumping, waste issues
- Broken streetlights, electrical problems
- Damaged sidewalks, curbs, public property
- Fallen trees, overgrown vegetation
- Any other municipal service delivery issues

Provide a COMPLETE professional report in the following JSON format:
{
  "title": "Brief, specific title (max 100 chars) - e.g., 'Large Pothole on Main Street Intersection'",
  "description": "Executive summary of the issue (2-3 sentences, professional tone)",
  "category": "One of: roads, water, electricity, waste, safety, parks, other",
  "priority": "One of: low, medium, high, urgent - based on safety risk and severity",
  "issueType": "Specific type - e.g., 'pothole', 'sewer blockage', 'illegal dumping', 'water leak', 'broken streetlight'",
  "confidence": 0.0-1.0 (your confidence in this analysis),
  "keywords": ["array", "of", "relevant", "keywords"],

  "detailedAnalysis": {
    "problemIdentification": "Detailed identification of what the problem is, what you see in the image (3-5 sentences)",
    "severityAssessment": "Professional assessment of how severe this issue is and why (2-4 sentences)",
    "impactAnalysis": "Analysis of impact on community, traffic, safety, environment, daily life (3-5 sentences)",
    "rootCause": "Likely root cause of this issue based on visual evidence (2-3 sentences)",
    "visualEvidence": ["list", "of", "specific", "visual", "evidence", "observed", "in", "image"]
  },

  "recommendations": {
    "immediateActions": ["Action 1 that should be taken immediately", "Action 2...", "Action 3..."],
    "longTermSolutions": ["Long-term solution 1", "Solution 2...", "Solution 3..."],
    "preventiveMeasures": ["Preventive measure 1 to avoid future occurrences", "Measure 2...", "Measure 3..."]
  },

  "estimatedResolution": {
    "timeframe": "Estimated timeframe - e.g., '2-3 days', '1-2 weeks', '3-4 weeks'",
    "resources": ["Equipment/material 1 needed", "Resource 2...", "Resource 3..."],
    "estimatedCost": "Estimated cost range - e.g., 'R15,000 - R25,000' (South African Rand)",
    "workersRequired": 3 (number of workers needed)
  },

  "safetyConsiderations": {
    "riskLevel": "One of: low, moderate, high, critical",
    "hazards": ["Hazard 1 identified", "Hazard 2...", "Hazard 3..."],
    "precautions": ["Safety precaution 1 for public", "Precaution 2...", "Precaution 3..."]
  }
}

${
  latitude && longitude
    ? `\nLocation context: Latitude ${latitude}, Longitude ${longitude}`
    : ""
}

Be thorough, professional, and specific. This report will be reviewed by municipal staff and used for planning and resource allocation.

Remember: Respond with ONLY the JSON object, nothing else.`;

    // Call Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to analyze image", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      return NextResponse.json(
        { error: "No analysis generated" },
        { status: 500 }
      );
    }

    // Parse the JSON response from Gemini
    let analysisResult: AnalysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", generatedText);
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          rawResponse: generatedText,
        },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (
      !analysisResult.title ||
      !analysisResult.description ||
      !analysisResult.category
    ) {
      return NextResponse.json(
        { error: "Incomplete analysis result", data: analysisResult },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
