# Lucide React Icons Usage Guide

This project uses [Lucide React](https://lucide.dev/) for consistent iconography throughout the application.

## Installation

Lucide React is already installed as a dependency. You can import icons directly:

```tsx
import { Play, Pause, Settings, X, Search } from 'lucide-react'
```

## Usage Examples

### Basic Icons

```tsx
import { Heart, Star, User } from 'lucide-react'

function MyComponent() {
  return (
    <div>
      <Heart size={24} color="red" />
      <Star size={20} color="gold" />
      <User size={16} />
    </div>
  )
}
```

### Icons in Buttons

```tsx
import { Play, Settings, Info } from 'lucide-react'

function Toolbar() {
  return (
    <div className="button-group">
      <button className="btn-primary">
        <Play size={16} />
        Play
      </button>
      <button className="btn-secondary">
        <Settings size={16} />
        Settings
      </button>
      <button className="btn-info">
        <Info size={16} />
        Help
      </button>
    </div>
  )
}
```

### Common Icons Used in This Project

- `X` - Close buttons
- `Search` - Search inputs
- `Lightbulb` - Tips and help text
- `Edit` - Edit actions
- `Trash2` - Delete actions
- `Plus` - Add actions
- `RotateCcw` - Reset actions
- `Play` - Play/start actions
- `Pause` - Pause actions
- `Settings` - Settings/configuration
- `Info` - Information/help

## Icon Properties

All Lucide icons support these props:

- `size`: Icon size in pixels (default: 24)
- `color`: Icon color (can be hex, rgb, or color name)
- `strokeWidth`: Stroke width (default: 2)
- `className`: CSS class for styling

## Styling Icons

Icons inherit color from their parent, but you can override with the `color` prop:

```tsx
// Inherits from parent
<Heart />

// Custom color
<Heart color="#ff0000" />

// Custom size
<Heart size={32} />

// Custom stroke width
<Heart strokeWidth={1} />
```

## Available Icons

Lucide React provides 1000+ icons. Browse the full catalog at [lucide.dev/icons](https://lucide.dev/icons) or search for specific icons using their icon finder.

## Best Practices

1. **Consistent sizing**: Use standard sizes (16px for small, 20px for medium, 24px for large)
2. **Semantic usage**: Choose icons that clearly represent their function
3. **Accessibility**: Always provide `aria-label` or `title` for interactive icons
4. **Color contrast**: Ensure icons meet WCAG color contrast requirements
5. **Consistent styling**: Use CSS classes rather than inline styles when possible
