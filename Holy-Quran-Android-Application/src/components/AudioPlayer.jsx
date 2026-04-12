import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import './AudioPlayer.css'

// Per-verse audio player component
const AudioPlayer = memo(({ audioUrl, verseNumber, isGlobalPlaying, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef(null)
  const animFrameRef = useRef(null)
  const audioUrlRef = useRef(audioUrl)
  audioUrlRef.current = audioUrl

  // Stop when another verse starts playing
  useEffect(() => {
    if (isGlobalPlaying !== verseNumber && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setProgress(0)
    }
  }, [isGlobalPlaying, verseNumber, isPlaying])

  // Reset audio element when URL changes (e.g. reciter switch)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
    setProgress(0)
    setDuration(0)
    setError(false)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [audioUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const updateProgress = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(pct)
      animFrameRef.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  const handleToggle = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    setError(false)

    // Notify parent that this verse is now playing
    onPlay(verseNumber)

    // Always use the latest URL from ref
    const url = audioUrlRef.current

    if (!audioRef.current) {
      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setProgress(0)
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      })
      audio.addEventListener('error', () => {
        setIsPlaying(false)
        setProgress(0)
        setError(true)
        audioRef.current = null
      })
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
      animFrameRef.current = requestAnimationFrame(updateProgress)
    } catch (err) {
      setIsPlaying(false)
      setError(true)
      audioRef.current = null
    }
  }, [isPlaying, verseNumber, onPlay, updateProgress])

  return (
    <div className={`verse-audio ${isPlaying ? 'playing' : ''} ${error ? 'audio-error' : ''}`}>
      <button
        className={`audio-btn ${isPlaying ? 'active' : ''} ${error ? 'error' : ''}`}
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
