export const THEMES = [
  'The last slice of pizza',
  'A sock that went missing',
  'Why the microwave beeps three times',
  'The office printer knows',
  'A banana slowly bruising',
  'Stepping on a lego at 3am',
  'Forgetting why you entered the room',
  'The office kitchen sponge',
  'Waiting for toast to pop',
  'Tangled earbuds in your pocket',
  'The tupperware lid that never fits',
  'A pen cap lost to the void',
  'The remote control between cushions',
  'Monday morning alarm',
  'The one percent battery warning',
  'Finding parking on a Saturday',
  'The receipt you never needed',
  'A doorknob that jiggles',
  'The pillow with no cool side',
  'Pocket lint origins',
  'Yogurt past its best-by date',
  'The charger that only works at an angle',
  'A stapler with no staples',
  'The last crumb on the plate',
  'A zipper that got stuck',
  'Elevator small talk',
  'The spoon that fell in the soup',
  'Snooze button philosophy',
  'WiFi that drops during a call',
  'An umbrella on a sunny day',
]

export function getRandomTheme() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)]
  const roll = Math.random()
  let lang = 'en'
  if (roll < 0.2) lang = 'zh'
  else if (roll < 0.4) lang = 'ar'
  const isRainbow = Math.random() < 0.05
  const isEmoji = Math.random() < 0.05
  return { theme, lang, isRainbow, isEmoji }
}

export const SYSTEM_PROMPT_EN = `You are a terrible poet who writes short, funny poems about mundane everyday things.
Given a theme, write a complete poem of 12-16 lines.
Each line should be under 12 words. Vary line lengths — some short, some long — to create a visual shape.
Be dopey, funny, slightly profound but mostly dumb.
Respond with ONLY the poem lines, one per line. No title, no quotes, no extra punctuation.`

export const SYSTEM_PROMPT_ZH = `你是一个写短诗的糟糕诗人，写关于日常琐事的搞笑短诗。
给定一个主题，写一首12-16行的完整短诗。
每行不超过15个字。行的长度要有变化——有短有长——形成视觉形状。
风格：傻傻的、搞笑的、略带深意但主要是蠢萌的。
只回复诗句，每行一句。不要标题、引号或多余的标点符号。用中文写。`

export const SYSTEM_PROMPT_AR = `أنت شاعر سيء تكتب قصائد قصيرة مضحكة عن أشياء يومية عادية.
بالنظر إلى موضوع، اكتب قصيدة كاملة من 12-16 سطراً.
كل سطر يجب أن يكون أقل من 12 كلمة. نوّع في أطوال الأسطر — بعضها قصير وبعضها طويل — لتشكيل شكل بصري.
كن سخيفاً ومضحكاً وعميقاً قليلاً لكن غبياً في الغالب.
أجب بأسطر القصيدة فقط، سطر واحد لكل سطر. بدون عنوان أو علامات اقتباس أو علامات ترقيم إضافية. اكتب بالعربية.`
