export default async function handler(req, res) {
  // CORS headers
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

    console.log('Received:', { dishName, category, spiceLevel, vegType, dishTasteProfile });
console.log("API KEY:", process.env.ANTHROPIC_API_KEY);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',  // ✅ SAHI MODEL
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`API failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Anthropic response:', JSON.stringify(result, null, 2));

    // ✅ SAHI FORMAT - YAHAN FIX HAI
    const textBlock = result?.content?.find(block => block.type === 'text');
    const description = textBlock?.text?.trim();

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