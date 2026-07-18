import { useState, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import MidiWriter from 'midi-writer-js'
import { detectNotes } from './hooks/usePitchDetection'
import { decodeAudioFile } from './utils/noteUtils'
import Controls from './components/Controls'
import PianoRoll from './components/PianoRoll'

function createSynth(instrument) {
  switch (instrument) {
    case 'pluck':
      return new Tone.PluckSynth().toDestination()
    case 'fm':
      return new Tone.FMSynth().toDestination()
    case 'am':
      return new Tone.AMSynth().toDestination()
    default:
      return new Tone.Synth().toDestination()
  }
}

export default function App() {
  const [notes, setNotes] = useState([])
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [instrument, setInstrument] = useState('synth')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadTime, setPlayheadTime] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const rafRef = useRef(null)
  const synthRef = useRef(null)

  const runDetection = useCallback(async (audioBuffer) => {
    setError(null)
    setIsProcessing(true)
    setNotes([])
    setDuration(audioBuffer.duration)
    try {
      await new Promise((r) => setTimeout(r, 0))
      const detected = await detectNotes(audioBuffer)
      setNotes(detected)
      if (detected.length === 0) {
        setError('No clear melodic line detected — try a cleaner, more solo recording.')
      }
    } catch (err) {
      console.error(err)
      setError('Could not analyze that clip.')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleFileSelect = useCallback(
    async (file) => {
      try {
        const audioBuffer = await decodeAudioFile(file)
        await runDetection(audioBuffer)
      } catch (err) {
        console.error(err)
        setError('Could not read that audio file.')
      }
    },
    [runDetection]
  )

  const handleRecordToggle = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    if (!window.isSecureContext) {
      setError('Mic access needs https:// or localhost — check the URL you\'re running this on.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser doesn\'t support mic recording. Try Chrome, Firefox, or Edge.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        try {
          const audioBuffer = await decodeAudioFile(blob)
          await runDetection(audioBuffer)
        } catch (err) {
          console.error(err)
          setError('Could not process the recording.')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      console.error(err)
      if (err.name === 'NotAllowedError') {
        setError('Mic permission was denied — check the site permissions in your browser settings and reload.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone was found on this device.')
      } else {
        setError(`Mic error: ${err.message || err.name}`)
      }
    }
  }, [isRecording])

  const handlePlay = useCallback(async () => {
    if (isPlaying || notes.length === 0) return
    await Tone.start()

    const synth = createSynth(instrument)
    synthRef.current = synth

    notes.forEach((n) => {
      const dur = Math.max(0.05, n.endTime - n.startTime)
      synth.triggerAttackRelease(n.name, dur, Tone.now() + n.startTime)
    })

    setIsPlaying(true)
    const start = performance.now()

    const tick = () => {
      const elapsed = (performance.now() - start) / 1000
      setPlayheadTime(elapsed)
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setIsPlaying(false)
        setPlayheadTime(null)
        synth.dispose()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isPlaying, notes, instrument, duration])

  const handleExportMidi = useCallback(() => {
    if (notes.length === 0) return
    const tempo = 120
    const ticksPerSecond = (128 * tempo) / 60

    const track = new MidiWriter.Track()
    track.setTempo(tempo)

    let cursor = 0
    notes.forEach((n) => {
      const waitTicks = Math.max(0, Math.round((n.startTime - cursor) * ticksPerSecond))
      const durationTicks = Math.max(1, Math.round((n.endTime - n.startTime) * ticksPerSecond))
      track.addEvent(
        new MidiWriter.NoteEvent({
          pitch: [n.name],
          duration: `T${durationTicks}`,
          wait: waitTicks > 0 ? `T${waitTicks}` : undefined,
        })
      )
      cursor = n.endTime
    })

    const writer = new MidiWriter.Writer(track)
    const a = document.createElement('a')
    a.href = writer.dataUri()
    a.download = 'mood-music-sketch.mid'
    a.click()
  }, [notes])

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Mood Music</h1>
        <p className="app__subtitle">note sketchpad — hear the skeleton, play it back your way</p>
      </header>

      <Controls
        onFileSelect={handleFileSelect}
        isRecording={isRecording}
        onRecordToggle={handleRecordToggle}
        isProcessing={isProcessing}
        instrument={instrument}
        onInstrumentChange={setInstrument}
        onPlay={handlePlay}
        isPlaying={isPlaying}
        canPlay={notes.length > 0}
        onExportMidi={handleExportMidi}
      />

      {error && <div className="app__error">{error}</div>}

      <PianoRoll notes={notes} duration={duration} playheadTime={playheadTime} />

      <footer className="app__footer">
        <span>{notes.length} notes detected</span>
        {duration > 0 && <span>{duration.toFixed(1)}s clip</span>}
      </footer>
    </div>
  )
}


