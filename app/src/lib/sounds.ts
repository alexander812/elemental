type AudioContextConstructor = new () => AudioContext

let context: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null

  if (context) return context

  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor
    webkitAudioContext?: AudioContextConstructor
  }
  const Constructor = scope.AudioContext ?? scope.webkitAudioContext

  if (!Constructor) return null

  context = new Constructor()

  return context
}

export function unlockSounds(): void {
  const audioContext = getAudioContext()

  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

type Tone = {
  duration: number
  endFrequency?: number
  frequency: number
  offset: number
  type?: OscillatorType
  volume?: number
}

const playTones = (tones: Tone[]): void => {
  const audioContext = getAudioContext()

  if (!audioContext) return

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  const start = audioContext.currentTime

  tones.forEach(({ duration, endFrequency, frequency, offset, type = 'sine', volume = 0.14 }) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const toneStart = start + offset

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, toneStart)

    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, toneStart + duration)
    }

    gain.gain.setValueAtTime(0.0001, toneStart)
    gain.gain.exponentialRampToValueAtTime(volume, toneStart + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(toneStart)
    oscillator.stop(toneStart + duration + 0.03)
  })
}

export function playSuccess(): void {
  playTones([
    { duration: 0.1, frequency: 659.25, offset: 0 },
    { duration: 0.16, frequency: 987.77, offset: 0.1 },
  ])
}

export function playError(): void {
  playTones([
    { duration: 0.16, frequency: 196, offset: 0, type: 'sawtooth', volume: 0.1 },
    { duration: 0.2, frequency: 146.83, offset: 0.15, type: 'sawtooth', volume: 0.1 },
  ])
}

export function playSalute(): void {
  const audioContext = getAudioContext()

  if (!audioContext) return

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  const start = audioContext.currentTime
  const shells = [
    { burstAt: 0.6, from: 520, to: 1250, volume: 0.5 },
    { burstAt: 1.25, from: 450, to: 1080, volume: 0.42 },
    { burstAt: 1.95, from: 590, to: 1380, volume: 0.36 },
  ]

  shells.forEach(({ burstAt, from, to, volume }) => {
    const whistleStart = start + burstAt - 0.5
    const whistle = audioContext.createOscillator()
    const whistleGain = audioContext.createGain()

    whistle.type = 'triangle'
    whistle.frequency.setValueAtTime(from, whistleStart)
    whistle.frequency.exponentialRampToValueAtTime(to, start + burstAt)

    whistleGain.gain.setValueAtTime(0.0001, whistleStart)
    whistleGain.gain.exponentialRampToValueAtTime(0.05, whistleStart + 0.1)
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, start + burstAt)

    whistle.connect(whistleGain)
    whistleGain.connect(audioContext.destination)
    whistle.start(whistleStart)
    whistle.stop(start + burstAt + 0.05)

    const burstDuration = 0.9
    const length = Math.floor(audioContext.sampleRate * burstDuration)
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let index = 0; index < length; index += 1) {
      const progress = index / length
      const envelope = 0.7 * Math.exp(-progress * 24) + 0.5 * Math.exp(-progress * 4)
      data[index] = (Math.random() * 2 - 1) * envelope
    }

    const source = audioContext.createBufferSource()
    const filter = audioContext.createBiquadFilter()
    const gain = audioContext.createGain()

    source.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.value = 3200
    gain.gain.value = volume

    source.connect(filter)
    filter.connect(gain)
    gain.connect(audioContext.destination)
    source.start(start + burstAt)
  })
}

export function playDisappointment(): void {
  playTones([
    { duration: 0.24, endFrequency: 369.99, frequency: 392, offset: 0, type: 'sawtooth', volume: 0.08 },
    { duration: 0.24, endFrequency: 329.63, frequency: 349.23, offset: 0.21, type: 'sawtooth', volume: 0.08 },
    { duration: 0.24, endFrequency: 293.66, frequency: 311.13, offset: 0.42, type: 'sawtooth', volume: 0.08 },
    { duration: 0.6, endFrequency: 233.08, frequency: 293.66, offset: 0.63, type: 'sawtooth', volume: 0.09 },
  ])
}
