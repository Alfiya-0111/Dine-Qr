const {onCall} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

exports.reviewWithAI = onCall(
  {
    secrets: [anthropicApiKey],
    cors: true
  },
  async (request) => {
    const {reviewText, name, restaurantName} = request.data;
    
    logger.log("Review received from:", name, "Restaurant:", restaurantName);

    if (!reviewText || !name || !restaurantName) {
      throw new Error("Missing required fields");
    }

    const prompt = `You are a review moderator for Khaatogo, an Indian restaurant management SaaS.

Analyze this restaurant owner review and respond ONLY in JSON format:
{"approved": true/false, "reason": "one line reason", "score": 0-100}

Rules:
- approved: true if genuine, positive/neutral about Khaatogo, meaningful (>20 chars), not spam/abusive
- approved: false if spam, fake, abusive, completely negative/hate, nonsensical
- Score 0-100 based on quality and genuineness

Review:
Name: ${name}
Restaurant: ${restaurantName}
Text: "${reviewText}"

Respond ONLY with JSON.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey.value(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          messages: [{role: "user", content: prompt}]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '{"approved":false,"reason":"AI error","score":0}';
      
      try {
        const result = JSON.parse(text.replace(/```json|```/g, '').trim());
        logger.log("AI Review result:", result);
        return result;
      } catch (parseError) {
        logger.error("Parse error:", text);
        return {approved: false, reason: "Parse error", score: 0};
      }
    } catch (error) {
      logger.error("AI Review Error:", error);
      throw new Error("AI review failed: " + error.message);
    }
  }
);