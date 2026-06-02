export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, imageBase64, imageMime } = req.body;

  const systemPrompt = 'You are a listing assistant for Vic Local, a Victoria BC streetwear resell page selling kakobuy and vintage items. Return ONLY valid JSON with keys: brand, name, price (number no dollar sign), size, category (one of: shirts/hoodies/shorts/belts/kakobuy/other), description. Description rules: max 2 sentences, straight facts only, no fluff, no smoke-free or pet-free, no cringe words, no millennial language. If kakobuy or replica mention 1:1 quality. Always end with "Local pickup Victoria only." Example: "1:1 quality. Clean, tags on. Local pickup Victoria only."';

  const parts = [];
  if (imageBase64 && imageMime) {
    parts.push({ inlineData: { mimeType: imageMime, data: imageBase64 } });
  }
  parts.push({ text: systemPrompt + '\n\nItem details: ' + prompt + '. Return only JSON, no markdown backticks.' });

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'Empty response: ' + JSON.stringify(data) });
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
