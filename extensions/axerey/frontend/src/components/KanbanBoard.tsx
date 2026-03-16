import { Row, Col, Card, CardBody, CardHeader, Button } from 'reactstrap'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import { useKanbanStore } from '../stores/kanbanStore'

const KanbanBoard = () => {
  const { cards, moveCard, selectedCard, setSelectedCard } = useKanbanStore()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setSelectedCard(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const cardId = String(active.id)
      const newColumnId = String(over.id)
      moveCard(cardId, newColumnId)
    }
    
    setSelectedCard(null)
  }

  const columns = [
    {
      id: 'ideas',
      title: '💭 Ideas',
      color: 'primary',
      description: 'Capture & Organize'
    },
    {
      id: 'think',
      title: '🧠 Think',
      color: 'info',
      description: 'Sequential Processing'
    },
    {
      id: 'decide',
      title: '🧮 Decide',
      color: 'success',
      description: 'Decision Making'
    },
    {
      id: 'notes',
      title: '📝 Notes',
      color: 'warning',
      description: 'Memory & Documentation'
    },
    {
      id: 'done',
      title: '✅ Done',
      color: 'secondary',
      description: 'Completed & Outcomes'
    }
  ]

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        <Row className="g-3">
          {columns.map((column) => (
            <Col key={column.id} md={2} className="kanban-column">
              <Card className={`card-cosmos border-${column.color} h-100`}>
                <CardHeader className={`bg-${column.color} text-white`}>
                  <h6 className="mb-0">{column.title}</h6>
                  <small>{column.description}</small>
                </CardHeader>
                <CardBody className="p-2">
                  <SortableContext
                    id={column.id}
                    items={cards.filter(card => card.columnId === column.id).map(card => card.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <KanbanColumn columnId={column.id} />
                  </SortableContext>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      
      {/* Quick Actions Bar */}
      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <CardBody className="py-2">
              <div className="d-flex justify-content-center gap-3">
                <Button color="primary" size="sm">
                  + New Memory
                </Button>
                <Button color="info" size="sm">
                  🔄 Start Thinking
                </Button>
                <Button color="success" size="sm">
                  🧮 Make Decision
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      
      <DragOverlay>
        {selectedCard ? (
          <Card className="card-cosmos mb-2 opacity-75" style={{ transform: 'rotate(-2deg)' }}>
            <CardBody className="p-2">
              <h6 className="card-title mb-1">
                {cards.find(card => card.id === selectedCard)?.title || 'Card'}
              </h6>
              <p className="card-text small mb-2">
                {cards.find(card => card.id === selectedCard)?.content || 'Content'}
              </p>
            </CardBody>
          </Card>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  )
}

export default KanbanBoard
