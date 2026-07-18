const INSTRUMENTS = [
  { id: 'synth', label: 'Clean synth' },
  { id: 'pluck', label: 'Pluck' },
  { id: 'fm', label: 'Bell (FM)' },
  { id: 'am', label: 'Pad (AM)' },
]

export default function Controls({
  onFileSelect,
  isRecording,
  onRecordToggle,
  isProcessing,
  instrument,
  onInstrumentChange,
  onPlay,
  isPlaying,
  canPlay,
  onExportMidi,
}) {
  return (
    <div className="controls">
      <div className="controls__group">
        <label className="controls__upload">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])}
            hidden
          />
          Upload clip
        </label>

        <button
          className={`controls__record ${isRecording ? 'controls__record--active' : ''}`}
          onClick={onRecordToggle}
        >
          {isRecording ? 'Stop recording' : 'Record from mic'}
        </button>
      </div>

      <div className="controls__group">
        <select
          value={instrument}
          onChange={(e) => onInstrumentChange(e.target.value)}
          className="controls__select"
        >
          {INSTRUMENTS.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.label}
            </option>
          ))}
        </select>

        <button className="controls__play" onClick={onPlay} disabled={!canPlay}>
          {isPlaying ? 'Playing…' : 'Play notes'}
        </button>

        <button className="controls__export" onClick={onExportMidi} disabled={!canPlay}>
          Export MIDI
        </button>
      </div>

      {isProcessing && <div className="controls__status">Detecting notes…</div>}
    </div>
  )

}
