import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import TicketDetailModal from './TicketDetailModal';
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
        if (source.droppableId === destination.droppableId && destination.index > source.index) {
            insertIndex = destination.index;
        }
        newTickets.splice(insertIndex, 0, movedTicket);

        setTickets(newTickets);

        try {
            await api.put(`/tickets/${movedTicket._id}`, { status: movedTicket.status });
            toast.success('Ticket moved');
        } catch (err) {
            toast.error('Failed to update ticket status');
            // You could revert state here if you want
        }
    };

    const getPriorityStyle = (priority) => {
        if (priority === 'high') return 'bg-red-100 text-red-800 border-red-200';
        if (priority === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    };

    return (
        <>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['To Do', 'In Progress', 'Done'].map((status) => (
                        <div key={status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="font-semibold text-lg mb-5 pb-3 border-b border-gray-200 flex justify-between items-center">
                                <span>{status}</span>
                                <span className="text-gray-500 text-base">
                                    {tickets.filter((t) => t.status === status).length}
                                </span>
                            </h3>

                            <Droppable droppableId={status} isDropDisabled={!canDrag}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="min-h-[450px] space-y-4"
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
                                                            className={`bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''
                                                                }`}
                                                        >
                                                            <div className="font-medium text-gray-900 mb-2">{ticket.title}</div>
                                                            <div className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                                {ticket.description || 'No description'}
                                                            </div>
                                                            <div className="flex flex-wrap justify-between items-center text-xs gap-3">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityStyle(ticket.priority)}`}>
                                                                    {ticket.priority.toUpperCase()}
                                                                </span>
                                                                {ticket.assignee ? (
                                                                    <span className="text-gray-700 font-medium">
                                                                        {ticket.assignee.name || ticket.assignee.email?.split('@')[0]}
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