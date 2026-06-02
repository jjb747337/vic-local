export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;

  const systemPrompt = `You are a listing assistant. Return ONLY a JSON object, no other text.

Rules:
- brand: common brand name only, e.g. "Fear of God Essentials"
- name: always include the short brand name in the item name, e.g. "Essentials Sweat Shorts", "Purple Brand Jeans", "Carhartt Work Jacket", "Harley Davidson Tee"
- price: number only, no dollar sign
- size: just the size letter/number
- category: one of exactly: shirts, hoodies, shorts, belts, kakobuy, other
- description: max 2 sentences. Mention material quality (thick cotton, heavy fleece, solid stitching etc). No smoke-free, no pet-free, never say "rep" or "replica". If "rep" or "1:1" in input start with "1:1 quality." End with "Local pickup/meetup Victoria only."

Example output:
{"brand":"Fear of God Essentials","name":"Essentials Sweat Shorts","price":50,"size":"M","category":"shorts","description":"1:1 quality. Thick cotton, clean condition. Local pickup/meetup Victoria only."}`;

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
        temperature: 0.1,
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
