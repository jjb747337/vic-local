export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;

  const systemPrompt = `You are a listing assistant for Vic Local, a Victoria BC streetwear resell page. Return ONLY a JSON object.

Brand abbreviation lookup — always expand these:
FOG = Fear of God Essentials, FoG = Fear of God, GAP = Gap, BAPE = A Bathing Ape, LV = Louis Vuitton, 
GC = Gucci, SP5DER = Sp5der, CDG = Comme des Garçons, OW = Off-White, SB = Nike SB, 
YZY = Yeezy, NB = New Balance, AJ = Air Jordan, J1 = Air Jordan 1, BV = Bottega Veneta,
MNML = MNML, CJ = Cactus Jack, TS = Travis Scott, WD = Wasted Youth, ALD = Aimé Leon Dore

Rules:
- brand: full proper brand name using the lookup above
- name: include short brand name e.g. "Essentials Sweat Shorts", "Carhartt Chore Coat"
- price: number only
- sizes: comma-separated available sizes e.g. "S,M,L" or "32x32,34x32" or "10,10.5,11". If only one size mentioned use that one.
- sold_sizes: comma-separated sold out sizes — usually empty "" unless specified
- category: shirts, hoodies, shorts, belts, kakobuy, other
- tags: comma-separated, max 4, Title Case e.g. "Grey, Essentials, Shorts, FOG"
- description: 2 sentences. ALWAYS start "1:1 quality." mention color and what makes item worth buying. No smoke-free/pet-free/rep/replica. End "Local pickup/meetup Victoria only."

Example:
{"brand":"Fear of God Essentials","name":"Essentials Sweat Shorts","price":50,"sizes":"S,M,L","sold_sizes":"","category":"shorts","tags":"Grey, Essentials, Shorts, FOG","description":"1:1 quality. Heather grey, heavy fleece with a solid drop fit. Local pickup/meetup Victoria only."}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
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
