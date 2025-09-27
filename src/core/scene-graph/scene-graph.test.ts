import { describe, it, expect } from 'vitest'
import { SceneGraph } from './scene-graph'
import { createTransformNode } from './nodes/transform-node'
import {
  createRectangleNode,
  createCircleNode,
  createPathNode,
  ShapeType,
} from './nodes/shape-node'
import { NodeType, InterpolationMode } from '@/types'
import { describe, it, expect, beforeEach } from 'vitest'

describe('SceneGraph', () => {
  let sceneGraph: SceneGraph

  beforeEach(() => {
    sceneGraph = new SceneGraph()
  })

  it('should initialize with empty scene graph', () => {
    expect(sceneGraph.getAllNodes()).toHaveLength(0)
    expect(sceneGraph.getRootNodes()).toHaveLength(0)
    expect(sceneGraph.getDirtyNodes()).toHaveLength(0)
  })

  it('should add root nodes successfully', () => {
    const transformNode = createTransformNode('transform-1', 'Root Transform')

    const result = sceneGraph.addNode(transformNode)
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('transform-1')

    expect(sceneGraph.getAllNodes()).toHaveLength(1)
    expect(sceneGraph.getRootNodes()).toHaveLength(1)
  })

  it('should add child nodes to parents', () => {
    const parentNode = createTransformNode('parent', 'Parent')
    const childNode = createTransformNode('child', 'Child')

    sceneGraph.addNode(parentNode)
    const result = sceneGraph.addNode(childNode, 'parent')

    expect(result.success).toBe(true)
    expect(sceneGraph.getAllNodes()).toHaveLength(2)

    const parent = sceneGraph.getNode('parent')
    expect(parent.success).toBe(true)
    expect(parent.data?.children).toHaveLength(1)
    expect(parent.data?.children[0].id).toBe('child')
  })

  it('should fail to add nodes with duplicate IDs', () => {
    const node1 = createTransformNode('duplicate', 'Node 1')
    const node2 = createTransformNode('duplicate', 'Node 2')

    sceneGraph.addNode(node1)
    const result = sceneGraph.addNode(node2)

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('NODE_ALREADY_EXISTS')
  })

  it('should fail to add child to non-existent parent', () => {
    const childNode = createTransformNode('child', 'Child')
    const result = sceneGraph.addNode(childNode, 'non-existent-parent')

    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('PARENT_NOT_FOUND')
  })

  it('should remove nodes successfully', () => {
    const node = createTransformNode('to-remove', 'To Remove')
    sceneGraph.addNode(node)

    const removeResult = sceneGraph.removeNode('to-remove')
    expect(removeResult.success).toBe(true)

    const getResult = sceneGraph.getNode('to-remove')
    expect(getResult.success).toBe(false)
    expect(getResult.error?.code).toBe('NODE_NOT_FOUND')
  })

  it('should update node properties', () => {
    const node = createTransformNode('to-update', 'To Update')
    sceneGraph.addNode(node)

    const updateResult = sceneGraph.updateNodeProperties('to-update', {
      position: { x: 10, y: 20, z: 0 },
    })

    expect(updateResult.success).toBe(true)
    expect(updateResult.data?.properties.position.x).toBe(10)
  })

  it('should evaluate scene at specific time', () => {
    const node = createTransformNode('eval-test', 'Eval Test')
    sceneGraph.addNode(node)

    const context = {
      time: 1.0,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      devicePixelRatio: 1.0,
      globalProperties: {},
    }

    const evalResult = sceneGraph.evaluate(1.0, context)
    expect(evalResult.success).toBe(true)
    expect(Array.isArray(evalResult.data)).toBe(true)
  })

  it('should track dirty nodes', () => {
    const node = createTransformNode('dirty-test', 'Dirty Test')
    sceneGraph.addNode(node)

    expect(sceneGraph.getDirtyNodes()).toContain('dirty-test')

    sceneGraph.clearDirtyFlags()
    expect(sceneGraph.getDirtyNodes()).toHaveLength(0)
  })
})

describe('TransformNode', () => {
  it('should create transform nodes with defaults', () => {
    const node = createTransformNode('transform-test', 'Transform Test')

    expect(node.id).toBe('transform-test')
    expect(node.name).toBe('Transform Test')
    expect(node.type).toBe(NodeType.Transform)
    expect(node.properties.position.x).toBe(0)
    expect(node.properties.position.y).toBe(0)
    expect(node.properties.position.z).toBe(0)
  })

  it('should create transform nodes with custom properties', () => {
    const node = createTransformNode('custom-transform', 'Custom Transform', {
      position: { x: 100, y: 200, z: 0 },
      scale: { x: 2, y: 2, z: 1 },
    })

    expect(node.properties.position.x).toBe(100)
    expect(node.properties.position.y).toBe(200)
    expect(node.properties.scale.x).toBe(2)
  })

  it('should evaluate transform at specific time', () => {
    const node = createTransformNode('eval-transform', 'Eval Transform')

    const context = {
      time: 1.0,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      devicePixelRatio: 1.0,
      globalProperties: {},
    }

    const result = node.evaluate(1.0, context)
    expect(result.success).toBe(true)
    expect(result.data?.position.x).toBe(0)
    expect(result.data?.position.y).toBe(0)
    expect(result.data?.position.z).toBe(0)
    expect(result.data?.scale.x).toBe(1)
    expect(result.data?.opacity).toBe(1.0)
  })

  it('should support immutable updates', () => {
    const originalNode = createTransformNode('immutable-test', 'Immutable Test')
    const updatedNode = originalNode.withProperties({
      position: { x: 50, y: 50, z: 0 },
    })

    expect(originalNode.id).toBe(updatedNode.id)
    expect(originalNode.properties.position.x).toBe(0)
    expect(updatedNode.properties.position.x).toBe(50)
  })
})

describe('ShapeNode', () => {
  it('should create rectangle shapes', () => {
    const shape = createRectangleNode('rect-test', 'Rectangle Test', 200, 100)

    expect(shape.id).toBe('rect-test')
    expect(shape.name).toBe('Rectangle Test')
    expect(shape.type).toBe(NodeType.Shape)
    expect(shape.properties.shapeType).toBe(ShapeType.Rectangle)
    expect(shape.properties.size.width).toBe(200)
    expect(shape.properties.size.height).toBe(100)
  })

  it('should create circle shapes', () => {
    const shape = createCircleNode('circle-test', 'Circle Test', 75)

    expect(shape.properties.shapeType).toBe(ShapeType.Circle)
    expect(shape.properties.size.width).toBe(150) // 75 * 2
    expect(shape.properties.size.height).toBe(150)
  })

  it('should create path shapes', () => {
    const pathData = 'M 0 0 L 100 0 L 100 100 L 0 100 Z'
    const shape = createPathNode('path-test', 'Path Test', pathData)

    expect(shape.properties.shapeType).toBe(ShapeType.Path)
    expect(shape.properties.pathData).toBe(pathData)
  })

  it('should evaluate shape properties', () => {
    const shape = createRectangleNode('eval-shape', 'Eval Shape')

    const context = {
      time: 0.0,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      devicePixelRatio: 1.0,
      globalProperties: {},
    }

    const result = shape.evaluate(0.0, context)
    expect(result.success).toBe(true)
    expect(result.data?.shapeType).toBe(ShapeType.Rectangle)
    expect(result.data?.size.width).toBe(100)
    expect(result.data?.fillColor.r).toBe(255)
  })
})

describe('Scene Graph Integration', () => {
  let sceneGraph: SceneGraph

  beforeEach(() => {
    sceneGraph = new SceneGraph()
  })

  it('should handle complex node hierarchies', () => {
    const rootTransform = createTransformNode('root', 'Root')
    const childShape = createRectangleNode('child-shape', 'Child Shape')
    const grandchildTransform = createTransformNode('grandchild', 'Grandchild')

    sceneGraph.addNode(rootTransform)
    sceneGraph.addNode(childShape, 'root')
    sceneGraph.addNode(grandchildTransform, 'child-shape')

    expect(sceneGraph.getAllNodes()).toHaveLength(3)
    expect(sceneGraph.getRootNodes()).toHaveLength(1)

    const root = sceneGraph.getNode('root')
    expect(root.success).toBe(true)
    expect(root.data?.children).toHaveLength(1)
  })

  it('should mark descendants as dirty when parent changes', () => {
    const parent = createTransformNode('parent', 'Parent')
    const child = createRectangleNode('child', 'Child')

    sceneGraph.addNode(parent)
    sceneGraph.addNode(child, 'parent')

    expect(sceneGraph.getDirtyNodes()).toContain('parent')
    expect(sceneGraph.getDirtyNodes()).toContain('child')

    sceneGraph.clearDirtyFlags()
    sceneGraph.updateNodeProperties('parent', {
      position: { x: 10, y: 10, z: 0 },
    })

    expect(sceneGraph.getDirtyNodes()).toContain('parent')
    expect(sceneGraph.getDirtyNodes()).toContain('child')
  })
})
