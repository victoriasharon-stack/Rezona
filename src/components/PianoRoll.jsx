const WIDTH = 900
const HEIGHT = 320
const PADDING = 24

export default function PianoRoll({ notes, duration, playheadTime }) {
  if (!notes.length) {
    return (
      <div className="piano-roll piano-roll--empty">
        <span>No notes detected yet — upload a clip or hit record.</span>
      </div>
    )
  }

  const midis = notes.map((n) => n.midi)
  const minMidi = Math.min(...midis) - 2
  const maxMidi = Math.max(...midis) + 2
  const midiRange = maxMidi - minMidi + 1

  const plotW = WIDTH - PADDING * 2
  const plotH = HEIGHT - PADDING * 2
  const rowH = plotH / midiRange
  const xScale = duration > 0 ? plotW / duration : 1

  const midiToY = (midi) => PADDING + (maxMidi - midi) * rowH

  return (
    <div className="piano-roll">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="piano-roll__svg">
        {Array.from({ length: midiRange }, (_, i) => minMidi + i).map((midi) => (
          <line
            key={midi}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={midiToY(midi) + rowH / 2}
            y2={midiToY(midi) + rowH / 2}
            className={midi % 12 === 0 ? 'piano-roll__grid piano-roll__grid--octave' : 'piano-roll__grid'}
          />
        ))}

        {notes.map((n, i) => (
          <rect
            key={i}
            x={PADDING + n.startTime * xScale}
            y={midiToY(n.midi) + 1}
            width={Math.max(2, (n.endTime - n.startTime) * xScale)}
            height={rowH - 2}
            rx={3}
            className="piano-roll__note"
          />
        ))}

        {playheadTime != null && (
          <line
            x1={PADDING + playheadTime * xScale}
            x2={PADDING + playheadTime * xScale}
            y1={PADDING}
            y2={HEIGHT - PADDING}
            className="piano-roll__playhead"
          />
        )}
      </svg>
    </div>
  )
}