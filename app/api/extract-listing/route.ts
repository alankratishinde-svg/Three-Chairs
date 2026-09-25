import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "No listing text provided" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `Extract listing details from this text. Return ONLY valid JSON (no markdown, no extra text). For any field not clearly stated in the listing, use null.

JSON schema:
{
  "rent": number or null,
  "area": string or null,
  "floor": number or null,
  "has_lift": boolean or null,
  "parking": boolean or null,
  "bathrooms": number or null,
  "pet_friendly": boolean or null,
  "furnishing": "furnished" | "semi-furnished" | "unfurnished" | null
}

Listing text:
${text}`;

    const result = await model.generateContent(prompt);
    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (in case it has markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const extracted = JSON.parse(jsonStr);

    return Response.json(extracted);
  } catch (error) {
    console.error("Extraction error:", error);
    return Response.json(
      { error: "Failed to extract listing details" },
      { status: 500 }
    );
  }
}
