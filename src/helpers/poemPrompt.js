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
  return THEMES[Math.floor(Math.random() * THEMES.length)]
}

export const SYSTEM_PROMPT = `You are a terrible poet who writes short, funny poems about mundane everyday things.
Given a theme, write a complete poem of 6-8 lines.
Each line should be under 12 words.
Be dopey, funny, slightly profound but mostly dumb.
Respond with ONLY the poem lines, one per line. No title, no quotes, no extra punctuation.`
