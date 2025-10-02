/**
 * @fileoverview Text Node Implementation
 * @description Scene graph nodes for text layers with animation support
 * @author @darianrosebrook
 */

import { Result, Time } from '@/types'
import { SceneNode, NodeType, PropertyMap, PropertyValue } from '../scene-graph-types'
import {
  TextLayer,
  TextNode as ITextNode,
  TextAnimation,
  TextAnimationType,
  TextEditorState,
  TextAnimationState,
  TextMeasurement,
  TextAlign,
  TextBaseline,
  FontStyle,
  FontWeight,
} from './text-types'
import { TextRenderer } from './text-renderer'

/**
 * Text node implementation
 */
export class TextNode implements SceneNode, ITextNode {
  readonly id: string
  readonly name: string
  readonly type: NodeType = NodeType.Text

  // Text-specific properties
  layer: TextLayer
  bounds: { x: number; y: number; width: number; height: number }
  animations: TextAnimation[]
  animationState: TextAnimationState
  editorState?: TextEditorState

  // Standard node properties
  properties: PropertyMap
  children: SceneNode[] = []
  parent?: SceneNode

  // Text rendering
  private textRenderer: TextRenderer | null = null
  private measurement: TextMeasurement | null = null

  constructor(
    id: string,
    name: string,
    textLayer: TextLayer,
    animations: TextAnimation[] = [],
    properties: PropertyMap = {}
  ) {
    this.id = id
    this.name = name
    this.layer = textLayer
    this.animations = animations
    this.properties = { ...properties }

    // Initialize animation state
    this.animationState = {
      isAnimating: false,
      currentTime: 0,
      totalDuration: this.calculateTotalAnimationDuration(),
      visibleCharacters: 0,
      characterStates: new Map(),
    }

    // Calculate initial bounds
    this.measurement = this.measureText()
    this.bounds = {
      x: textLayer.position.x,
      y: textLayer.position.y,
      width: this.measurement.width,
      height: this.measurement.height,
    }

    // Initialize editor state if needed
    if (textLayer.animateOnLoad) {
      this.editorState = {
        text: textLayer.text,
        selection: null,
        cursorPosition: 0,
        isEditing: false,
        undoStack: [],
        redoStack: [],
      }
    }
  }

  /**
   * Create a simple text node
   */
  static createSimple(
    id: string,
    name: string,
    text: string,
    position: { x: number; y: number },
    fontSize: number = 48,
    fontFamily: string = 'Arial'
  ): TextNode {
    const textLayer: TextLayer = {
      text,
      font: {
        family: fontFamily,
        style: FontStyle.NORMAL,
        weight: FontWeight.NORMAL,
        size: fontSize,
        lineHeight: 1.2,
        letterSpacing: 0,
        wordSpacing: 0,
      },
      position,
      align: TextAlign.LEFT,
      baseline: TextBaseline.ALPHABETIC,
      fill: {
        type: 'solid' as const,
        color: { r: 255, g: 255, b: 255, a: 1 },
      },
      stroke: null,
      shadow: null,
      decoration: 'none' as const,
      transform: 'none' as const,
      animateOnLoad: false,
      typeOnSpeed: 10, // characters per second
      tracking: 0,
      kerning: 0,
    }

    return new TextNode(id, name, textLayer)
  }

  /**
   * Update text content
   */
  updateText(text: string): void {
    this.layer.text = text
    this.measurement = this.measureText()
    this.bounds = {
      x: this.layer.position.x,
      y: this.layer.position.y,
      width: this.measurement.width,
      height: this.measurement.height,
    }
  }

  /**
   * Update text layer properties
   */
  updateTextLayer(updates: Partial<TextLayer>): void {
    this.layer = { ...this.layer, ...updates }

    // Recalculate bounds if layout properties changed
    if (updates.font || updates.text || updates.align) {
      this.measurement = this.measureText()
      this.bounds = {
        x: this.layer.position.x,
        y: this.layer.position.y,
        width: this.measurement.width,
        height: this.measurement.height,
      }
    }
  }

  /**
   * Update node properties
   */
  updateProperties(updates: PropertyMap): void {
    this.properties = { ...this.properties, ...updates }
  }

  /**
   * Get property value at specific time
   */
  getPropertyAtTime(propertyName: string, time: Time): PropertyValue {
    // Check for keyframes first
    const keyframes = this.getKeyframes(propertyName)
    if (keyframes.length > 0) {
      return this.interpolateKeyframe(keyframes, time)
    }

    // Return current value or property value
    return this.properties[propertyName]
  }

  /**
   * Set keyframe for property
   */
  setKeyframe(propertyName: string, time: Time, value: PropertyValue): void {
    // Store keyframes in a simple array for now
    // In a full implementation, this would integrate with the timeline system
    const keyframes = this.getKeyframes(propertyName)
    const existingIndex = keyframes.findIndex(kf => kf.time === time)

    if (existingIndex >= 0) {
      keyframes[existingIndex] = { time, value }
    } else {
      keyframes.push({ time, value })
      keyframes.sort((a, b) => a.time - b.time)
    }
  }

  /**
   * Remove keyframe
   */
  removeKeyframe(propertyName: string, time: Time): void {
    const keyframes = this.getKeyframes(propertyName)
    const index = keyframes.findIndex(kf => kf.time === time)
    if (index >= 0) {
      keyframes.splice(index, 1)
    }
  }

  /**
   * Get all keyframes for a property
   */
  getKeyframes(propertyName: string): any[] {
    // For now, store keyframes in a simple Map
    // In a full implementation, this would integrate with the timeline keyframes
    return [] // Placeholder
  }

  /**
   * Measure text layout
   */
  private measureText(): TextMeasurement {
    // For now, use a simple measurement
    // In a full implementation, this would use the TextRenderer
    const lineHeight = this.layer.font.size * this.layer.font.lineHeight
    const lines = this.layer.text.split('\n').length

    return {
      width: this.layer.text.length * this.layer.font.size * 0.6, // Approximate character width
      height: lines * lineHeight,
      lineCount: lines,
      characterCount: this.layer.text.length,
      wordCount: this.layer.text.split(/\s+/).filter(word => word.length > 0).length,
      layout: {
        lines: [],
        totalWidth: 0,
        totalHeight: 0,
        characterData: [],
        wordCount: 0,
        characterCount: 0,
      },
    }
  }

  /**
   * Calculate total animation duration
   */
  private calculateTotalAnimationDuration(): number {
    let maxDuration = 0

    this.animations.forEach(animation => {
      const duration = animation.duration + animation.delay
      if (duration > maxDuration) {
        maxDuration = duration
      }
    })

    return maxDuration
  }

  /**
   * Interpolate between keyframes
   */
  private interpolateKeyframe(keyframes: any[], time: Time): PropertyValue {
    if (keyframes.length === 0) {
      return this.properties[Object.keys(this.properties)[0]] || 0
    }

    if (keyframes.length === 1) {
      return keyframes[0].value
    }

    // Find the two keyframes to interpolate between
    let beforeIndex = -1
    let afterIndex = -1

    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        beforeIndex = i
      }
      if (keyframes[i].time >= time && afterIndex === -1) {
        afterIndex = i
        break
      }
    }

    if (beforeIndex === -1) {
      return keyframes[0].value
    }

    if (afterIndex === -1) {
      return keyframes[keyframes.length - 1].value
    }

    const before = keyframes[beforeIndex]
    const after = keyframes[afterIndex]

    if (before.time === after.time) {
      return before.value
    }

    // Linear interpolation for now
    const t = (time - before.time) / (after.time - before.time)
    return this.lerp(before.value, after.value, t)
  }

  /**
   * Linear interpolation between two values
   */
  private lerp(a: any, b: any, t: number): PropertyValue {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t
    }

    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      if ('x' in a && 'y' in a && 'x' in b && 'y' in b) {
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        }
      }
    }

    return a
  }

  /**
   * Update animation state
   */
  updateAnimation(time: Time): void {
    this.animationState.currentTime = time

    // Update character animation states based on current animations
    this.animations.forEach(animation => {
      if (animation.type === TextAnimationType.TYPE_ON) {
        this.updateTypeOnAnimation(animation)
      }
    })
  }

  /**
   * Update type-on animation state
   */
  private updateTypeOnAnimation(animation: TextAnimation): void {
    const elapsed = this.animationState.currentTime - animation.delay
    if (elapsed < 0) return

    const charactersPerMs = animation.duration > 0 ? this.layer.text.length / animation.duration : 0
    const visibleChars = Math.min(
      this.layer.text.length,
      Math.floor(elapsed * charactersPerMs * this.layer.typeOnSpeed)
    )

    this.animationState.visibleCharacters = visibleChars

    // Update character states
    for (let i = 0; i < this.layer.text.length; i++) {
      const progress = Math.max(0, Math.min(1, i / visibleChars))

      this.animationState.characterStates.set(i, {
        opacity: progress,
        scale: 0.8 + progress * 0.2, // Scale from 80% to 100%
        offset: { x: 0, y: 0 },
        rotation: 0,
      })
    }
  }

  /**
   * Get character state at specific time
   */
  getCharacterState(characterIndex: number, time: Time): {
    opacity: number
    scale: number
    offset: { x: number; y: number }
    rotation: number
  } {
    // Update animation state for current time
    this.updateAnimation(time)

    return this.animationState.characterStates.get(characterIndex) || {
      opacity: 1,
      scale: 1,
      offset: { x: 0, y: 0 },
      rotation: 0,
    }
  }

  /**
   * Check if point is inside text bounds
   */
  containsPoint(point: { x: number; y: number }): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    )
  }

  /**
   * Get text bounds
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return this.bounds
  }

  /**
   * Clone the text node
   */
  clone(newId?: string): TextNode {
    const cloned = new TextNode(
      newId || `${this.id}_clone`,
      `${this.name} Copy`,
      { ...this.layer },
      [...this.animations],
      { ...this.properties }
    )

    cloned.animationState = { ...this.animationState }
    if (this.editorState) {
      cloned.editorState = { ...this.editorState }
    }

    return cloned
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      layer: this.layer,
      bounds: this.bounds,
      properties: this.properties,
      animations: this.animations,
      animationState: this.animationState,
      editorState: this.editorState,
    }
  }

  /**
   * Create text node from JSON
   */
  static fromJSON(data: any): TextNode {
    const node = new TextNode(
      data.id,
      data.name,
      data.layer,
      data.animations || [],
      data.properties || {}
    )

    node.bounds = data.bounds
    node.animationState = data.animationState

    if (data.editorState) {
      node.editorState = data.editorState
    }

    return node
  }

  /**
   * Set text renderer for GPU rendering
   */
  setTextRenderer(renderer: TextRenderer): void {
    this.textRenderer = renderer
  }

  /**
   * Get current measurement
   */
  getMeasurement(): TextMeasurement | null {
    return this.measurement
  }

  /**
   * Get current animation state
   */
  getAnimationState(): TextAnimationState {
    return this.animationState
  }

  /**
   * Add animation to text
   */
  addAnimation(animation: TextAnimation): void {
    this.animations.push(animation)
    this.animationState.totalDuration = this.calculateTotalAnimationDuration()
  }

  /**
   * Remove animation from text
   */
  removeAnimation(animationType: TextAnimationType): void {
    this.animations = this.animations.filter(anim => anim.type !== animationType)
    this.animationState.totalDuration = this.calculateTotalAnimationDuration()
  }

  /**
   * Start text animation
   */
  startAnimation(): void {
    this.animationState.isAnimating = true
    this.animationState.currentTime = 0
  }

  /**
   * Stop text animation
   */
  stopAnimation(): void {
    this.animationState.isAnimating = false
  }

  /**
   * Pause text animation
   */
  pauseAnimation(): void {
    this.animationState.isAnimating = false
  }

  /**
   * Resume text animation
   */
  resumeAnimation(): void {
    this.animationState.isAnimating = true
  }
}

/**
 * Text node factory for creating different text types
 */
export class TextNodeFactory {
  /**
   * Create title text
   */
  static createTitle(
    id: string,
    text: string,
    position: { x: number; y: number }
  ): TextNode {
    return TextNode.createSimple(id, 'Title', text, position, 72, 'Arial Black')
  }

  /**
   * Create subtitle text
   */
  static createSubtitle(
    id: string,
    text: string,
    position: { x: number; y: number }
  ): TextNode {
    return TextNode.createSimple(id, 'Subtitle', text, position, 48, 'Arial')
  }

  /**
   * Create body text
   */
  static createBody(
    id: string,
    text: string,
    position: { x: number; y: number }
  ): TextNode {
    return TextNode.createSimple(id, 'Body Text', text, position, 24, 'Arial')
  }

  /**
   * Create caption text
   */
  static createCaption(
    id: string,
    text: string,
    position: { x: number; y: number }
  ): TextNode {
    return TextNode.createSimple(id, 'Caption', text, position, 16, 'Arial')
  }

  /**
   * Create animated title with type-on effect
   */
  static createAnimatedTitle(
    id: string,
    text: string,
    position: { x: number; y: number }
  ): TextNode {
    const textNode = TextNode.createTitle(id, text, position)

    // Add type-on animation
    textNode.addAnimation({
      type: TextAnimationType.TYPE_ON,
      duration: text.length * 100, // 100ms per character
      delay: 0,
      easing: 'ease-out',
      stagger: 50, // 50ms between characters
    })

    textNode.layer.animateOnLoad = true
    textNode.layer.typeOnSpeed = 10 // characters per second

    return textNode
  }

  /**
   * Create text from preset
   */
  static createFromPreset(presetId: string): TextNode {
    // TODO: Implement text presets
    return TextNode.createBody(`text_${Date.now()}`, 'Preset Text', { x: 0, y: 0 })
  }
}

