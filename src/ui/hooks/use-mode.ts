import { useState, useCallback } from 'react'
import { UIMode, ViewMode, Project, Scene, SceneNode } from '@/types'

const initialProject: Project = {
  id: 'project-1',
  name: 'Untitled',
  scenes: [
    {
      id: 'scene-1',
      name: 'Scene 1',
      layers: [],
      duration: 10,
      frameRate: 30,
    },
  ],
  currentSceneId: 'scene-1',
  mode: UIMode.Design,
  viewMode: ViewMode.SceneByScene,
  selectedLayerIds: [],
}

export function useMode() {
  const [project, setProject] = useState<Project>(initialProject)
  const [isPlaying, setIsPlaying] = useState(false)

  const setMode = useCallback((mode: UIMode) => {
    setProject((prev) => ({ ...prev, mode }))
  }, [])

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setProject((prev) => ({ ...prev, viewMode }))
  }, [])

  const setCurrentScene = useCallback((sceneId: string) => {
    setProject((prev) => ({ ...prev, currentSceneId: sceneId }))
  }, [])

  const addScene = useCallback(() => {
    const newScene = {
      id: `scene-${Date.now()}`,
      name: `Scene ${project.scenes.length + 1}`,
      layers: [],
      duration: 10,
      frameRate: 30,
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      currentSceneId: newScene.id,
    }))
  }, [project.scenes.length])

  const updateScene = useCallback(
    (sceneId: string, updates: Partial<Scene>) => {
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        ),
      }))
    },
    []
  )

  const setSelectedLayers = useCallback((layerIds: string[]) => {
    setProject((prev) => ({ ...prev, selectedLayerIds: layerIds }))
  }, [])

  const addLayer = useCallback((sceneId: string, layer: SceneNode) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, layers: [...scene.layers, layer] }
          : scene
      ),
    }))
  }, [])

  const updateLayer = useCallback(
    (sceneId: string, layerId: string, updates: Partial<SceneNode>) => {
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                layers: scene.layers.map((layer) =>
                  layer.id === layerId ? { ...layer, ...updates } : layer
                ),
              }
            : scene
        ),
      }))
    },
    []
  )

  const removeLayer = useCallback((sceneId: string, layerId: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              layers: scene.layers.filter((layer) => layer.id !== layerId),
            }
          : scene
      ),
      selectedLayerIds: prev.selectedLayerIds.filter((id) => id !== layerId),
    }))
  }, [])

  const reorderLayers = useCallback(
    (sceneId: string, fromIndex: number, toIndex: number) => {
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                layers: arrayMove(scene.layers, fromIndex, toIndex),
              }
            : scene
        ),
      }))
    },
    []
  )

  const currentScene =
    project.scenes.find((scene) => scene.id === project.currentSceneId) || null
  const selectedLayers =
    currentScene?.layers.filter((layer) =>
      project.selectedLayerIds.includes(layer.id)
    ) || []

  return {
    project,
    currentScene,
    selectedLayers,
    isPlaying,
    setMode,
    setViewMode,
    setCurrentScene,
    addScene,
    updateScene,
    setSelectedLayers,
    addLayer,
    updateLayer,
    removeLayer,
    reorderLayers,
    setIsPlaying,
  }
}

// Helper function to move array elements
function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array]
  const element = newArray.splice(fromIndex, 1)[0]
  newArray.splice(toIndex, 0, element)
  return newArray
}
