/**
 * @fileoverview Text Creation and Editing Tools
 * @description Interactive tools for creating and editing text layers
 * @author @darianrosebrook
 */

import React, { useState, useCallback, useRef } from 'react'
import { Tool, ToolType } from '@/types'
import { TextNode, TextNodeFactory } from '@/core/scene-graph/text/text-node'
import {
  Point2D,
  TextAlign,
  TextBaseline,
  FontStyle,
  FontWeight,
} from '@/core/scene-graph/text/text-types'

/**
 * Text tool state
 */
export interface TextToolState {
  isCreating: boolean
  currentText: TextNode | null
  startPoint: Point2D | null
  previewText: TextNode | null
  editMode: boolean
  selectedText: TextNode | null
}

/**
 * Text tool props
 */
export interface TextToolProps {
  activeTool: ToolType | null
  onTextCreate: (text: TextNode) => void
  onTextUpdate: (textId: string, updates: any) => void
  zoom: number
  pan: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
  selectedTextNodes: TextNode[]
}

/**
 * Text creation tool component
 */
export function TextCreationTool({
  activeTool,
  onTextCreate,
  onTextUpdate,
  zoom,
  pan,
  snapToGrid,
  gridSize,
  selectedTextNodes,
}: TextToolProps) {
  const [toolState, setToolState] = useState<TextToolState>({
    isCreating: false,
    currentText: null,
    startPoint: null,
    previewText: null,
    editMode: false,
    selectedText: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Handle mouse down for text creation
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool !== ToolType.Text) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const canvasPoint = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      }

      // Snap to grid if enabled
      const snappedPoint = snapToGrid
        ? {
            x: Math.round(canvasPoint.x / gridSize) * gridSize,
            y: Math.round(canvasPoint.y / gridSize) * gridSize,
          }
        : canvasPoint

      // Create initial text node
      const textNode = TextNode.createSimple(
        `text_${Date.now()}`,
        'Text',
        'Click to edit text',
        snappedPoint,
        48,
        'Arial'
      )

      setToolState((prev) => ({
        ...prev,
        isCreating: true,
        currentText: textNode,
        startPoint: snappedPoint,
        previewText: textNode,
        editMode: true,
        selectedText: textNode,
      }))
    },
    [activeTool, zoom, pan, snapToGrid, gridSize]
  )

  /**
   * Handle mouse move during text creation
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (
        !toolState.isCreating ||
        !toolState.currentText ||
        !containerRef.current
      )
        return

      const rect = containerRef.current.getBoundingClientRect()
      const canvasPoint = {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      }

      // Update text position
      const updatedText = new TextNode(
        toolState.currentText.id,
        toolState.currentText.name,
        {
          ...toolState.currentText.layer,
          position: canvasPoint,
        },
        toolState.currentText.animations,
        toolState.currentText.properties
      )

      setToolState((prev) => ({
        ...prev,
        previewText: updatedText,
      }))
    },
    [toolState, zoom, pan]
  )

  /**
   * Handle mouse up to complete text creation
   */
  const handleMouseUp = useCallback(() => {
    if (!toolState.isCreating || !toolState.previewText) return

    // Finalize the text
    onTextCreate(toolState.previewText)

    // Reset tool state but keep edit mode for immediate editing
    setToolState((prev) => ({
      ...prev,
      isCreating: false,
      currentText: null,
      startPoint: null,
      previewText: null,
    }))
  }, [toolState, onTextCreate])

  /**
   * Handle text editing
   */
  const handleTextEdit = useCallback(
    (textId: string, newText: string) => {
      onTextUpdate(textId, { text: newText })
    },
    [onTextUpdate]
  )

  /**
   * Handle text selection
   */
  const handleTextSelect = useCallback((textNode: TextNode) => {
    setToolState((prev) => ({
      ...prev,
      selectedText: textNode,
      editMode: true,
    }))
  }, [])

  return (
    <div
      ref={containerRef}
      className="text-tool-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: activeTool === ToolType.Text ? 'auto' : 'none',
        cursor: activeTool === ToolType.Text ? 'text' : 'default',
      }}
    >
      {/* Text preview during creation */}
      {toolState.previewText && (
        <TextPreview textNode={toolState.previewText} />
      )}

      {/* Existing text nodes */}
      {selectedTextNodes.map((textNode) => (
        <TextNodeComponent
          key={textNode.id}
          textNode={textNode}
          isSelected={toolState.selectedText?.id === textNode.id}
          isEditing={
            toolState.editMode && toolState.selectedText?.id === textNode.id
          }
          onSelect={() => handleTextSelect(textNode)}
          onEdit={(newText) => handleTextEdit(textNode.id, newText)}
          zoom={zoom}
          pan={pan}
        />
      ))}
    </div>
  )
}

/**
 * Text preview component for showing text being created
 */
function TextPreview({ textNode }: { textNode: TextNode }) {
  const { layer } = textNode
  const style = {
    position: 'absolute' as const,
    left: layer.position.x,
    top: layer.position.y,
    fontSize: `${layer.font.size}px`,
    fontFamily: layer.font.family,
    fontWeight: layer.font.weight,
    fontStyle: layer.font.style,
    color: `rgba(${layer.fill.type === 'solid' ? layer.fill.color.r : 255}, ${
      layer.fill.type === 'solid' ? layer.fill.color.g : 255
    }, ${layer.fill.type === 'solid' ? layer.fill.color.b : 255}, ${
      layer.fill.type === 'solid' ? layer.fill.color.a : 1
    })`,
    textAlign: layer.align,
    whiteSpace: 'pre-wrap',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  return <div style={style}>{layer.text}</div>
}

/**
 * Text node component for displaying and editing text
 */
function TextNodeComponent({
  textNode,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  zoom,
  pan,
}: {
  textNode: TextNode
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onEdit: (newText: string) => void
  zoom: number
  pan: { x: number; y: number }
}) {
  const { layer } = textNode
  const [editText, setEditText] = useState(layer.text)

  const handleDoubleClick = useCallback(() => {
    onSelect()
  }, [onSelect])

  const handleEditSubmit = useCallback(() => {
    if (editText !== layer.text) {
      onEdit(editText)
    }
  }, [editText, layer.text, onEdit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditSubmit()
      } else if (e.key === 'Escape') {
        setEditText(layer.text) // Reset to original text
      }
    },
    [handleEditSubmit, layer.text]
  )

  const style = {
    position: 'absolute' as const,
    left: layer.position.x,
    top: layer.position.y,
    fontSize: `${layer.font.size}px`,
    fontFamily: layer.font.family,
    fontWeight: layer.font.weight,
    fontStyle: layer.font.style,
    color: `rgba(${layer.fill.type === 'solid' ? layer.fill.color.r : 255}, ${
      layer.fill.type === 'solid' ? layer.fill.color.g : 255
    }, ${layer.fill.type === 'solid' ? layer.fill.color.b : 255}, ${
      layer.fill.type === 'solid' ? layer.fill.color.a : 1
    })`,
    textAlign: layer.align,
    whiteSpace: 'pre-wrap',
    cursor: 'pointer',
    border: isSelected ? '2px solid #007acc' : 'none',
    padding: isSelected ? '4px' : '0',
    borderRadius: '4px',
    backgroundColor: isSelected ? 'rgba(0, 122, 204, 0.1)' : 'transparent',
  }

  if (isEditing) {
    return (
      <textarea
        style={{
          ...style,
          border: '2px solid #007acc',
          backgroundColor: 'rgba(0, 122, 204, 0.1)',
          resize: 'none',
          outline: 'none',
          font: 'inherit',
        }}
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={handleEditSubmit}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    )
  }

  return (
    <div style={style} onClick={onSelect} onDoubleClick={handleDoubleClick}>
      {layer.text}
    </div>
  )
}

/**
 * Text tool palette component
 */
export function TextToolPalette({
  activeTool,
  onToolSelect,
}: {
  activeTool: ToolType | null
  onToolSelect: (tool: ToolType) => void
}) {
  const textTools = [
    {
      type: ToolType.Text,
      name: 'Text',
      icon: 'T',
      shortcut: 'T',
    },
  ]

  return (
    <div className="text-tool-palette">
      {textTools.map((tool) => (
        <button
          key={tool.type}
          className={`text-tool-button ${activeTool === tool.type ? 'active' : ''}`}
          onClick={() => onToolSelect(tool.type)}
          title={`${tool.name} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  )
}

/**
 * Text properties panel for editing text attributes
 */
export function TextPropertiesPanel({
  selectedText,
  onTextUpdate,
}: {
  selectedText: TextNode | null
  onTextUpdate: (updates: any) => void
}) {
  if (!selectedText) {
    return <div className="text-properties-empty">No text selected</div>
  }

  const { layer } = selectedText

  const handlePropertyChange = (property: string, value: any) => {
    onTextUpdate({ [property]: value })
  }

  return (
    <div className="text-properties-panel">
      <h3>Text Properties</h3>

      <div className="property-group">
        <label>Text Content</label>
        <textarea
          value={layer.text}
          onChange={(e) => handlePropertyChange('text', e.target.value)}
          rows={3}
          placeholder="Enter text content..."
        />
      </div>

      <div className="property-group">
        <label>Font Family</label>
        <select
          value={layer.font.family}
          onChange={(e) => handlePropertyChange('font.family', e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      <div className="property-group">
        <label>Font Size</label>
        <input
          type="number"
          value={layer.font.size}
          onChange={(e) =>
            handlePropertyChange('font.size', parseFloat(e.target.value))
          }
          min="8"
          max="200"
          step="1"
        />
      </div>

      <div className="property-group">
        <label>Font Weight</label>
        <select
          value={layer.font.weight}
          onChange={(e) => handlePropertyChange('font.weight', e.target.value)}
        >
          <option value="100">Thin</option>
          <option value="200">Extra Light</option>
          <option value="300">Light</option>
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semi Bold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
          <option value="900">Black</option>
        </select>
      </div>

      <div className="property-group">
        <label>Font Style</label>
        <select
          value={layer.font.style}
          onChange={(e) => handlePropertyChange('font.style', e.target.value)}
        >
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
          <option value="oblique">Oblique</option>
        </select>
      </div>

      <div className="property-group">
        <label>Text Color</label>
        <div className="color-inputs">
          <input
            type="number"
            value={layer.fill.type === 'solid' ? layer.fill.color.r : 255}
            onChange={(e) =>
              handlePropertyChange('fill.color.r', parseInt(e.target.value))
            }
            min="0"
            max="255"
            placeholder="R"
          />
          <input
            type="number"
            value={layer.fill.type === 'solid' ? layer.fill.color.g : 255}
            onChange={(e) =>
              handlePropertyChange('fill.color.g', parseInt(e.target.value))
            }
            min="0"
            max="255"
            placeholder="G"
          />
          <input
            type="number"
            value={layer.fill.type === 'solid' ? layer.fill.color.b : 255}
            onChange={(e) =>
              handlePropertyChange('fill.color.b', parseInt(e.target.value))
            }
            min="0"
            max="255"
            placeholder="B"
          />
          <input
            type="number"
            value={layer.fill.type === 'solid' ? layer.fill.color.a || 1 : 1}
            onChange={(e) =>
              handlePropertyChange('fill.color.a', parseFloat(e.target.value))
            }
            min="0"
            max="1"
            step="0.01"
            placeholder="A"
          />
        </div>
      </div>

      <div className="property-group">
        <label>Text Alignment</label>
        <select
          value={layer.align}
          onChange={(e) => handlePropertyChange('align', e.target.value)}
        >
          <option value={TextAlign.LEFT}>Left</option>
          <option value={TextAlign.CENTER}>Center</option>
          <option value={TextAlign.RIGHT}>Right</option>
          <option value={TextAlign.JUSTIFY}>Justify</option>
        </select>
      </div>

      <div className="property-group">
        <label>Position</label>
        <div className="position-inputs">
          <input
            type="number"
            value={layer.position.x}
            onChange={(e) =>
              handlePropertyChange('position.x', parseFloat(e.target.value))
            }
            step="0.1"
          />
          <input
            type="number"
            value={layer.position.y}
            onChange={(e) =>
              handlePropertyChange('position.y', parseFloat(e.target.value))
            }
            step="0.1"
          />
        </div>
      </div>

      <div className="property-group">
        <label>Animation</label>
        <div className="animation-controls">
          <label>
            <input
              type="checkbox"
              checked={layer.animateOnLoad}
              onChange={(e) =>
                handlePropertyChange('animateOnLoad', e.target.checked)
              }
            />
            Animate on load
          </label>
          <label>
            Type-on Speed:
            <input
              type="number"
              value={layer.typeOnSpeed}
              onChange={(e) =>
                handlePropertyChange('typeOnSpeed', parseFloat(e.target.value))
              }
              min="1"
              max="50"
              step="1"
            />
            chars/sec
          </label>
        </div>
      </div>
    </div>
  )
}

/**
 * Text preset browser for quick text creation
 */
export function TextPresetBrowser({
  onTextSelect,
}: {
  onTextSelect: (textNode: TextNode) => void
}) {
  const presets = [
    {
      id: 'title-preset',
      name: 'Title',
      category: 'heading',
      textNode: TextNodeFactory.createAnimatedTitle(
        'preset-title',
        'Your Title Here',
        { x: 0, y: 0 }
      ),
    },
    {
      id: 'subtitle-preset',
      name: 'Subtitle',
      category: 'heading',
      textNode: TextNodeFactory.createSubtitle(
        'preset-subtitle',
        'Your Subtitle Here',
        { x: 0, y: 80 }
      ),
    },
    {
      id: 'body-preset',
      name: 'Body Text',
      category: 'body',
      textNode: TextNodeFactory.createBody(
        'preset-body',
        'Your body text goes here...',
        { x: 0, y: 160 }
      ),
    },
    {
      id: 'caption-preset',
      name: 'Caption',
      category: 'caption',
      textNode: TextNodeFactory.createCaption(
        'preset-caption',
        'Caption text',
        { x: 0, y: 240 }
      ),
    },
  ]

  return (
    <div className="text-preset-browser">
      <h3>Text Presets</h3>
      <div className="preset-categories">
        {['heading', 'body', 'caption'].map((category) => (
          <div key={category} className="preset-category">
            <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div className="preset-grid">
              {presets
                .filter((preset) => preset.category === category)
                .map((preset) => (
                  <div
                    key={preset.id}
                    className="preset-item"
                    onClick={() => onTextSelect(preset.textNode)}
                  >
                    <div className="preset-preview">
                      {preset.textNode.layer.text}
                    </div>
                    <div className="preset-name">{preset.name}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Text animation controls
 */
export function TextAnimationControls({
  selectedText,
  onAnimationChange,
}: {
  selectedText: TextNode | null
  onAnimationChange: (animation: any) => void
}) {
  if (!selectedText) return null

  const { layer } = selectedText

  return (
    <div className="text-animation-controls">
      <h4>Text Animation</h4>

      <div className="animation-option">
        <label>
          <input
            type="checkbox"
            checked={layer.animateOnLoad}
            onChange={(e) =>
              onAnimationChange({ animateOnLoad: e.target.checked })
            }
          />
          Animate on Load
        </label>
      </div>

      {layer.animateOnLoad && (
        <div className="animation-settings">
          <div className="setting-group">
            <label>Type-on Speed:</label>
            <input
              type="range"
              min="1"
              max="50"
              value={layer.typeOnSpeed}
              onChange={(e) =>
                onAnimationChange({ typeOnSpeed: parseFloat(e.target.value) })
              }
            />
            <span>{layer.typeOnSpeed} chars/sec</span>
          </div>

          <div className="setting-group">
            <label>Animation Type:</label>
            <select
              value={selectedText.animations[0]?.type || 'type_on'}
              onChange={(e) =>
                onAnimationChange({
                  animations: [
                    {
                      type: e.target.value as any,
                      duration: 1000,
                      delay: 0,
                      easing: 'ease-out',
                    },
                  ],
                })
              }
            >
              <option value="type_on">Type On</option>
              <option value="fade_in">Fade In</option>
              <option value="slide_in">Slide In</option>
              <option value="scale_in">Scale In</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
