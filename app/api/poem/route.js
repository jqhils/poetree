import { GoogleGenAI } from '@google/genai'
import { SYSTEM_PROMPT } from '@/helpers/poemPrompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL = 'gemini-2.0-flash-lite'

export async function POST(request) {
  try {
    const { theme } = await request.json()

    const prompt = `Write a short poem about: "${theme}"`

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 200,
        temperature: 1.0,
      },
    })

    const poem = response.text.trim()
    return Response.json({ poem })
  } catch (error) {
    console.error('Gemini API error:', error)
    const fallbacks = [
      'It vanished like my motivation\nNobody asked for this\nAnd yet here we are\nThe universe shrugged\nI checked behind the couch\nNothing but dust and regret\nSome things are meant to disappear\nLike weekends',
      'Somewhere a sock is crying\nIt left no forwarding address\nThe dryer keeps its secrets\nWarm and tumbling forever\nI bought a replacement pair\nBut it felt like betrayal\nThe original knows\nIt always knows',
      'The toast popped up too early\nNeither brown nor brave\nJust lukewarm bread with dreams\nOf being something more\nI pressed it down again\nHope springs eternal\nSmoke springs eventually\nThe alarm agrees',
      'Monday came uninvited\nLike a cat on your keyboard\nPresent and unhelpful\nRefusing to leave\nI offered it coffee\nIt wanted my soul instead\nWe compromised on Tuesday\nTuesday always compromises',
    ]
    const poem = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    return Response.json({ poem })
  }
}
