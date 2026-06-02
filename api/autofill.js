export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;

  const systemPrompt = 'You are a listing assistant for Vic Local, a Victoria BC streetwear resell page. Return ONLY valid JSON with keys: brand (full proper brand name e.g. "Fear of God Essentials" not abbreviations), name (specific item name e.g. "Essentials Sweat Shorts"), price (number), size, category (shirts/hoodies/shorts/belts/kakobuy/other), description. Description rules: max 2 sentences, straight facts only, no fluff, no smoke-free/pet-free, no cringe. If the word kakobuy or rep or replica appears in the input, start description with "1:1 quality." Otherwise just describe condition. Always end with "Local pickup Victoria only." Good example: "1:1 quality. Clean, tags on. Local pickup Victoria only." Bad example: "OG item. Clean."';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Item details: ' + prompt + '. Return only JSON, no markdown.' }
        ]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) return res.status(500).json({ error: 'Empty response' });
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
