/**
 * @fileoverview Curve Editor Popover for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { X } from 'lucide-react'

interface CurveEditorPopoverProps {
  target: HTMLElement
  initialCurve: any
  onCurveChange: (curve: any) => void
  onClose: () => void
}

export function CurveEditorPopover({
  target,
  initialCurve,
  onCurveChange,
  onClose,
}: CurveEditorPopoverProps) {
  return (
    <div className="popover-overlay" onClick={onClose}>
      <div
        className="curve-editor-popover"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: target.getBoundingClientRect().right + 10,
          top: target.getBoundingClientRect().top,
          zIndex: 1001,
        }}
      >
        <div className="popover-header">
          <h4>Curve Editor</h4>
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="popover-content">
          <div className="curve-canvas">
            <svg width="200" height="150" viewBox="0 0 200 150">
              {/* Grid */}
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="200" height="150" fill="url(#grid)" />

              {/* Bezier curve */}
              <path
                d="M 20 130 C 60 50, 140 50, 180 20"
                stroke="rgba(0,122,204,0.8)"
                strokeWidth="2"
                fill="none"
              />

              {/* Control points */}
              <circle cx="60" cy="50" r="4" fill="#007acc" />
              <circle cx="140" cy="50" r="4" fill="#007acc" />

              {/* Control lines */}
              <line
                x1="20"
                y1="130"
                x2="60"
                y2="50"
                stroke="rgba(0,122,204,0.4)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1="180"
                y1="20"
                x2="140"
                y2="50"
                stroke="rgba(0,122,204,0.4)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            </svg>
          </div>

          <div className="curve-controls">
            <div className="control-group">
              <label>Preset</label>
              <select defaultValue="ease-out">
                <option value="linear">Linear</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
                <option value="bounce">Bounce</option>
                <option value="elastic">Elastic</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="control-group">
              <label>P1 X</label>
              <input
                type="number"
                defaultValue={0.4}
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div className="control-group">
              <label>P1 Y</label>
              <input
                type="number"
                defaultValue={0}
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div className="control-group">
              <label>P2 X</label>
              <input
                type="number"
                defaultValue={0.6}
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div className="control-group">
              <label>P2 Y</label>
              <input
                type="number"
                defaultValue={1}
                step="0.01"
                min="0"
                max="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
