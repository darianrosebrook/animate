import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasSelection } from '@/ui/hooks/useCanvasSelection'
import { SceneNode } from '@/types'

function createSceneNode(overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: overrides.id ?? 'node-1',
    name: overrides.name ?? 'Node 1',
    type: overrides.type ?? 'shape',
    properties: overrides.properties ?? {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      visible: true,
      opacity: 1,
      width: 100,
      height: 100,
    },
    children: overrides.children ?? [],
  }
}

describe('useCanvasSelection', () => {
  it('initializes selection state from selected layers', () => {
    const nodes = [
      createSceneNode({ id: 'node-1' }),
      createSceneNode({ id: 'node-2' }),
    ]

    const onLayerSelect = vi.fn()

    const { result } = renderHook(() =>
      useCanvasSelection({
        selectedLayers: nodes,
        scene: { layers: nodes },
        zoom: 1,
        pan: { x: 0, y: 0 },
        onLayerSelect,
        onSelectionChange: undefined,
      })
    )

    expect(result.current.selectionState.selectedNodeIds.size).toBe(2)
    expect(result.current.selectionState.selectedNodeIds.has('node-1')).toBe(
      true
    )
    expect(result.current.selectionState.selectedNodeIds.has('node-2')).toBe(
      true
    )

    expect(onLayerSelect).not.toHaveBeenCalled()
  })
})
