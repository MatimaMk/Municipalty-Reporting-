import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDrvzfg3h4I04n7QXCI6JF14t6jiT5gykE";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Call Gemini Vision API for object detection
    const prompt = `Analyze this image and identify any municipal infrastructure issues or objects visible.
    List ONLY the main objects/issues you detect in a simple comma-separated format.
    Focus on: potholes, broken pipes, damaged roads, trash/litter, broken streetlights, graffiti, damaged buildings, water leaks, electrical issues, damaged signs, overgrown vegetation.

    Respond ONLY with a simple list like: "pothole, damaged road" or "broken streetlight" or "water leak, damaged pipe".
    If you don't see any clear municipal issues, respond with: "general infrastructure"
    Keep it very brief - maximum 3 items.`;

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
                    data: image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "Failed to detect objects" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const detectedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the response to extract object names
    const objects = detectedText
      .toLowerCase()
      .split(",")
      .map((obj: string) => obj.trim())
      .filter((obj: string) => obj.length > 0 && obj.length < 50)
      .slice(0, 3); // Max 3 objects

    return NextResponse.json({
      objects: objects.length > 0 ? objects : [],
      rawResponse: detectedText,
    });
  } catch (error) {
    console.error("Object detection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
