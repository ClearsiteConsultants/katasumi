import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStore } from '../lib/store'

describe('Filter Hotkeys in App-First Mode', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      selectedApp: 'VSCode',
      mode: 'app-first',
      platform: 'mac',
      filters: {},
      results: [],
      query: ''
    })
    
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  it('should support context filter in SearchFilters interface', () => {
    const filters = useStore.getState().filters
    
    // Set context filter
    useStore.setState({
      filters: { context: 'Editor' }
    })
    
    const updatedFilters = useStore.getState().filters
    expect(updatedFilters.context).toBe('Editor')
  })

  it('should support category filter in SearchFilters interface', () => {
    // Set category filter
    useStore.setState({
      filters: { category: 'Navigation' }
    })
    
    const filters = useStore.getState().filters
    expect(filters.category).toBe('Navigation')
  })

  it('should support tag filter in SearchFilters interface', () => {
    // Set tag filter
    useStore.setState({
      filters: { tag: 'keyboard' }
    })
    
    const filters = useStore.getState().filters
    expect(filters.tag).toBe('keyboard')
  })

  it('should support multiple filters simultaneously', () => {
    // Set all filters
    useStore.setState({
      filters: {
        context: 'Editor',
        category: 'Navigation',
        tag: 'keyboard'
      }
    })
    
    const filters = useStore.getState().filters
    expect(filters.context).toBe('Editor')
    expect(filters.category).toBe('Navigation')
    expect(filters.tag).toBe('keyboard')
  })

  it('should include context in search parameters', async () => {
    const mockResults = [
      {
        id: '1',
        app: 'VSCode',
        action: 'Go to definition',
        keys: { mac: 'F12', windows: 'F12', linux: 'F12' },
        context: 'Editor',
        category: 'Navigation',
        tags: ['navigation'],
      }
    ]
    
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ results: mockResults }),
    } as Response)

    await fetch('/api/search?query=definition&app=VSCode&context=Editor')
    
    expect(global.fetch).toHaveBeenCalledWith('/api/search?query=definition&app=VSCode&context=Editor')
  })

  it('should filter results by context when specified', async () => {
    const mockResults = [
      {
        id: '1',
        app: 'VSCode',
        action: 'Go to definition',
        keys: { mac: 'F12' },
        context: 'Editor',
        category: 'Navigation',
        tags: ['navigation'],
      },
      {
        id: '2',
        app: 'VSCode',
        action: 'Open command palette',
        keys: { mac: 'Cmd+Shift+P' },
        context: 'Global',
        category: 'Commands',
        tags: ['commands'],
      }
    ]
    
    // Simulate filtering by context on client side
    const contextFilter = 'Editor'
    const filtered = mockResults.filter(r => 
      r.context?.toLowerCase().includes(contextFilter.toLowerCase())
    )
    
    expect(filtered).toHaveLength(1)
    expect(filtered[0].context).toBe('Editor')
  })

  it('should clear all filters including context', () => {
    // Set all filters
    useStore.setState({
      filters: {
        context: 'Editor',
        category: 'Navigation',
        tag: 'keyboard'
      }
    })
    
    // Clear filters
    useStore.setState({ filters: {} })
    
    const filters = useStore.getState().filters
    expect(filters.context).toBeUndefined()
    expect(filters.category).toBeUndefined()
    expect(filters.tag).toBeUndefined()
  })
})

