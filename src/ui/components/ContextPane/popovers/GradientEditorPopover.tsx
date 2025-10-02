/**
 * @fileoverview Gradient Editor Popover for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { X } from 'lucide-react'

interface GradientEditorPopoverProps {
  target: HTMLElement
  initialGradient: any
  onGradientChange: (gradient: any) => void
  onClose: () => void
}

export function GradientEditorPopover({
  target,
  _initialGradient,
  _onGradientChange,
  onClose,
}: GradientEditorPopoverProps) {
  return (
    <div className="popover-overlay" onClick={onClose}>
      <div
        className="gradient-editor-popover"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: target.getBoundingClientRect().right + 10,
          top: target.getBoundingClientRect().top,
          zIndex: 1001,
        }}
      >
        <div className="popover-header">
          <h4>Gradient Editor</h4>
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popover-content">
          <div className="gradient-preview">
            <div className="gradient-strip"></div>
          </div>

          <div className="gradient-controls">
            <div className="control-group">
              <label>Type</label>
              <select defaultValue="linear">
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
                <option value="conical">Conical</option>
              </select>
            </div>

            <div className="control-group">
              <label>Angle</label>
              <input type="number" defaultValue={0} step="1" />
              <span className="unit">°</span>
            </div>

            <div className="color-stops">
              <div className="color-stop">
                <div className="stop-preview"></div>
                <input type="number" defaultValue={0} step="1" />
                <span className="unit">%</span>
              </div>
              <div className="color-stop">
                <div className="stop-preview"></div>
                <input type="number" defaultValue={100} step="1" />
                <span className="unit">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
