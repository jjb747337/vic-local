export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;

  const systemPrompt = `You are a listing assistant. Return ONLY a JSON object, no other text.

Rules:
- brand: common brand name only, e.g. "Fear of God Essentials"
- name: always include the short brand name in the item name, e.g. "Essentials Sweat Shorts", "Carhartt Work Jacket", "Hellstar Hoodie"
- price: number only, no dollar sign
- size: just the size letter/number
- category: one of exactly: shirts, hoodies, shorts, belts, kakobuy, other
- description: 2 sentences. ALWAYS start with "1:1 quality." Use ONLY the color the user mentions — never assume or invent a color. Mention what makes the item worth buying based on the brand (premium cotton, heavy fleece, solid build etc). Never mention logos, graphics, or design details you cannot confirm. End with "Local pickup/meetup Victoria only."

Examples:
{"brand":"Hellstar","name":"Hellstar Hoodie","price":50,"size":"M","category":"hoodies","description":"1:1 quality. Oat grey, premium cotton build — perfect for casual wear. Local pickup/meetup Victoria only."}
{"brand":"Carhartt","name":"Carhartt Chore Coat","price":90,"size":"XL","category":"hoodies","description":"1:1 quality. Brown, thick canvas — holds up and looks clean. Local pickup/meetup Victoria only."}
{"brand":"Fear of God Essentials","name":"Essentials Sweat Shorts","price":50,"size":"M","category":"shorts","description":"1:1 quality. Heather grey, heavy fleece with a solid drop fit. Local pickup/meetup Victoria only."}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
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
