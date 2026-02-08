import { useState, useEffect } from 'react';
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-gray-200/70">
                <div className="p-6 md:p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
                    <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-800 leading-none">
                        ×
                    </button>
                </div>

                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                disabled={!canEdit}
                                className={`w-full px-4 py-2.5 border rounded-lg transition ${!canEdit ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                disabled={!canEdit}
                                className={`w-full px-4 py-2.5 border rounded-lg transition resize-y min-h-[110px] ${!canEdit ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className={`w-full px-4 py-2.5 border rounded-lg bg-white transition ${!canEdit ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className={`w-full px-4 py-2.5 border rounded-lg bg-white transition ${!canEdit ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignee</label>
                            <select
                                name="assignee"
                                value={formData.assignee}
                                onChange={handleChange}
                                disabled={!canEdit || !isAdmin}
                                className={`w-full px-4 py-2.5 border rounded-lg bg-white transition ${!canEdit || !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                            >
                                <option value="">Unassigned</option>
                                {projectMembers.map((m) => (
                                    <option key={m._id} value={m._id}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {canEdit && (
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                                >
                                    Save Changes
                                </button>
                                {canDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium transition shadow-sm"
                                    >
                                        Delete Ticket
                                    </button>
                                )}
                            </div>
                        )}

                        {!canEdit && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
                                You have view-only access to this ticket.
                            </div>
                        )}
                    </div>

                    <div>
                        <CommentSection ticketId={ticket._id} currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailModal;