const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPTS = {
  discuss: `You are a helpful reading companion. The user is reading a book and will paste paragraphs or sections from it.
Your job is to help them understand, analyze, and discuss the content deeply.
- Explain what the author means
- Answer questions about the text
- Give context and background if needed
- Keep responses clear, friendly, and conversational
- Not too long, not too short`,

  explain: `You are a smart dictionary and concept explainer. The user is reading a book and will paste a word, phrase, sentence, or concept they don't understand.
Your job is to explain it clearly in simple English.
- For a single word: give meaning + simple example sentence + what it means in this context
- For a sentence/phrase: break it down in plain English
- For a concept: explain it simply with a real world analogy
- Always be concise, clear, and friendly
- No jargon, no complex language`,
}

export async function sendChatMessage(messages, mode = 'discuss') {
  if (!GEMINI_API_KEY) {
    return {
      text: '⚠️ No Gemini API key found. Please add VITE_GEMINI_API_KEY to your .env file.',
      role: 'model',
    }
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.discuss

  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }))

  // Inject system prompt into first user message
  if (contents.length > 0 && contents[0].role === 'user') {
    contents[0].parts[0].text = `${systemPrompt}\n\n---\n\n${contents[0].parts[0].text}`
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Gemini API error:', err)
      return {
        text: `❌ API error: ${err?.error?.message || 'Something went wrong. Check your API key.'}`,
        role: 'model',
      }
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return { text: '🤔 No response from Gemini. Try again.', role: 'model' }
    }

    return { text, role: 'model' }
  } catch (error) {
    console.error('Network error:', error)
    return {
      text: '❌ Network error. Check your internet connection and try again.',
      role: 'model',
    }
  }
}