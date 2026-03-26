import { GoogleGenAI } from '@google/genai'
import { SYSTEM_PROMPT_EN, SYSTEM_PROMPT_ZH, SYSTEM_PROMPT_AR } from '@/helpers/poemPrompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL = 'gemini-2.0-flash-lite'

const PROMPTS = {
  en: { system: SYSTEM_PROMPT_EN, prefix: 'Write a short poem about:' },
  zh: { system: SYSTEM_PROMPT_ZH, prefix: '用中文写一首关于以下主题的短诗:' },
  ar: { system: SYSTEM_PROMPT_AR, prefix: 'اكتب قصيدة قصيرة عن:' },
}

const FALLBACKS = {
  en: [
    'It vanished like my motivation\nNobody asked for this\nAnd yet here we are\nThe universe shrugged\nI checked behind the couch\nNothing but dust and regret\nSome things are meant to disappear\nLike weekends\nI stared at the ceiling\nThe ceiling stared back\nNeither of us blinked\nWe both lost',
    'The toast popped up too early\nNeither brown nor brave\nJust lukewarm bread with dreams\nOf being something more\nI pressed it down again\nHope springs eternal\nSmoke springs eventually\nThe alarm agrees\nI ate it anyway\nIt tasted like compromise\nLike every Tuesday\nBland but functional',
    'Monday came uninvited\nLike a cat on your keyboard\nPresent and unhelpful\nRefusing to leave\nI offered it coffee\nIt wanted my soul instead\nWe compromised on Tuesday\nTuesday always compromises\nWednesday watched silently\nFrom behind the curtain\nPlotting something worse\nAs Wednesdays do',
  ],
  zh: [
    '袜子不见了\n它没留下任何字条\n烘干机守着秘密\n温暖地转啊转\n我买了新的一双\n但感觉像背叛\n旧袜子知道的\n它永远都知道\n我打开抽屉\n空空如也\n就像我的灵魂\n在周一早上',
    '闹钟响了\n我假装没听见\n它又响了\n我和它对视\n谁先认输\n当然是我\n起床是一种妥协\n和宇宙的妥协\n被子是温暖的\n世界是冷的\n选择很明显\n但账单不同意',
  ],
  ar: [
    'الجورب اختفى\nلم يترك أي رسالة\nالمجفف يحتفظ بأسراره\nيدور بدفء للأبد\nاشتريت زوجاً جديداً\nلكن شعرت بالخيانة\nالجورب القديم يعرف\nيعرف دائماً\nفتحت الدرج\nفارغ تماماً\nمثل روحي\nصباح الإثنين',
    'المنبه رن\nتظاهرت أنني لم أسمعه\nرن مرة أخرى\nحدقت فيه\nمن يستسلم أولاً\nأنا بالطبع\nالاستيقاظ تنازل\nتنازل للكون\nالبطانية دافئة\nالعالم بارد\nالخيار واضح\nلكن الفواتير لا توافق',
  ],
}

export async function POST(request) {
  let lang = 'en'
  try {
    const body = await request.json()
    lang = body.lang || 'en'
    const theme = body.theme

    const { system, prefix } = PROMPTS[lang] || PROMPTS.en

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `${prefix} "${theme}"`,
      config: {
        systemInstruction: system,
        maxOutputTokens: 400,
        temperature: 1.0,
      },
    })

    const poem = response.text.trim()
    return Response.json({ poem })
  } catch (error) {
    console.error('Gemini API error:', error.message || error)
    const langFallbacks = FALLBACKS[lang] || FALLBACKS.en
    const poem = langFallbacks[Math.floor(Math.random() * langFallbacks.length)]
    return Response.json({ poem })
  }
}
