/**
 * @fileoverview Header section for the Context Pane
 * @author @darianrosebrook
 */

import React from 'react'
import { MoreHorizontal, Copy, RotateCcw, Eye } from 'lucide-react'

interface ContextInfo {
  type: string
  name: string
  id: string
  description: string
}

interface HeaderSectionProps {
  contextInfo: ContextInfo
  activeTab: 'design' | 'animate' | 'triggers'
  onTabChange: (tab: 'design' | 'animate' | 'triggers') => void
  onQuickAction: (action: string) => void
}

export function HeaderSection({
  contextInfo,
  activeTab,
  onTabChange,
  onQuickAction,
}: HeaderSectionProps) {
  const handleQuickAction = (action: string) => {
    onQuickAction(action)
  }

  return (
    <div className="context-header">
      {/* Context Information */}
      <div className="context-info">
        <div className="context-type">{contextInfo.type}</div>
        <div className="context-name">{contextInfo.name}</div>
        {contextInfo.id && (
          <div className="context-id">ID: {contextInfo.id}</div>
        )}
        <div className="context-description">{contextInfo.description}</div>
      </div>

      {/* Tab Navigation */}
      <div className="context-tabs">
        <button
          className={`context-tab ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => onTabChange('design')}
        >
          Design
        </button>
        <button
          className={`context-tab ${activeTab === 'animate' ? 'active' : ''}`}
          onClick={() => onTabChange('animate')}
        >
          Animate
        </button>
        <button
          className={`context-tab ${activeTab === 'triggers' ? 'active' : ''}`}
          onClick={() => onTabChange('triggers')}
        >
          Triggers
        </button>
      </div>

      {/* Quick Actions */}
      <div className="context-actions">
        <button
          className="quick-action-btn"
          title="Copy properties"
          onClick={() => handleQuickAction('copy')}
        >
          <Copy size={16} />
        </button>
        <button
          className="quick-action-btn"
          title="Reset to defaults"
          onClick={() => handleQuickAction('reset')}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="quick-action-btn"
          title="Toggle visibility"
          onClick={() => handleQuickAction('visibility')}
        >
          <Eye size={16} />
        </button>
        <button
          className="quick-action-btn"
          title="More options"
          onClick={() => handleQuickAction('more')}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
