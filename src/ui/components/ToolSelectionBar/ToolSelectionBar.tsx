/**
 * @fileoverview Tool Selection Bar component for animation canvas
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  MousePointer,
  Move,
  Hand,
  Scaling,
  RotateCw,
  PenTool,
  Square,
  Type,
  Image,
  Sparkles,
  Scan,
  Camera,
  ZoomIn,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  ToolType,
  ToolCategory,
  ToolGroup,
  ToolSelectionState,
  UIMode,
  KeyboardShortcut,
} from '@/types'
import './ToolSelectionBar.css'

export interface ToolSelectionBarProps {
  mode: UIMode
  activeToolId: string | null
  onToolChange: (toolId: string) => void
  onKeyboardShortcut?: (shortcut: KeyboardShortcut) => void
  className?: string
}

export function ToolSelectionBar({
  mode,
  activeToolId,
  onToolChange,
  onKeyboardShortcut,
  className = '',
}: ToolSelectionBarProps) {
  const [state, setState] = useState<ToolSelectionState>({
    activeToolId,
    dropdownOpen: false,
    dropdownToolGroup: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Define tool groups based on mode
  const toolGroups: ToolGroup[] = [
    {
      id: 'selection',
      name: 'Selection',
      hasDropdown: true,
      primaryTool: {
        id: 'select',
        type: ToolType.Select,
        name: 'Select',
        icon: 'MousePointer',
        shortcut: 'V',
        description: 'Select and manipulate layers',
        category: ToolCategory.Selection,
        defaultActive: true,
      },
      tools: [
        {
          id: 'select',
          type: ToolType.Select,
          name: 'Select',
          icon: 'MousePointer',
          shortcut: 'V',
          description: 'Select and manipulate layers',
          category: ToolCategory.Selection,
          defaultActive: true,
        },
        {
          id: 'move',
          type: ToolType.Move,
          name: 'Move',
          icon: 'Move',
          shortcut: 'V',
          description: 'Move layers in 2D space',
          category: ToolCategory.Transform,
        },
      ],
    },
    {
      id: 'view',
      name: 'View',
      hasDropdown: true,
      primaryTool: {
        id: 'hand',
        type: ToolType.Hand,
        name: 'Hand',
        icon: 'Hand',
        shortcut: 'H',
        description: 'Pan and navigate the canvas',
        category: ToolCategory.View,
      },
      tools: [
        {
          id: 'hand',
          type: ToolType.Hand,
          name: 'Hand',
          icon: 'Hand',
          shortcut: 'H',
          description: 'Pan and navigate the canvas',
          category: ToolCategory.View,
        },
        {
          id: 'zoom',
          type: ToolType.Zoom,
          name: 'Zoom',
          icon: 'ZoomIn',
          shortcut: 'Z',
          description: 'Zoom in and out of the canvas',
          category: ToolCategory.View,
        },
      ],
    },
    {
      id: 'transform',
      name: 'Transform',
      hasDropdown: true,
      primaryTool: {
        id: 'scale',
        type: ToolType.Scale,
        name: 'Scale',
        icon: 'Scaling',
        shortcut: 'K',
        description: 'Scale layers proportionally',
        category: ToolCategory.Transform,
      },
      tools: [
        {
          id: 'scale',
          type: ToolType.Scale,
          name: 'Scale',
          icon: 'Scaling',
          shortcut: 'K',
          description: 'Scale layers proportionally',
          category: ToolCategory.Transform,
        },
        {
          id: 'rotate',
          type: ToolType.Rotate,
          name: 'Rotate',
          icon: 'RotateCw',
          shortcut: 'R',
          description: 'Rotate layers around anchor point',
          category: ToolCategory.Transform,
        },
      ],
    },
    {
      id: 'drawing',
      name: 'Drawing',
      hasDropdown: false,
      tools: [
        {
          id: 'pen',
          type: ToolType.Pen,
          name: 'Pen',
          icon: 'PenTool',
          shortcut: 'P',
          description: 'Draw custom paths and shapes',
          category: ToolCategory.Drawing,
        },
      ],
    },
    {
      id: 'content',
      name: 'Content',
      hasDropdown: true,
      primaryTool: {
        id: 'shape',
        type: ToolType.Shape,
        name: 'Shape',
        icon: 'Square',
        shortcut: 'S',
        description: 'Create geometric shapes',
        category: ToolCategory.Content,
      },
      tools: [
        {
          id: 'shape',
          type: ToolType.Shape,
          name: 'Shape',
          icon: 'Square',
          shortcut: 'S',
          description: 'Create geometric shapes',
          category: ToolCategory.Content,
        },
        {
          id: 'text',
          type: ToolType.Text,
          name: 'Text',
          icon: 'Type',
          shortcut: 'T',
          description: 'Add text layers',
          category: ToolCategory.Content,
        },
        {
          id: 'image',
          type: ToolType.Image,
          name: 'Image',
          icon: 'Image',
          shortcut: 'I',
          description: 'Import and place images',
          category: ToolCategory.Content,
        },
      ],
    },
    {
      id: 'effects',
      name: 'Effects',
      hasDropdown: false,
      tools: [
        {
          id: 'effect',
          type: ToolType.Effect,
          name: 'Effect',
          icon: 'Sparkles',
          shortcut: 'E',
          description: 'Apply visual effects',
          category: ToolCategory.Effects,
        },
      ],
    },
  ]

  // Filter tools based on current mode
  const visibleToolGroups = toolGroups.filter((group) => {
    // In design mode, show all tools
    if (mode === UIMode.Design) return true

    // In animation mode, only show selection, view, and transform tools
    if (mode === UIMode.Animate) {
      return ['selection', 'view', 'transform'].includes(group.id)
    }

    return true
  })

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      MousePointer,
      Move,
      Hand,
      Scaling,
      RotateCw,
      PenTool,
      Square,
      Type,
      Image,
      Sparkles,
      Scan,
      Camera,
      ZoomIn,
    }
    return iconMap[iconName] || MousePointer
  }

  const handleToolClick = useCallback(
    (toolId: string, event?: React.MouseEvent) => {
      event?.stopPropagation()
      const newActiveToolId = state.activeToolId === toolId ? null : toolId
      setState((prev) => ({
        ...prev,
        activeToolId: newActiveToolId,
        dropdownOpen: false,
        dropdownToolGroup: null,
      }))
      onToolChange(newActiveToolId || toolId)
    },
    [state.activeToolId, onToolChange]
  )

  const handleToolGroupClick = useCallback(
    (groupId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      const group = toolGroups.find((g) => g.id === groupId)
      if (!group?.hasDropdown) return

      setState((prev) => ({
        ...prev,
        dropdownOpen: prev.dropdownToolGroup === groupId ? false : true,
        dropdownToolGroup: prev.dropdownToolGroup === groupId ? null : groupId,
      }))
    },
    [toolGroups]
  )

  const handleDropdownToolClick = useCallback(
    (toolId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      handleToolClick(toolId, event)
    },
    [handleToolClick]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Handle keyboard shortcuts
      const shortcuts: Record<string, string> = {
        v: 'select',
        h: 'hand',
        k: 'scale',
        r: 'rotate',
        p: 'pen',
        s: 'shape',
        t: 'text',
        i: 'image',
        e: 'effect',
        z: 'zoom',
      }

      const key = event.key.toLowerCase()
      if (shortcuts[key] && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const toolId = shortcuts[key]
        handleToolClick(toolId)

        // Notify parent about shortcut usage
        if (onKeyboardShortcut) {
          onKeyboardShortcut({
            key,
            description: `Switch to ${toolId} tool`,
            category: 'tools' as any,
          })
        }
      }

      // Handle dropdown navigation
      if (state.dropdownOpen) {
        const currentGroup = toolGroups.find(
          (g) => g.id === state.dropdownToolGroup
        )
        if (!currentGroup) return

        const currentIndex = currentGroup.tools.findIndex(
          (tool) => tool.id === state.activeToolId
        )

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            const nextIndex = (currentIndex + 1) % currentGroup.tools.length
            handleToolClick(currentGroup.tools[nextIndex].id)
            break
          case 'ArrowUp':
            event.preventDefault()
            const prevIndex =
              currentIndex <= 0
                ? currentGroup.tools.length - 1
                : currentIndex - 1
            handleToolClick(currentGroup.tools[prevIndex].id)
            break
          case 'Enter':
          case ' ':
            event.preventDefault()
            if (state.activeToolId) {
              handleToolClick(state.activeToolId)
            }
            break
          case 'Escape':
            event.preventDefault()
            setState((prev) => ({
              ...prev,
              dropdownOpen: false,
              dropdownToolGroup: null,
            }))
            break
        }
      }
    },
    [state, toolGroups, handleToolClick, onKeyboardShortcut]
  )

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setState((prev) => ({
        ...prev,
        dropdownOpen: false,
        dropdownToolGroup: null,
      }))
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleKeyDown, handleClickOutside])

  useEffect(() => {
    setState((prev) => ({ ...prev, activeToolId }))
  }, [activeToolId])

  return (
    <div
      ref={containerRef}
      className={`tool-selection-bar ${className}`}
      role="toolbar"
      aria-label="Animation tools"
    >
      {visibleToolGroups.map((group) => {
        const primaryTool = group.primaryTool || group.tools[0]
        const IconComponent = getIconComponent(primaryTool.icon)
        const isActive = state.activeToolId === primaryTool.id
        const isDropdownOpen =
          state.dropdownOpen && state.dropdownToolGroup === group.id

        return (
          <div key={group.id} className="tool-group">
            <button
              className={`tool-button ${isActive ? 'active' : ''} ${
                group.hasDropdown ? 'has-dropdown' : ''
              }`}
              onClick={(e) => handleToolClick(primaryTool.id, e)}
              onMouseDown={(e) => {
                if (group.hasDropdown) {
                  e.preventDefault()
                  handleToolGroupClick(group.id, e)
                }
              }}
              title={`${primaryTool.name} (${primaryTool.shortcut}) - ${primaryTool.description}`}
              aria-pressed={isActive}
              aria-haspopup={group.hasDropdown}
              aria-expanded={isDropdownOpen}
            >
              <IconComponent size={20} />
              {group.hasDropdown && (
                <div className="dropdown-indicator">
                  {isDropdownOpen ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </div>
              )}
            </button>

            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="tool-dropdown"
                role="menu"
                aria-label={`${group.name} tools`}
              >
                {group.tools.map((tool) => {
                  const ToolIconComponent = getIconComponent(tool.icon)
                  const toolIsActive = state.activeToolId === tool.id

                  return (
                    <button
                      key={tool.id}
                      className={`dropdown-tool ${toolIsActive ? 'active' : ''}`}
                      onClick={(e) => handleDropdownToolClick(tool.id, e)}
                      role="menuitem"
                      aria-pressed={toolIsActive}
                      title={`${tool.name} (${tool.shortcut}) - ${tool.description}`}
                    >
                      <ToolIconComponent size={16} />
                      <span className="tool-name">{tool.name}</span>
                      {tool.shortcut && (
                        <span className="tool-shortcut">{tool.shortcut}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
