import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import './AudioPlayer.css'

// Per-verse audio player component
const AudioPlayer = memo(({ audioUrl, verseNumber, isGlobalPlaying, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const animFrameRef = useRef(null)

  // Stop when another verse starts playing
  useEffect(() => {
    if (isGlobalPlaying !== verseNumber && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setProgress(0)
    }
  }, [isGlobalPlaying, verseNumber, isPlaying])

  // Cleanup on unmount — remove event listeners to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load() // release network resources
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

    // Notify parent that this verse is now playing
    onPlay(verseNumber)

    if (!audioRef.current) {
      const audio = new Audio(audioUrl)
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
      })
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
      animFrameRef.current = requestAnimationFrame(updateProgress)
    } catch (err) {
      console.error('Audio play error:', err)
      setIsPlaying(false)
    }
  }, [isPlaying, audioUrl, verseNumber, onPlay, updateProgress])

  return (
    <div className={`verse-audio ${isPlaying ? 'playing' : ''}`}>
      <button
        className={`audio-btn ${isPlaying ? 'active' : ''}`}
        onClick={handleToggle}
        title={isPlaying ? 'Pause' : 'Play verse audio'}
        aria-label={isPlaying ? `Pause verse ${verseNumber}` : `Play verse ${verseNumber}`}
      >
        {isPlaying ? (
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
