export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request handle karein
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sirf POST allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { dishName, category, spiceLevel, vegType, dishTasteProfile } = req.body;

    // Anthropic API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Professional menu copywriter banke dish "${dishName}" ke liye chhota sa tasty description likho.

Details:
- Category: ${category || 'General'}
- Spice: ${spiceLevel || 'medium'}  
- Veg/Non-veg: ${vegType || 'not specified'}
- Taste: ${dishTasteProfile || 'spicy'}

Rules:
- Sirf 2 sentences (35-50 words)
- 2-3 ingredients ya cooking method mention karo
- Indian restaurant style English
- "Indulge" ya "Savor" se shuru mat karna
- Sirf description text return karo, kuch aur nahi`
        }]
      })
    });

    const result = await response.json();
    const description = result?.content?.[0]?.text?.trim();

    if (!description) {
      throw new Error('Empty response from AI');
    }

    return res.status(200).json({ description });

  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ 
      error: 'Description generate nahi ho saka',
      details: error.message 
    });
  }
}