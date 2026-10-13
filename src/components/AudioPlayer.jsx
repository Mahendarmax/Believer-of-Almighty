import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import './AudioPlayer.css'

// Per-verse audio player component.
//   resolveSource — optional async () => ({ url }) tried before `audioUrl`
//                   (used to swap in a file that has word timings)
//   playbackRate  — 1 or 0.75
//   repeatMode    — 'off' | '3' | 'inf'
//   onTimeUpdate  — (seconds | null) while playing; null when stopped
const AudioPlayer = memo(({ audioUrl, resolveSource, verseNumber, isGlobalPlaying, onPlay, playbackRate = 1, repeatMode = 'off', onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef(null)
  const animFrameRef = useRef(null)
  const playsRef = useRef(0)

  // Latest props in refs so the long-lived audio listeners never go stale
  const audioUrlRef = useRef(audioUrl)
  audioUrlRef.current = audioUrl
  const resolveSourceRef = useRef(resolveSource)
  resolveSourceRef.current = resolveSource
  const repeatRef = useRef(repeatMode)
  repeatRef.current = repeatMode
  const onTimeRef = useRef(onTimeUpdate)
  onTimeRef.current = onTimeUpdate

  const stopTicking = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = null
    onTimeRef.current?.(null)
  }, [])

  const disposeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    stopTicking()
  }, [stopTicking])

  // Stop when another verse starts playing
  useEffect(() => {
    if (isGlobalPlaying !== verseNumber && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setProgress(0)
      stopTicking()
    }
  }, [isGlobalPlaying, verseNumber, isPlaying, stopTicking])

  // Reset audio element when URL changes (e.g. reciter switch)
  useEffect(() => {
    disposeAudio()
    setIsPlaying(false)
    setPending(false)
    setProgress(0)
    setError(false)
  }, [audioUrl, disposeAudio])

  // Apply speed changes to a live element
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  // Cleanup on unmount
  useEffect(() => disposeAudio, [disposeAudio])

  const updateProgress = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused) {
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
      onTimeRef.current?.(audio.currentTime)
      animFrameRef.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  const handleToggle = useCallback(async () => {
    if (pending) return
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      stopTicking()
      return
    }

    setError(false)

    // Notify parent that this verse is now playing
    onPlay(verseNumber)

    if (!audioRef.current) {
      // Prefer a timed source when one is available; fall back to the plain URL
      let url = audioUrlRef.current
      if (resolveSourceRef.current) {
        setPending(true)
        try {
          const src = await resolveSourceRef.current()
          if (src?.url) url = src.url
        } catch { /* fall back */ }
        setPending(false)
      }

      const audio = new Audio(url)
      audio.playbackRate = playbackRate
      audioRef.current = audio
      playsRef.current = 0

      audio.addEventListener('ended', () => {
        playsRef.current += 1
        const mode = repeatRef.current
        const again = mode === 'inf' || (mode !== 'off' && playsRef.current < Number(mode))
        if (again && audioRef.current === audio) {
          audio.currentTime = 0
          audio.play().then(() => {
            animFrameRef.current = requestAnimationFrame(updateProgress)
          }).catch(() => {})
          return
        }
        setIsPlaying(false)
        setProgress(0)
        stopTicking()
      })
      audio.addEventListener('error', () => {
        setIsPlaying(false)
        setProgress(0)
        setError(true)
        stopTicking()
        audioRef.current = null
      })
    }

    try {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0
        playsRef.current = 0
      }
      await audioRef.current.play()
      setIsPlaying(true)
      animFrameRef.current = requestAnimationFrame(updateProgress)
    } catch (err) {
      setIsPlaying(false)
      setError(true)
      audioRef.current = null
    }
  }, [isPlaying, pending, verseNumber, onPlay, updateProgress, stopTicking, playbackRate])

  return (
    <div className={`verse-audio ${isPlaying ? 'playing' : ''} ${error ? 'audio-error' : ''}`}>
      <button
        className={`audio-btn ${isPlaying ? 'active' : ''} ${error ? 'error' : ''} ${pending ? 'pending' : ''}`}
        onClick={handleToggle}
        title={error ? 'Audio unavailable — tap to retry' : isPlaying ? 'Pause' : 'Play verse audio'}
        aria-label={error ? `Retry verse ${verseNumber}` : isPlaying ? `Pause verse ${verseNumber}` : `Play verse ${verseNumber}`}
      >
        {error ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ) : isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <polygon points="6,3 20,12 6,21"/>
          </svg>
        )}
      </button>
      {isPlaying && (
        <div className="audio-progress-bar">
          <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
})

AudioPlayer.displayName = 'AudioPlayer'
export default AudioPlayer
