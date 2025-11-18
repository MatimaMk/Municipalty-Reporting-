// utils/aiCategorization.ts

export interface CategoryResult {
  category: string;
  confidence: number;
  keywords: string[];
}

export interface ImageAnalysisResult {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
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

interface CategoryKeywords {
  category: string;
  keywords: string[];
  priority: "low" | "medium" | "high" | "urgent";
}

const GEMINI_API_KEY = "AIzaSyDrvzfg3h4I04n7QXCI6JF14t6jiT5gykE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const categoryPatterns: CategoryKeywords[] = [
  {
    category: "roads",
    keywords: [
      "pothole",
      "road",
      "pavement",
      "street",
      "crack",
      "damaged road",
      "traffic",
      "intersection",
      "bridge",
      "highway",
      "bump",
      "uneven",
      "surface",
    ],
    priority: "high",
  },
  {
    category: "water",
    keywords: [
      "water",
      "leak",
      "pipe",
      "burst",
      "tap",
      "faucet",
      "dripping",
      "flood",
      "sewage",
      "drain",
      "sewer",
      "sanitation",
      "plumbing",
      "overflow",
    ],
    priority: "urgent",
  },
  {
    category: "electricity",
    keywords: [
      "electricity",
      "power",
      "light",
      "streetlight",
      "lamp",
      "bulb",
      "outage",
      "electrical",
      "cable",
      "wire",
      "transformer",
      "blackout",
      "dark",
    ],
    priority: "high",
  },
  {
    category: "waste",
    keywords: [
      "garbage",
      "waste",
      "trash",
      "rubbish",
      "litter",
      "dump",
      "collection",
      "bin",
      "refuse",
      "disposal",
      "recycling",
      "dirt",
      "cleaning",
    ],
    priority: "medium",
  },
  {
    category: "safety",
    keywords: [
      "danger",
      "unsafe",
      "security",
      "crime",
      "vandalism",
      "broken",
      "glass",
      "hazard",
      "risk",
      "threat",
      "emergency",
      "accident",
      "injury",
    ],
    priority: "urgent",
  },
  {
    category: "parks",
    keywords: [
      "park",
      "playground",
      "garden",
      "grass",
      "trees",
      "recreation",
      "sports field",
      "bench",
      "fence",
    ],
    priority: "low",
  },
  {
    category: "other",
    keywords: [
      "other",
      "general",
      "miscellaneous",
      "issue",
      "problem",
      "concern",
    ],
    priority: "low",
  },
];

// Fallback keyword-based categorization
function categorizeIssueKeywordBased(
  title: string,
  description: string
): CategoryResult {
  const text = `${title} ${description}`.toLowerCase();
  const scores: {
    [key: string]: { score: number; keywords: string[]; priority: string };
  } = {};

  // Initialize scores
  categoryPatterns.forEach((pattern) => {
    scores[pattern.category] = {
      score: 0,
      keywords: [],
      priority: pattern.priority,
    };
  });

  // Calculate scores based on keyword matches
  categoryPatterns.forEach((pattern) => {
    pattern.keywords.forEach((keyword) => {
      if (text.includes(keyword.toLowerCase())) {
        scores[pattern.category].score += 1;
        scores[pattern.category].keywords.push(keyword);
      }
    });
  });

  // Find best match
  let bestCategory = "other";
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  Object.keys(scores).forEach((category) => {
    if (scores[category].score > bestScore) {
      bestScore = scores[category].score;
      bestCategory = category;
      matchedKeywords = scores[category].keywords;
    }
  });

  // Calculate confidence (0-1)
  const maxPossibleScore = 5;
  const confidence = Math.min(bestScore / maxPossibleScore, 1);

  return {
    category: bestCategory,
    confidence: confidence,
    keywords: matchedKeywords,
  };
}

// AI-powered categorization using Gemini Flash 2.0
export async function categorizeIssue(
  title: string,
  description: string
): Promise<CategoryResult> {
  try {
    const prompt = `You are a municipality issue categorization system. Analyze the following issue and categorize it.

Title: ${title}
Description: ${description}

Categories:
- roads: Roads & Infrastructure (potholes, damaged roads, traffic issues)
- water: Water & Sanitation (leaks, burst pipes, sewage, flooding)
- electricity: Electricity (power outages, streetlights, electrical issues)
- waste: Waste Management (garbage, litter, refuse collection)
- safety: Public Safety (dangerous conditions, vandalism, hazards)
- parks: Parks & Recreation (playgrounds, gardens, sports fields)
- other: Other issues

Respond ONLY with a valid JSON object in this exact format:
{
  "category": "one of the categories above",
  "confidence": 0.85,
  "keywords": ["keyword1", "keyword2"]
}

No additional text, just the JSON.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      console.warn("Gemini API request failed, using fallback categorization");
      return categorizeIssueKeywordBased(title, description);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.warn("No response from Gemini, using fallback categorization");
      return categorizeIssueKeywordBased(title, description);
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Invalid JSON from Gemini, using fallback categorization");
      return categorizeIssueKeywordBased(title, description);
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate the result
    const validCategories = categoryPatterns.map((p) => p.category);
    if (!validCategories.includes(result.category)) {
      console.warn("Invalid category from Gemini, using fallback categorization");
      return categorizeIssueKeywordBased(title, description);
    }

    return {
      category: result.category,
      confidence: result.confidence || 0.8,
      keywords: result.keywords || [],
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback to keyword-based categorization
    return categorizeIssueKeywordBased(title, description);
  }
}

export function getPriorityFromCategory(
  category: string
): "low" | "medium" | "high" | "urgent" {
  const pattern = categoryPatterns.find((p) => p.category === category);
  return pattern?.priority || "medium";
}

export function getCategoryDisplayName(category: string): string {
  const names: { [key: string]: string } = {
    roads: "Roads & Infrastructure",
    water: "Water & Sanitation",
    electricity: "Electricity",
    waste: "Waste Management",
    safety: "Public Safety",
    other: "Other",
  };
  return names[category] || category;
}

// AI-powered image analysis using Gemini Vision API
export async function analyzeImage(
  imageBase64: string,
  latitude?: number,
  longitude?: number
): Promise<ImageAnalysisResult> {
  try {
    const response = await fetch("/api/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze image");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}
