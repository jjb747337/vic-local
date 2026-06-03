export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;
  const systemPrompt = `You are a listing assistant. Return ONLY a JSON object, no other text.

Rules:
- brand: common brand name only e.g. "Fear of God Essentials"
- name: include short brand name in item name e.g. "Essentials Sweat Shorts", "Carhartt Work Jacket"
- price: number only
- size: just the size
- category: one of exactly: shirts, hoodies, shorts, belts, kakobuy, other
- tags: comma-separated list of relevant tags. Always include: the color (if mentioned), the brand short name, and the item type. Example: "grey, essentials, shorts" or "black, carhartt, jacket". Max 4 tags, all lowercase.
- description: 2 sentences. ALWAYS start with "1:1 quality." then mention color and what makes the item worth buying. No smoke-free, no pet-free, never say "rep" or "replica". End with "Local pickup/meetup Victoria only."

Examples:
{"brand":"Fear of God Essentials","name":"Essentials Sweat Shorts","price":50,"size":"M","category":"shorts","tags":"grey, essentials, shorts, fog","description":"1:1 quality. Heather grey, heavy fleece with a solid drop fit. Local pickup/meetup Victoria only."}
{"brand":"Carhartt","name":"Carhartt Chore Coat","price":90,"size":"XL","category":"hoodies","tags":"brown, carhartt, jacket, workwear","description":"1:1 quality. Brown, thick canvas build — holds up and looks clean. Local pickup/meetup Victoria only."}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 350,
        temperature: 0.1,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
