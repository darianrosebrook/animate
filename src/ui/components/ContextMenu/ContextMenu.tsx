import React, { useEffect, useRef } from 'react'
import './ContextMenu.css'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  separator?: boolean
  children?: ContextMenuItem[]
  action?: () => void
}

export interface ContextMenuProps {
  items: ContextMenuItem[]
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  onItemSelect?: (item: ContextMenuItem) => void
  className?: string
}

export function ContextMenu({
  items,
  isOpen,
  position,
  onClose,
  onItemSelect,
  className = '',
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return

    if (item.action) {
      item.action()
    }

    if (onItemSelect) {
      onItemSelect(item)
    }

    onClose()
  }

  const renderMenuItem = (
    item: ContextMenuItem,
    depth = 0
  ): React.ReactNode => {
    if (item.separator) {
      return <div key={item.id} className="context-menu-separator" />
    }

    return (
      <div
        key={item.id}
        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${depth > 0 ? 'nested' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => handleItemClick(item)}
      >
        <div className="context-menu-item-content">
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          <span className="context-menu-label">{item.label}</span>
          {item.children && item.children.length > 0 && (
            <span className="context-menu-arrow">▶</span>
          )}
        </div>

        {item.children && item.children.length > 0 && (
          <div className="context-menu-submenu">
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // Calculate menu position to keep it within viewport bounds
  const menuStyle = {
    left: position.x,
    top: position.y,
  }

  // Adjust position if menu would go off screen
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (position.x + rect.width > viewportWidth) {
      menuStyle.left = viewportWidth - rect.width
    }

    if (position.y + rect.height > viewportHeight) {
      menuStyle.top = viewportHeight - rect.height
    }
  }

  return (
    <div
      ref={menuRef}
      className={`context-menu ${className}`}
      style={menuStyle}
      role="menu"
    >
      <div className="context-menu-content">
        {items.map((item) => renderMenuItem(item))}
      </div>
    </div>
  )
}

