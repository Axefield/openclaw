import { useState } from 'react'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { useDroppable } from '@dnd-kit/core'
import DraggableCard from './DraggableCard'
import { useKanbanStore } from '../stores/kanbanStore'
import type { CardItem } from '../types/index'

interface KanbanColumnProps {
  columnId: string
}


const KanbanColumn = ({ columnId }: KanbanColumnProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { cards, addCard } = useKanbanStore()
  
  const { setNodeRef } = useDroppable({
    id: columnId,
  })

  const toggle = () => setDropdownOpen(prevState => !prevState)
  
  const columnCards = cards.filter(card => card.columnId === columnId)

  const getCardTemplates = () => {
    switch (columnId) {
      case 'ideas':
        return [
          { label: 'New Idea', action: () => handleAddCard('New Idea', 'A new creative concept', 'idea') },
          { label: 'Quick Capture', action: () => handleAddCard('Quick Capture', 'Voice-to-text idea', 'capture') },
          { label: 'Import', action: () => handleAddCard('Import', 'Import from external source', 'import') },
          { label: 'Template', action: () => handleAddCard('Template', 'Use predefined template', 'template') }
        ]
      case 'think':
        return [
          { label: 'Start Thinking', action: () => handleAddCard('Thinking Session', 'Structured problem-solving', 'thinking') },
          { label: 'Problem Solve', action: () => handleAddCard('Problem Solve', 'Problem-focused thinking', 'problem') },
          { label: 'Research', action: () => handleAddCard('Research', 'Research-focused thinking', 'research') },
          { label: 'Analyze', action: () => handleAddCard('Analyze', 'Analysis-focused thinking', 'analysis') }
        ]
      case 'decide':
        return [
          { label: 'Make Decision', action: () => handleAddCard('Decision', 'General decision making', 'decision') },
          { label: 'Angel/Demon', action: () => handleAddCard('Angel/Demon Balance', 'Ethical vs urgent decision', 'balance') },
          { label: 'Compare Options', action: () => handleAddCard('Compare Options', 'Multi-option decision', 'compare') },
          { label: 'Risk Assessment', action: () => handleAddCard('Risk Assessment', 'Risk-focused decision', 'risk') }
        ]
      case 'notes':
        return [
          { label: 'Meeting Notes', action: () => handleAddCard('Meeting Notes', 'Document meeting outcomes', 'meeting') },
          { label: 'Memory Created', action: () => handleAddCard('Memory Created', 'New memory stored', 'memory') },
          { label: 'Learning Notes', action: () => handleAddCard('Learning Notes', 'Document learning', 'learning') }
        ]
      case 'done':
        return [
          { label: 'Project Complete', action: () => handleAddCard('Project Complete', 'Project finished', 'project') },
          { label: 'Decision Outcome', action: () => handleAddCard('Decision Outcome', 'Decision made', 'outcome') },
          { label: 'Goal Achieved', action: () => handleAddCard('Goal Achieved', 'Goal completed', 'goal') }
        ]
      default:
        return []
    }
  }

  const handleAddCard = (title: string, content: string, type: string) => {
    const newCard: CardItem = {
      id: Date.now().toString(),
      title,
      content,
      type,
      priority: 'medium',
      tags: [type],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      columnId
    }
    addCard(newCard)
  }


  return (
    <div className="kanban-column">
      {/* Add Card Dropdown */}
      <div className="mb-2">
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
          <DropdownToggle caret color="outline-secondary" size="sm" className="btn-dragon w-100">
            + Add Card
          </DropdownToggle>
          <DropdownMenu>
            {getCardTemplates().map((template, index) => (
              <DropdownItem key={index} onClick={template.action}>
                {template.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Cards */}
      <div 
        ref={setNodeRef}
        className="cards-container" 
        style={{ minHeight: '400px' }}
      >
        {columnCards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

export default KanbanColumn
