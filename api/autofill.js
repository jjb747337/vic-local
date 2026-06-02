export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;

  const systemPrompt = 'You are a listing assistant for Vic Local, a Victoria BC resell page. Return ONLY valid JSON with keys: brand (full proper brand name, never abbreviations), name (item name only, never include size in the name, e.g. "Essentials Sweat Shorts" not "Sweat Shorts M"), price (number), size, category (shirts/hoodies/shorts/belts/kakobuy/other), description. Description: 2 sentences max. Be confident and specific — mention material or build quality based on what you know about the brand and item (e.g. thick cotton, heavy fleece, solid stitching). No smoke-free, no pet-free, no cringe words. If rep or replica is in the input, start with "1:1 quality." Always end with "Local pickup/meetup Victoria only." Good examples: "1:1 quality. Thick cotton, clean condition, tags on. Local pickup/meetup Victoria only." or "Heavy fleece, clean condition. Local pickup/meetup Victoria only."';

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
