/**
 * @fileoverview Search and Filter component for the Left Panel
 * @author @darianrosebrook
 */

import React from 'react'
import { Search, X } from 'lucide-react'
import { NodeType } from '@/types'

interface FilterState {
  showHidden: boolean
  showLocked: boolean
  typeFilters: Set<NodeType>
  statusFilters: Set<string>
}

interface SearchFilterProps {
  query: string
  onQueryChange: (query: string) => void
  filterState: FilterState
  onFilterChange: (filterState: FilterState) => void
}

export function SearchFilter({
  query,
  onQueryChange,
  filterState,
  onFilterChange,
}: SearchFilterProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }

  const handleQueryClear = () => {
    onQueryChange('')
  }

  const toggleTypeFilter = (type: NodeType) => {
    const newTypeFilters = new Set(filterState.typeFilters)
    if (newTypeFilters.has(type)) {
      newTypeFilters.delete(type)
    } else {
      newTypeFilters.add(type)
    }

    onFilterChange({
      ...filterState,
      typeFilters: newTypeFilters,
    })
  }

  const _toggleStatusFilter = (status: string) => {
    const newStatusFilters = new Set(filterState.statusFilters)
    if (newStatusFilters.has(status)) {
      newStatusFilters.delete(status)
    } else {
      newStatusFilters.add(status)
    }

    onFilterChange({
      ...filterState,
      statusFilters: newStatusFilters,
    })
  }

  const clearAllFilters = () => {
    onFilterChange({
      showHidden: false,
      showLocked: false,
      typeFilters: new Set(),
      statusFilters: new Set(),
    })
  }

  const hasActiveFilters =
    filterState.typeFilters.size > 0 ||
    filterState.statusFilters.size > 0 ||
    filterState.showHidden ||
    filterState.showLocked

  return (
    <div className="search-filter">
      {/* Search Input */}
      <div className="search-input-container">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Search scenes and layers..."
          value={query}
          onChange={handleQueryChange}
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={handleQueryClear}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        {/* Type Filters */}
        <div className="filter-group">
          <label className="filter-label">Types:</label>
          <div className="filter-buttons">
            {Object.values(NodeType).map((type) => (
              <button
                key={type}
                className={`filter-btn ${filterState.typeFilters.has(type) ? 'active' : ''}`}
                onClick={() => toggleTypeFilter(type)}
                title={`Filter by ${type} layers`}
              >
                {getTypeIcon(type)}
                <span className="filter-btn-text">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterState.showHidden ? 'active' : ''}`}
              onClick={() =>
                onFilterChange({
                  ...filterState,
                  showHidden: !filterState.showHidden,
                })
              }
              title="Show hidden items"
            >
              <span className="filter-btn-text">Hidden</span>
            </button>
            <button
              className={`filter-btn ${filterState.showLocked ? 'active' : ''}`}
              onClick={() =>
                onFilterChange({
                  ...filterState,
                  showLocked: !filterState.showLocked,
                })
              }
              title="Show locked items"
            >
              <span className="filter-btn-text">Locked</span>
            </button>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

function getTypeIcon(type: NodeType): React.ReactNode {
  switch (type) {
    case NodeType.Text:
      return 'T'
    case NodeType.Shape:
      return '□'
    case NodeType.Media:
      return '🖼'
    case NodeType.Group:
      return '📁'
    case NodeType.Effect:
      return '✨'
    case NodeType.Camera:
      return '📷'
    default:
      return '•'
  }
}
