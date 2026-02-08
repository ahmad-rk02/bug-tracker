import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import React from 'react';
const TicketForm = ({ projectId, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            return toast.error('Title is required');
        }

        try {
            const payload = {
                ...formData,
                assignee: formData.assignee.trim() || null,
                projectId,
            };

            const res = await api.post('/tickets', payload);
            toast.success('Ticket created');
            onCreated(res.data);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create ticket');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/70 transform transition-all">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Create New Ticket</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter ticket title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                placeholder="Describe the issue or feature..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y min-h-[110px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                            >
                                Create Ticket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TicketForm;