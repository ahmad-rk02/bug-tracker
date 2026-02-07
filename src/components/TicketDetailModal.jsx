import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import CommentSection from './CommentSection';
import React from 'react';
const TicketDetailModal = ({ ticket, onClose, onUpdate, onDelete, currentUser }) => {
    const [formData, setFormData] = useState({
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        assignee: ticket.assignee?._id || '',
    });

    const [projectMembers, setProjectMembers] = useState([]);

    const isAdmin = currentUser.role === 'admin';
    const isCreator = ticket.createdBy?._id === currentUser._id;
    const isAssignee = ticket.assignee?._id === currentUser._id;

    const canEdit = isAdmin || isCreator || isAssignee;
    const canDelete = isAdmin || isCreator;
    const canComment = isAdmin || currentUser.role === 'member';

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await api.get(`/projects/${ticket.projectId}`);
                setProjectMembers(res.data.teamMembers || []);
            } catch (err) {
                toast.error('Failed to load team members');
            }
        };
        fetchMembers();
    }, [ticket.projectId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                assignee: formData.assignee.trim() ? formData.assignee : null,
            };
            const res = await api.put(`/tickets/${ticket._id}`, payload);
            onUpdate(res.data);
            toast.success('Ticket updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update ticket');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this ticket?')) return;
        try {
            await api.delete(`/tickets/${ticket._id}`);
            toast.success('Ticket deleted');
            onDelete();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Ticket Details</h2>
                    <button onClick={onClose} className="text-2xl">✕</button>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            disabled={!canEdit}
                            className={`w-full border p-2 rounded ${!canEdit ? 'bg-gray-100' : ''}`}
                        />

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            disabled={!canEdit}
                            className={`w-full border p-2 rounded ${!canEdit ? 'bg-gray-100' : ''}`}
                        />

                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            disabled={!canEdit}
                            className={`w-full border p-2 rounded ${!canEdit ? 'bg-gray-100' : ''}`}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={!canEdit}
                            className={`w-full border p-2 rounded ${!canEdit ? 'bg-gray-100' : ''}`}
                        >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>

                        <select
                            name="assignee"
                            value={formData.assignee}
                            onChange={handleChange}
                            disabled={!canEdit || !isAdmin}
                            className={`w-full border p-2 rounded ${!canEdit || !isAdmin ? 'bg-gray-100' : ''}`}
                        >
                            <option value="">Unassigned</option>
                            {projectMembers.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>

                        {canEdit && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-600 text-white p-3 rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}

                        {!canEdit && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-center">
                                You can only view this ticket.
                            </div>
                        )}
                    </div>

                    <div>
                        {canComment ? (
                            <CommentSection ticketId={ticket._id} currentUser={currentUser} />
                        ) : (
                            <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-center">
                                Comments are read-only in viewer mode.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailModal;