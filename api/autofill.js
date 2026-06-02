export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, imageBase64, imageMime } = req.body;

  const systemPrompt = 'You are a listing assistant for Vic Local, a Victoria BC streetwear resell page selling kakobuy and vintage items. Return ONLY valid JSON with keys: brand, name, price (number no dollar sign), size, category (one of: shirts/hoodies/shorts/belts/kakobuy/other), description. Description rules: max 2 sentences, straight facts only, no fluff, no smoke-free or pet-free, no cringe words, no millennial language. If kakobuy or replica mention 1:1 quality. Always end with "Local pickup Victoria only." Keep it short. Example: "1:1 quality. Clean, tags on. Local pickup Victoria only."';

  const userContent = [];
  if (imageBase64 && imageMime) {
    userContent.push({ type: 'image', source: { type: 'base64', media_type: imageMime, data: imageBase64 } });
  }
  userContent.push({ type: 'text', text: 'Item details: ' + prompt + '. Return only JSON, no markdown backticks.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
