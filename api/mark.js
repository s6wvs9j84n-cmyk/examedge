export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { question, answer, type, marks, ao5, ao6, ao, paper, markScheme } = req.body;

    if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const isCreative = type === 'creative';
    const scoreFormat = isCreative
      ? 'SCORE: [number]/40 (AO5: [number]/24 · AO6: [number]/16)'
      : `SCORE: [number]/${marks}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are an experienced AQA GCSE English Language examiner.

The question was: ${question}

Mark scheme:
${markScheme}

Student's answer:
${answer}

Respond in exactly this format:

${scoreFormat}

WHAT YOU DID WELL:
- [specific point]
- [specific point]

HOW TO IMPROVE:
- [specific actionable tip]
- [specific actionable tip]
- [specific actionable tip]`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({ error: `Anthropic error: ${errorData.error?.message}` });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.content[0].text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}