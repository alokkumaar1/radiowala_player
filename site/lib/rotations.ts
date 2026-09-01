import type { RotationKey } from '@/data/songs'

export type Rotation = {
  key: RotationKey
  hindi: string
  english: string
  blurb: string
  /** Inclusive start hour, exclusive end hour, IST. Null for off-clock. */
  window: [number, number] | null
  label: string
  freq: string
}

// One mood, five shades of it. The clock decides which shade is on air —
// mornings ache quieter than 2am does.
export const rotations: Rotation[] = [
  {
    key: 'udit',
    hindi: 'उदित नारायण',
    english: 'Udit Narayan',
    blurb: 'The softer ache. Longing that still has some hope left in it.',
    window: [5, 12],
    label: '05:00 – 12:00 IST',
    freq: '91.1',
  },
  {
    key: 'sanu',
    hindi: 'कुमार सानू का दर्द',
    english: 'Kumar Sanu Ka Dard',
    blurb: 'The heartbreak canon. Aashiqui, Saajan, Deewana — the whole wound.',
    window: [12, 18],
    label: '12:00 – 18:00 IST',
    freq: '88.6',
  },
  {
    key: 'mustafa',
    hindi: 'मुस्तफ़ा ज़ाहिद',
    english: 'Mustafa Zahid',
    blurb: 'तो फिर आओ. The Awarapan ache — the one that sits in your chest.',
    window: [18, 22],
    label: '18:00 – 22:00 IST',
    freq: '93.5',
  },
  {
    key: 'raat',
    hindi: 'रात के दो बजे',
    english: 'Raat Ke Do Baje',
    blurb: 'The heaviest hour. Do not play this one if you are already low.',
    window: [22, 5],
    label: '22:00 – 05:00 IST',
    freq: '98.3',
  },
  {
    key: 'purane',
    hindi: 'पुराने ज़ख्म',
    english: 'Purane Zakhm',
    blurb: 'The older wounds — Rafi, Kishore, Lata. Off the clock, on request.',
    window: null,
    label: 'On request',
    freq: '100.7',
  },
]

export const rotationByKey = (key: RotationKey): Rotation =>
  rotations.find((r) => r.key === key) ?? rotations[1]

/** Current hour in India, regardless of where the visitor is sitting. */
export function istHour(now: Date = new Date()): number {
  const h = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false,
  }).format(now)
  // en-GB gives "24" rather than "00" at midnight.
  return Number(h) % 24
}

export function istClock(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

function inWindow(hour: number, [start, end]: [number, number]): boolean {
  // Windows that cross midnight (22 → 5) need the wrap-around branch.
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

/** Which on-clock band is live right now. Never returns the on-request band. */
export function liveRotation(now: Date = new Date()): Rotation {
  const hour = istHour(now)
  return rotations.find((r) => r.window && inWindow(hour, r.window)) ?? rotations[1]
}
