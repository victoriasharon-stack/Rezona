const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function frequencyToMidi(frequency) {
  return 69 + 12 * Math.log2(frequency / 440)
}

export function midiToNoteName(midi) {
  const rounded = Math.round(midi)
  const octave = Math.floor(rounded / 12) - 1
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12]
  return `${name}${octave}`
}

export function getMonoChannelData(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0)
  }
  const left = audioBuffer.getChannelData(0)
  const right = audioBuffer.getChannelData(1)
  const mono = new Float32Array(left.length)
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2
  }
  return mono
}

export async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  ctx.close()
  return audioBuffer
}