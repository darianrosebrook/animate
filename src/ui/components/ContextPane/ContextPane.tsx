/**
 * @fileoverview Context Pane - Primary property editor for selected elements
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useMemo } from 'react'
import { UIMode, SceneNode, Scene, NodeType, Color } from '@/types'
import { HeaderSection } from './sections/HeaderSection'
import { PositionLayoutSection } from './sections/PositionLayoutSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { TypographySection } from './sections/TypographySection'
import { FillStrokeSection } from './sections/FillStrokeSection'
import { AnimationPropertiesSection } from './sections/AnimationPropertiesSection'
import { TriggersSection } from './sections/TriggersSection'
import { SceneSettingsSection } from './sections/SceneSettingsSection'
import { ColorPickerPopover } from './popovers/ColorPickerPopover'
import { GradientEditorPopover } from './popovers/GradientEditorPopover'
import { CurveEditorPopover } from './popovers/CurveEditorPopover'
import './ContextPane.css'

export interface ContextPaneProps {
  mode: UIMode
  currentScene: Scene | null
  selectedLayers: SceneNode[]
  onLayerUpdate: (layerId: string, updates: Partial<SceneNode>) => void
  onSceneUpdate: (updates: Partial<Scene>) => void
  className?: string
}

type PopoverType = 'color' | 'gradient' | 'curve' | null

interface PopoverState {
  type: PopoverType
  target: HTMLElement | null
  data?: any
}

export function ContextPane({
  mode,
  currentScene,
  selectedLayers,
  onLayerUpdate,
  onSceneUpdate,
  className = '',
}: ContextPaneProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'animate' | 'triggers'>(
    'design'
  )
  const [popover, setPopover] = useState<PopoverState>({
    type: null,
    target: null,
  })
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  )

  // Auto-switch to appropriate tab based on mode
  React.useEffect(() => {
    if (mode === UIMode.Design && activeTab !== 'design') {
      setActiveTab('design')
    } else if (mode === UIMode.Animate && activeTab !== 'animate') {
      setActiveTab('animate')
    }
  }, [mode, activeTab])

  // Determine context information
  const contextInfo = useMemo(() => {
    if (selectedLayers.length === 0) {
      return {
        type: 'scene',
        name: currentScene?.name || 'Scene',
        id: currentScene?.id || '',
        description: 'Scene properties and settings',
      }
    }

    if (selectedLayers.length === 1) {
      const layer = selectedLayers[0]
      return {
        type: layer.type,
        name: layer.name,
        id: layer.id,
        description: `${layer.type} layer properties`,
      }
    }

    return {
      type: 'multiple',
      name: `${selectedLayers.length} layers`,
      id: '',
      description: 'Multiple layer properties',
    }
  }, [selectedLayers, currentScene])

  const handleTabChange = useCallback(
    (tab: 'design' | 'animate' | 'triggers') => {
      setActiveTab(tab)
    },
    []
  )

  const handlePopoverOpen = useCallback(
    (type: PopoverType, target: HTMLElement, data?: any) => {
      setPopover({ type, target, data })
    },
    []
  )

  const handlePopoverClose = useCallback(() => {
    setPopover({ type: null, target: null })
  }, [])

  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  const renderPopover = () => {
    if (!popover.type || !popover.target) return null

    switch (popover.type) {
      case 'color':
        return (
          <ColorPickerPopover
            target={popover.target}
            initialColor={popover.data}
            onColorChange={(_color: Color) => {
              // Handle color change
              handlePopoverClose()
            }}
            onClose={handlePopoverClose}
          />
        )
      case 'gradient':
        return (
          <GradientEditorPopover
            target={popover.target}
            initialGradient={popover.data}
            onGradientChange={(_gradient: any) => {
              // Handle gradient change
              handlePopoverClose()
            }}
            onClose={handlePopoverClose}
          />
        )
      case 'curve':
        return (
          <CurveEditorPopover
            target={popover.target}
            initialCurve={popover.data}
            onCurveChange={(_curve: any) => {
              // Handle curve change
              handlePopoverClose()
            }}
            onClose={handlePopoverClose}
          />
        )
      default:
        return null
    }
  }

  const renderContent = () => {
    // No selection - show scene settings
    if (selectedLayers.length === 0) {
      return (
        <SceneSettingsSection
          scene={currentScene}
          onUpdate={onSceneUpdate}
          isCollapsed={collapsedSections.has('scene-settings')}
          onToggleCollapse={() => toggleSectionCollapse('scene-settings')}
        />
      )
    }

    // Multiple selection - show limited properties
    if (selectedLayers.length > 1) {
      return (
        <div className="multiple-selection-panel">
          <div className="properties-section">
            <div className="section-header">
              <h4>Multiple Selection</h4>
              <span className="selection-count">
                {selectedLayers.length} layers
              </span>
            </div>
            <p className="section-description">
              Select a single layer to edit all properties, or use the selection
              to apply changes to multiple layers.
            </p>
          </div>
        </div>
      )
    }

    const layer = selectedLayers[0]

    return (
      <>
        {/* Design Mode Content */}
        {activeTab === 'design' && (
          <>
            <PositionLayoutSection
              layer={layer}
              onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
              onPopoverOpen={handlePopoverOpen}
              isCollapsed={collapsedSections.has('position-layout')}
              onToggleCollapse={() => toggleSectionCollapse('position-layout')}
            />

            <AppearanceSection
              layer={layer}
              onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
              onPopoverOpen={handlePopoverOpen}
              isCollapsed={collapsedSections.has('appearance')}
              onToggleCollapse={() => toggleSectionCollapse('appearance')}
            />

            {layer.type === NodeType.Text && (
              <TypographySection
                layer={layer}
                onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
                isCollapsed={collapsedSections.has('typography')}
                onToggleCollapse={() => toggleSectionCollapse('typography')}
              />
            )}

            <FillStrokeSection
              layer={layer}
              onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
              onPopoverOpen={handlePopoverOpen}
              isCollapsed={collapsedSections.has('fill-stroke')}
              onToggleCollapse={() => toggleSectionCollapse('fill-stroke')}
            />
          </>
        )}

        {/* Animation Mode Content */}
        {activeTab === 'animate' && (
          <>
            <AnimationPropertiesSection
              layer={layer}
              onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
              onPopoverOpen={handlePopoverOpen}
              isCollapsed={collapsedSections.has('animation-properties')}
              onToggleCollapse={() =>
                toggleSectionCollapse('animation-properties')
              }
            />
          </>
        )}

        {/* Triggers Mode Content */}
        {activeTab === 'triggers' && (
          <TriggersSection
            layer={layer}
            scene={currentScene}
            onUpdate={(updates) => onLayerUpdate(layer.id, updates)}
            isCollapsed={collapsedSections.has('triggers')}
            onToggleCollapse={() => toggleSectionCollapse('triggers')}
          />
        )}
      </>
    )
  }

  return (
    <div className={`context-pane ${className}`}>
      <HeaderSection
        contextInfo={contextInfo}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onQuickAction={(action: string) => {
          console.log(`Quick action: ${action}`)
        }}
      />

      <div className="context-content">{renderContent()}</div>

      {renderPopover()}
    </div>
  )
}
