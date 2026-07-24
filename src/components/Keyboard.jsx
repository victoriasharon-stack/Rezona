import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

const WHITE_KEYS = [
  { note: 'C4', key: 'a', color: 'coral' },
  { note: 'D4', key: 's', color: 'gold' },
  { note: 'E4', key: 'd', color: 'teal' },
  { note: 'F4', key: 'f', color: 'pink' },
  { note: 'G4', key: 'g', color: 'purple' },
  { note: 'A4', key: 'h', color: 'coral' },
  { note: 'B4', key: 'j', color: 'gold' },
  { note: 'C5', key: 'k', color: 'teal' },
]

const BLACK_KEYS = [
  { note: 'C#4', key: 'w', afterIndex: 0 },
  { note: 'D#4', key: 'e', afterIndex: 1 },
  { note: 'F#4', key: 't', afterIndex: 3 },
  { note: 'G#4', key: 'y', afterIndex: 4 },
  { note: 'A#4', key: 'u', afterIndex: 5 },
]

export default function Keyboard() {
  const synthRef = useRef(null)

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination()
    return () => synthRef.current?.dispose()
  }, [])

  const playNote = async (note) => {
    await Tone.start()
    synthRef.current?.triggerAttackRelease(note, '8n')
  }

  useEffect(() => {
    const allKeys = [...WHITE_KEYS, ...BLACK_KEYS]
    const handleKeyDown = (e) => {
      if (e.repeat) return
      const match = allKeys.find((k) => k.key === e.key.toLowerCase())
      if (match) playNote(match.note)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="keyboard">
      <div className="keyboard__white">
        {WHITE_KEYS.map((k) => (
          <button
            key={k.note}
            className={`keyboard__key keyboard__key--white c-${k.color}`}
            onClick={() => playNote(k.note)}
          >
            <span>{k.key}</span>
          </button>
        ))}
      </div>
      <div className="keyboard__black">
        {BLACK_KEYS.map((k) => (
          <button
            key={k.note}
            className="keyboard__key keyboard__key--black"
            style={{ left: `${(k.afterIndex + 1) * 12.5 - 3.5}%` }}
            onClick={() => playNote(k.note)}
          >
            <span>{k.key}</span>
          </button>
        ))}
      </div>
    </div>
  )
}