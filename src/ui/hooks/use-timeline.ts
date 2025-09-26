import { useState, useCallback, useEffect } from 'react'
import { TimelineState, TimelineTrack, TimelineKeyframe } from '@/ui/timeline'

const initialTimelineState: TimelineState = {
  currentTime: 0,
  duration: 10,
  frameRate: 30,
  isPlaying: false,
  zoom: 1,
  playbackSpeed: 1,
  loopEnabled: false,
  tracks: [
    {
      id: 'position-track',
      name: 'Position',
      type: 'position',
      targetNodeId: 'red-rect',
      propertyPath: 'position',
      keyframes: [
        {
          id: 'keyframe-1',
          time: 0,
          value: { x: 100, y: 100 },
          interpolation: 'linear',
          selected: false,
        },
        {
          id: 'keyframe-2',
          time: 2,
          value: { x: 300, y: 200 },
          interpolation: 'linear',
          selected: false,
        },
        {
          id: 'keyframe-3',
          time: 5,
          value: { x: 500, y: 100 },
          interpolation: 'linear',
          selected: false,
        },
      ],
      enabled: true,
      locked: false,
      color: '#ff6b35',
      expanded: true,
    },
    {
      id: 'opacity-track',
      name: 'Opacity',
      type: 'opacity',
      targetNodeId: 'red-rect',
      propertyPath: 'opacity',
      keyframes: [
        {
          id: 'keyframe-4',
          time: 0,
          value: 1,
          interpolation: 'linear',
          selected: false,
        },
        {
          id: 'keyframe-5',
          time: 3,
          value: 0.5,
          interpolation: 'linear',
          selected: false,
        },
        {
          id: 'keyframe-6',
          time: 6,
          value: 0,
          interpolation: 'linear',
          selected: false,
        },
      ],
      enabled: true,
      locked: false,
      color: '#4ade80',
      expanded: true,
    },
  ],
  selectedKeyframes: new Set(),
  clipboard: [],
}

export function useTimeline() {
  const [timeline, setTimeline] = useState<TimelineState>(initialTimelineState)

  const updateTimeline = useCallback((updates: Partial<TimelineState>) => {
    setTimeline((prev) => ({ ...prev, ...updates }))
  }, [])

  const selectKeyframes = useCallback((keyframeIds: string[]) => {
    setTimeline((prev) => ({
      ...prev,
      selectedKeyframes: new Set(keyframeIds),
    }))
  }, [])

  const moveKeyframe = useCallback((keyframeId: string, newTime: number) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        keyframes: track.keyframes.map((keyframe) =>
          keyframe.id === keyframeId
            ? {
                ...keyframe,
                time: Math.max(0, Math.min(prev.duration, newTime)),
              }
            : keyframe
        ),
      })),
    }))
  }, [])

  const addKeyframe = useCallback(
    (trackId: string, time: number, value: any) => {
      const newKeyframe: TimelineKeyframe = {
        id: `keyframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        time: Math.max(0, Math.min(timeline.duration, time)),
        value,
        interpolation: 'linear',
        selected: false,
      }

      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) =>
          track.id === trackId
            ? {
                ...track,
                keyframes: [...track.keyframes, newKeyframe].sort(
                  (a, b) => a.time - b.time
                ),
              }
            : track
        ),
      }))
    },
    [timeline.duration]
  )

  const deleteKeyframes = useCallback((keyframeIds: string[]) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        keyframes: track.keyframes.filter(
          (keyframe) => !keyframeIds.includes(keyframe.id)
        ),
      })),
      selectedKeyframes: new Set(),
    }))
  }, [])

  const toggleTrack = useCallback((trackId: string, enabled: boolean) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) =>
        track.id === trackId ? { ...track, enabled } : track
      ),
    }))
  }, [])

  const expandTrack = useCallback((trackId: string, expanded: boolean) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) =>
        track.id === trackId ? { ...track, expanded } : track
      ),
    }))
  }, [])

  const setPlaybackSpeed = useCallback((speed: number) => {
    setTimeline((prev) => ({
      ...prev,
      playbackSpeed: speed,
    }))
  }, [])

  const toggleLoop = useCallback(() => {
    setTimeline((prev) => ({
      ...prev,
      loopEnabled: !prev.loopEnabled,
    }))
  }, [])

  // Note: Auto-advance is now handled in App.tsx to coordinate with rendering

  return {
    timeline,
    updateTimeline,
    selectKeyframes,
    moveKeyframe,
    addKeyframe,
    deleteKeyframes,
    toggleTrack,
    expandTrack,
    setPlaybackSpeed,
    toggleLoop,
  }
}
