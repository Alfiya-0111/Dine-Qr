export default async function handler(req, res) {
  // ✅ CORS (safe)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { dishName, category, spiceLevel, vegType, dishTasteProfile } = req.body;

    // ✅ Debug logs
    console.log('Received:', { dishName, category, spiceLevel, vegType, dishTasteProfile });
    console.log("API KEY:", process.env.ANTHROPIC_API_KEY ? "Loaded ✅" : "Missing ❌");

    // ❌ Agar API key missing hai to direct error
    if (!process.env.ANTHROPIC_API_KEY) {
return res.status(500).json({ error: "API KEY MISSING" });

      throw new Error("API key missing in environment variables");
    }

    // ✅ API Call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // ✅ stable model
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Professional restaurant menu copywriter banke dish "${dishName}" ke liye short tasty description likho.

Details:
- Category: ${category || 'General'}
- Spice: ${spiceLevel || 'medium'}  
- Veg/Non-veg: ${vegType || 'not specified'}
- Taste: ${dishTasteProfile || 'spicy'}

Rules:
- 2 sentences only (30-50 words)
- 2-3 ingredients ya cooking style mention karo
- Indian restaurant style English
- Sirf description return karo`
        }]
      })
    });

    // ✅ Status log
    console.log("STATUS:", response.status);

    // ✅ SINGLE READ (IMPORTANT FIX)
  const rawText = await response.text();

// ✅ FIX START
if (!response.ok) {
  console.log("API ERROR RAW:", rawText);

  // 💥 CREDIT खत्म fallback
  if (rawText.includes("credit balance is too low")) {
    return res.status(200).json({
      description: `${dishName} is a delicious dish prepared with fresh ingredients and rich flavors, offering a perfect balance of taste and aroma for a satisfying meal experience.`
    });
  }

  // ❌ बाकी errors
  throw new Error(`Anthropic API Error: ${response.status} - ${rawText}`);
}
// ✅ FIX END

    // ✅ Parse response
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      throw new Error("Invalid JSON response from API");
    }

    // ✅ Extract description safely
    const description = result?.content?.[0]?.text?.trim();

    if (!description) {
      console.error('No description found:', result);
      throw new Error('Empty description from AI');
    }

    console.log('Generated description:', description);

    return res.status(200).json({ description });

  } catch (error) {
    console.error('Full error:', error);

    return res.status(500).json({ 
      error: 'Description generate nahi ho saka',
      details: error.message
    });
  }
}