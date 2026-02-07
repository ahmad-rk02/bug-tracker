import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import TicketDetailModal from './TicketDetailModal.jsx';
import React from 'react';
const KanbanBoard = ({ tickets, setTickets, projectId, currentUser }) => {
    const [selectedTicket, setSelectedTicket] = useState(null);

    const canDrag = ['admin', 'member'].includes(currentUser.role);

    const onDragEnd = async (result) => {
        if (!canDrag) return;

        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newTickets = [...tickets];
        const [movedTicket] = newTickets.splice(source.index, 1);
        movedTicket.status = destination.droppableId;

        let insertIndex = destination.index;
        if (source.droppableId === destination.droppableId) {
            insertIndex = destination.index > source.index ? destination.index : destination.index + 1;
        }
        newTickets.splice(insertIndex, 0, movedTicket);

        setTickets(newTickets);

        try {
            await api.put(`/tickets/${movedTicket._id}`, { status: movedTicket.status });
            toast.success('Ticket moved');
        } catch (err) {
            toast.error('Failed to update ticket status');
        }
    };

    return (
        <>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['To Do', 'In Progress', 'Done'].map((status) => (
                        <div key={status} className="bg-gray-100 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-4 pb-2 border-b">
                                {status} ({tickets.filter((t) => t.status === status).length})
                            </h3>

                            <Droppable droppableId={status} isDropDisabled={!canDrag}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="min-h-[400px] space-y-3"
                                    >
                                        {tickets
                                            .filter((ticket) => ticket.status === status)
                                            .map((ticket, index) => (
                                                <Draggable
                                                    key={ticket._id}
                                                    draggableId={ticket._id}
                                                    index={index}
                                                    isDragDisabled={!canDrag}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...(canDrag ? provided.draggableProps : {})}
                                                            {...(canDrag ? provided.dragHandleProps : {})}
                                                            onClick={() => setSelectedTicket(ticket)}
                                                            className={`bg-white p-4 rounded shadow hover:shadow-lg transition ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                                                                }`}
                                                        >
                                                            <div className="font-medium text-gray-900">{ticket.title}</div>
                                                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                {ticket.description || 'No description'}
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap justify-between items-center text-xs gap-2">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full font-medium ${ticket.priority === 'high'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : ticket.priority === 'medium'
                                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                                : 'bg-green-100 text-green-800'
                                                                        }`}
                                                                >
                                                                    {ticket.priority.toUpperCase()}
                                                                </span>
                                                                {ticket.assignee ? (
                                                                    <span className="text-gray-700 font-medium">
                                                                        {ticket.assignee.name || ticket.assignee.email}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-500 italic">Unassigned</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={(updated) => {
                        setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
                        setSelectedTicket(updated);
                    }}
                    onDelete={() => {
                        setTickets((prev) => prev.filter((t) => t._id !== selectedTicket._id));
                        setSelectedTicket(null);
                    }}
                    currentUser={currentUser}
                />
            )}
        </>
    );
};

export default KanbanBoard;