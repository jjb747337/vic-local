export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;

  const systemPrompt = 'You are a listing assistant for Vic Local, a Victoria BC streetwear resell page selling kakobuy and vintage items. Return ONLY valid JSON with keys: brand, name, price (number no dollar sign), size, category (one of: shirts/hoodies/shorts/belts/kakobuy/other), description. Description rules: max 2 sentences, straight facts only, no fluff, no smoke-free or pet-free, no cringe words. If kakobuy or replica mention 1:1 quality. Always end with "Local pickup Victoria only." Example: "1:1 quality. Clean, tags on. Local pickup Victoria only."';

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
