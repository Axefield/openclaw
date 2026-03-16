import { forwardRef } from 'react'
import { Card, CardBody } from 'reactstrap'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CardItem } from '../types/index'

interface DraggableCardProps {
  card: CardItem
}

const DraggableCard = forwardRef<HTMLDivElement, DraggableCardProps>(({ card }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'secondary'
    }
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        if (ref) {
          if (typeof ref === 'function') {
            ref(node)
          } else {
            ref.current = node
          }
        }
      }}
      style={style}
      className="mb-2"
      {...attributes}
      {...listeners}
    >
      <Card className={`card-cosmos border-${getPriorityColor(card.priority)}`}>
        <CardBody className="p-2">
          <h6 className="card-title mb-1">{card.title}</h6>
          <p className="card-text small mb-2">{card.content}</p>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">{card.type}</small>
            <span className={`badge bg-${getPriorityColor(card.priority)}`}>
              {card.priority}
            </span>
          </div>
          {card.tags.length > 0 && (
            <div className="mt-2">
              {card.tags.map((tag, index) => (
                <span key={index} className="badge bg-info me-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
})

DraggableCard.displayName = 'DraggableCard'

export default DraggableCard
