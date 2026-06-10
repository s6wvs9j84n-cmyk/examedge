export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, answer, type, marks, ao5, ao6 } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Missing question or answer' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

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

This is a ${type === 'creative' ? 'creative writing' : 'transactional writing'} task worth ${marks} marks (AO5: ${ao5}, AO6: ${ao6}).

AQA mark scheme:
- AO5 Band 4 (19-24): Compelling, convincing. Crafted and controlled.
- AO5 Band 3 (13-18): Consistent, clear. Vocabulary and structure used for effect.
- AO5 Band 2 (7-12): Some attempts to match style. Some structural features.
- AO5 Band 1 (1-6): Simple, limited writing.
- AO6 Band 4 (13-16): Extensive vocabulary. Varied sentences. Few errors.
- AO6 Band 3 (9-12): Sophisticated vocabulary. Generally accurate.
- AO6 Band 2 (5-8): Some varied vocabulary. Some accurate punctuation.
- AO6 Band 1 (1-4): Simple vocabulary. Frequent errors.

Student's answer:
${answer}

Respond in exactly this format:

SCORE: [number]/40 (AO5: [number]/24 · AO6: [number]/16)

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