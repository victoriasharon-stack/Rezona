import { PitchDetector } from 'pitchy'
import { frequencyToMidi, midiToNoteName, getMonoChannelData } from '../utils/noteUtils'

export async function detectNotes(audioBuffer, options = {}) {
  const {
    frameSize = 2048,
    hopSize = 512,
    clarityThreshold = 0.8,
    minFreq = 70,
    maxFreq = 1200,
    minNoteDuration = 0.08,
  } = options

  const sampleRate = audioBuffer.sampleRate
  const channelData = getMonoChannelData(audioBuffer)
  const detector = PitchDetector.forFloat32Array(frameSize)

  const frames = []
  const frameDuration = hopSize / sampleRate

  for (let i = 0; i + frameSize <= channelData.length; i += hopSize) {
    const frame = channelData.subarray(i, i + frameSize)
    const [pitch, clarity] = detector.findPitch(frame, sampleRate)
    const time = i / sampleRate

    if (clarity >= clarityThreshold && pitch >= minFreq && pitch <= maxFreq) {
      frames.push({ time, midi: Math.round(frequencyToMidi(pitch)) })
    } else {
      frames.push({ time, midi: null })
    }
  }

  const notes = []
  let current = null

  for (const frame of frames) {
    if (frame.midi !== null) {
      if (current && current.midi === frame.midi) {
        current.endTime = frame.time + frameDuration
      } else {
        if (current) notes.push(current)
        current = { midi: frame.midi, startTime: frame.time, endTime: frame.time + frameDuration }
      }
    } else if (current) {
      notes.push(current)
      current = null
    }
  }
  if (current) notes.push(current)

  return notes
    .filter((n) => n.endTime - n.startTime >= minNoteDuration)
    .map((n) => ({ ...n, name: midiToNoteName(n.midi) }))
}