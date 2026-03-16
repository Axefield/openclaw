import { create } from 'zustand'
import type { CardItem, ThinkingSession, Decision, Memory } from '../types/index'

interface KanbanState {
  // Cards
  cards: CardItem[]
  addCard: (card: CardItem) => void
  updateCard: (id: string, updates: Partial<CardItem>) => void
  moveCard: (cardId: string, newColumnId: string) => void
  deleteCard: (id: string) => void
  
  // Thinking Sessions
  thinkingSessions: ThinkingSession[]
  addThinkingSession: (session: ThinkingSession) => void
  updateThinkingSession: (id: string, updates: Partial<ThinkingSession>) => void
  
  // Decisions
  decisions: Decision[]
  addDecision: (decision: Decision) => void
  updateDecision: (id: string, updates: Partial<Decision>) => void
  
  // Memories
  memories: Memory[]
  addMemory: (memory: Memory) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void
  
  // UI State
  selectedCard: string | null
  setSelectedCard: (cardId: string | null) => void
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
}

export const useKanbanStore = create<KanbanState>((set) => ({
  // Initial state with sample data
  cards: [
    {
      id: '1',
      title: 'New Project Idea',
      content: 'A revolutionary AI-powered productivity tool',
      type: 'idea',
      priority: 'high',
      tags: ['ai', 'productivity'],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      columnId: 'ideas'
    },
    {
      id: '2',
      title: 'Research Phase',
      content: 'Investigate market opportunities and technical feasibility',
      type: 'thinking',
      priority: 'medium',
      tags: ['research', 'market'],
      createdAt: Date.now() - 43200000,
      updatedAt: Date.now() - 43200000,
      columnId: 'think'
    },
    {
      id: '3',
      title: 'Technology Decision',
      content: 'Choose between React and Vue for frontend development',
      type: 'decision',
      priority: 'high',
      tags: ['technology', 'frontend'],
      createdAt: Date.now() - 21600000,
      updatedAt: Date.now() - 21600000,
      columnId: 'decide'
    },
    {
      id: '4',
      title: 'Meeting Notes',
      content: 'Discussed project timeline and resource allocation',
      type: 'meeting',
      priority: 'medium',
      tags: ['meeting', 'timeline'],
      createdAt: Date.now() - 10800000,
      updatedAt: Date.now() - 10800000,
      columnId: 'notes'
    },
    {
      id: '5',
      title: 'MVP Complete',
      content: 'Successfully launched the minimum viable product',
      type: 'project',
      priority: 'high',
      tags: ['mvp', 'launch'],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      columnId: 'done'
    }
  ],
  thinkingSessions: [],
  decisions: [],
  memories: [],
  selectedCard: null,
  isDragging: false,
  
  // Card actions
  addCard: (card) => set((state) => ({
    cards: [...state.cards, card]
  })),
  
  updateCard: (id, updates) => set((state) => ({
    cards: state.cards.map(card => 
      card.id === id ? { ...card, ...updates, updatedAt: Date.now() } : card
    )
  })),
  
  moveCard: (cardId, newColumnId) => set((state) => ({
    cards: state.cards.map(card => 
      card.id === cardId ? { ...card, columnId: newColumnId, updatedAt: Date.now() } : card
    )
  })),
  
  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter(card => card.id !== id)
  })),
  
  // Thinking session actions
  addThinkingSession: (session) => set((state) => ({
    thinkingSessions: [...state.thinkingSessions, session]
  })),
  
  updateThinkingSession: (id, updates) => set((state) => ({
    thinkingSessions: state.thinkingSessions.map(session => 
      session.id === id ? { ...session, ...updates, updatedAt: Date.now() } : session
    )
  })),
  
  // Decision actions
  addDecision: (decision) => set((state) => ({
    decisions: [...state.decisions, decision]
  })),
  
  updateDecision: (id, updates) => set((state) => ({
    decisions: state.decisions.map(decision => 
      decision.id === id ? { ...decision, ...updates } : decision
    )
  })),
  
  // Memory actions
  addMemory: (memory) => set((state) => ({
    memories: [...state.memories, memory]
  })),
  
  updateMemory: (id, updates) => set((state) => ({
    memories: state.memories.map(memory => 
      memory.id === id ? { ...memory, ...updates } : memory
    )
  })),
  
  // UI actions
  setSelectedCard: (cardId) => set({ selectedCard: cardId }),
  setIsDragging: (dragging) => set({ isDragging: dragging })
}))
