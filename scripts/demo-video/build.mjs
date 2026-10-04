// Voices the story, times every scene to the narration and writes timeline.json.
//   node build.mjs say            # macOS voice, for timing and previews
//   node --env-file=../.env.local build.mjs murf   # Murf, Indian English
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const provider = process.argv[2] || 'say'
const here = path.dirname(new URL(import.meta.url).pathname)
const voiceId = process.env.MURF_VOICE || 'en-IN-isha'
const hindiVoice = provider === 'murf' && voiceId.startsWith('hi-IN')
const audioDir = path.join(here, provider === 'murf' ? `audio-murf-${voiceId}` : `audio-${provider}`)
fs.mkdirSync(audioDir, {recursive: true})

// The story. Each line is one caption and one narration clip.
const lines = [
  ['hero', 'Every evening, at the golgappa stall in Sector 14, Indore, Priya asks the same question before the first bite.'],
  ['hero', 'Bhaiya, pani saaf hai na? Is this water clean?'],
  ['menu', 'But nobody asks that about the water in their own taps.'],
  ['menu', 'So we built Pani Kaisa Hai, where every neighbourhood is a golgappa.'],
  ['menu', 'Crisp means all is well. Soggy means complaints are rising, so boil before you drink. And phoot gaya means a person has confirmed the water is unsafe.'],
  ['report', 'On the second of October, Priya’s tap water smelled of sewage.'],
  ['report', 'She reported it in under a minute. No sign-up, no name, just what she noticed.'],
  ['sim', 'Two neighbours reported the same smell. In one home, two people fell ill. And a test strip read seven hundred and eighty, well over India’s drinking-water limit.'],
  ['sim', 'The score climbed, and the golgappa went soggy on its own. But software can never make it burst.'],
  ['person', 'Only a person can do that.'],
  ['person', 'R. Mehta from the residents’ association checked the evidence and confirmed it, with a name and a reason.'],
  ['area', 'Now Sector 14 is phoot gaya. Every neighbour sees what to do, in English and in Hindi, and exactly who decided, and why.'],
  ['map', 'On the map, one golgappa has burst. Nine are still crisp.'],
  ['end', 'Pani Kaisa Hai. Early warning from residents, not a lab test. Try it at pani kaisa hai dot vercel dot app.'],
]
// What the captions show where the spoken form differs.
const captionText = {
  13: 'Pani Kaisa Hai? Early warning from residents, not a lab test. pani-kaisa-hai.vercel.app',
  7: 'Two neighbours reported the same smell. In one home, two people fell ill. And a test strip read 780 mg/L, well over India’s drinking-water limit.',
}

// For a Hindi voice, the Hindi words go in Devanagari so they are said natively.
const spokenHindi = {
  0: 'Every evening, at the गोलगप्पा stall in Sector 14, Indore, Priya asks the same question before the first bite.',
  1: 'भैया, पानी साफ़ है ना? Is this water clean?',
  3: 'So we built पानी कैसा है, where every neighbourhood is a गोलगप्पा.',
  4: 'Crisp means all is well. Soggy means complaints are rising, so boil before you drink. And फूट गया means a person has confirmed the water is unsafe.',
  8: 'The score climbed, and the गोलगप्पा went soggy on its own. But software can never make it burst.',
  11: 'Now Sector 14 is फूट गया. Every neighbour sees what to do, in English and in Hindi, and exactly who decided, and why.',
  12: 'On the map, one गोलगप्पा has burst. Nine are still crisp.',
  13: 'पानी कैसा है. Early warning from residents, not a lab test. Try it at पानी कैसा है dot vercel dot app.',
}

const manifest = JSON.parse(fs.readFileSync(path.join(here, 'frames/manifest.json'), 'utf8'))
const framesOf = (scene) => manifest.filter((f) => f.scene === scene).map((f) => `frames/${f.file}`)

// Visuals per scene: a still gets a slow zoom, a sequence plays at a fixed rate.
const visuals = {
  hero: [{still: framesOf('hero')[0]}],
  menu: [{seq: framesOf('scroll-menu'), fps: 14}, {still: framesOf('menu')[0]}],
  report: ['report-1', 'report-1-picked', 'report-2', 'report-2-smell', 'report-3', 'report-4'].map((s) => ({still: framesOf(s)[0], zoom: 1.02})),
  sim: ['sim-0', ...framesOf('sim-neighbours').map(() => 'sim-neighbours'), 'sim-ill', 'sim-tds', 'sim-soggy'].map((s, i, all) => {
    const list = framesOf(s)
    const k = all.slice(0, i).filter((x) => x === s).length
    return {still: list[Math.min(k, list.length - 1)], zoom: 1.02}
  }),
  person: [{still: framesOf('sim-confirmed')[0]}, {still: framesOf('control')[0]}],
  area: [{still: framesOf('area-top')[0]}, {seq: framesOf('area-scroll'), fps: 12}, {still: framesOf('area-verified')[0]}],
  map: [{still: framesOf('map-final')[0]}],
  end: [{still: 'endcard.jpg', zoom: 1.0}],
}

async function voice(i, text) {
  const ext = provider === 'murf' ? 'wav' : 'aiff'
  const file = path.join(audioDir, `${String(i).padStart(2, '0')}.${ext}`)
  if (!fs.existsSync(file)) {
    if (provider === 'say') {
      execFileSync('say', ['-v', process.env.SAY_VOICE || 'Rishi', '-r', '170', '-o', file, text])
    } else {
      const key = process.env.MURF_API_KEY
      if (!key) throw new Error('MURF_API_KEY is not set (add it to .env.local).')
      const res = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'api-key': key},
        body: JSON.stringify({
          voiceId,
          style: process.env.MURF_STYLE || undefined,
          text,
          format: 'WAV',
          sampleRate: 44100,
          channelType: 'MONO',
        }),
      })
      if (!res.ok) throw new Error(`Murf ${res.status}: ${await res.text()}`)
      const {audioFile} = await res.json()
      const audio = await fetch(audioFile)
      fs.writeFileSync(file, Buffer.from(await audio.arrayBuffer()))
    }
  }
  const info = execFileSync('afinfo', [file]).toString()
  const duration = Number(info.match(/estimated duration: ([\d.]+)/)[1])
  return {file: path.relative(here, file), duration}
}

async function endCard() {
  const W = 1920, H = 1080
  const bgFrame = await sharp(path.join(here, framesOf('hero')[0])).blur(18).modulate({brightness: 0.35}).toBuffer()
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .t{font-family:'Georgia',serif;font-weight:700;fill:#f6e7cf}
      .s{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;fill:#f6e7cf}
    </style>
    <text x="960" y="420" text-anchor="middle" class="t" font-size="120">Pani Kaisa Hai?</text>
    <text x="960" y="500" text-anchor="middle" class="s" font-size="44" fill-opacity="0.85">Is the water in your area safe today?</text>
    <text x="960" y="620" text-anchor="middle" class="s" font-size="52" font-weight="700" fill="#f0a24a">pani-kaisa-hai.vercel.app</text>
    <text x="960" y="700" text-anchor="middle" class="s" font-size="34" fill-opacity="0.75">Built with Sanity and Next.js · Sanity Challenge, Path Two</text>
    <text x="960" y="1010" text-anchor="middle" class="s" font-size="28" fill-opacity="0.6">Early warning from residents, not a lab test. All data in this demo is sample data.</text>
  </svg>`
  await sharp(bgFrame).composite([{input: Buffer.from(svg)}]).jpeg({quality: 92}).toFile(path.join(here, 'endcard.jpg'))
}

await endCard()

const fps = 30
let t = 0.6
const clips = [], captions = [], audio = []
let sceneStart = t, current = null
const sceneSpans = []

for (const [i, [scene, text]] of lines.entries()) {
  if (scene !== current) {
    if (current) { sceneSpans.push({scene: current, start: sceneStart, end: t}); t += 0.35 }
    current = scene; sceneStart = t
  }
  const {file, duration} = await voice(i, hindiVoice && spokenHindi[i] ? spokenHindi[i] : text)
  audio.push({file, start: t})
  captions.push({text: captionText[i] || text, start: t, end: t + duration + 0.15})
  t += duration + 0.4
}
const total = t + 2.5
sceneSpans.push({scene: current, start: sceneStart, end: total})

for (const [k, span] of sceneSpans.entries()) {
  const items = visuals[span.scene]
  const length = span.end - span.start
  const seqTime = items.filter((v) => v.seq).reduce((s, v) => s + v.seq.length / v.fps, 0)
  const stills = items.filter((v) => v.still).length
  const stillTime = Math.max(0.8, (length - seqTime) / Math.max(stills, 1))
  let at = span.start
  for (const [j, v] of items.entries()) {
    const fade = j === 0 && k > 0 ? 0.45 : v.still && j > 0 ? 0.25 : 0
    if (v.seq) {
      for (const [n, f] of v.seq.entries()) {
        clips.push({file: f, start: at, duration: 1 / v.fps, zoomFrom: 1, zoomTo: 1, fade: n === 0 ? fade : 0})
        at += 1 / v.fps
      }
    } else {
      const z = v.zoom ?? 1.06
      clips.push({file: v.still, start: at, duration: stillTime, zoomFrom: 1, zoomTo: z, fade})
      at += stillTime
    }
  }
}

const timeline = {fps, width: 1920, height: 1080, total, clips, captions, audio}
fs.writeFileSync(path.join(here, 'timeline.json'), JSON.stringify(timeline, null, 1))
console.log(`timeline: ${total.toFixed(1)} s, ${clips.length} clips, ${captions.length} lines, voice: ${provider}`)
