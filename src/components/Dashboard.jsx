import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import KanbanBoard from './KanbanBoard';
import TicketForm from './TicketForm';
import ProjectList from './ProjectList';
import React from 'react';
const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
    }

    const isAdmin = user.role === 'admin';
    const isMember = ['admin', 'member'].includes(user.role);

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    // Add Member modal states
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedProjectForMember, setSelectedProjectForMember] = useState(null);
    const [memberEmail, setMemberEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects');
                setProjects(res.data);
                if (res.data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(res.data[0]._id);
                }
            } catch (err) {
                toast.error('Failed to load projects');
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!selectedProjectId) return;

        const fetchTickets = async () => {
            setLoading(true);
            try {
                let url = `/tickets/project/${selectedProjectId}`;
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                if (filterStatus) params.append('status', filterStatus);
                if (filterPriority) params.append('priority', filterPriority);
                if (params.toString()) url += `?${params.toString()}`;

                const res = await api.get(url);
                setTickets(res.data);
            } catch (err) {
                toast.error('Failed to load tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [selectedProjectId, searchQuery, filterStatus, filterPriority]);

    const handleCreateTicket = (newTicket) => {
        setTickets((prev) => [...prev, newTicket]);
        setShowTicketForm(false);
    };

    const handleCreateProject = async () => {
        if (!newProject.title.trim()) return toast.error('Project title is required');
        try {
            const res = await api.post('/projects', newProject);
            setProjects((prev) => [...prev, res.data]);
            setSelectedProjectId(res.data._id);
            setNewProject({ title: '', description: '' });
            setShowCreateProject(false);
            toast.success('Project created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create project');
        }
    };

    const handleUpdateProject = async () => {
        if (!editingProject) return;
        try {
            const res = await api.put(`/projects/${editingProject._id}`, editingProject);
            setProjects((prev) =>
                prev.map((p) => (p._id === res.data._id ? res.data : p))
            );
            setEditingProject(null);
            toast.success('Project updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update project');
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Delete this project and all its tickets?')) return;
        try {
            await api.delete(`/projects/${id}`);
            setProjects((prev) => prev.filter((p) => p._id !== id));
            if (id === selectedProjectId) {
                setSelectedProjectId(projects[0]?._id || null);
                setTickets([]);
            }
            toast.success('Project deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete project');
        }
    };

    const handleAddMemberClick = (project) => {
        setSelectedProjectForMember(project);
        setMemberEmail('');
        setShowAddMemberModal(true);
    };

    const handleAddMember = async () => {
        if (!memberEmail.trim()) return toast.error('Email is required');
        if (!selectedProjectForMember) return;

        setAddingMember(true);
        try {
            await api.post(`/projects/${selectedProjectForMember._id}/add-member`, {
                email: memberEmail.trim(),
            });

            const res = await api.get('/projects');
            setProjects(res.data);

            toast.success(`Member added to "${selectedProjectForMember.title}"`);
            setShowAddMemberModal(false);
            setMemberEmail('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('');
        setFilterPriority('');
        toast.info('Showing all tickets');
    };

    const hasActiveFilters = searchQuery.trim() || filterStatus || filterPriority;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4 md:py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-3xl"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? '×' : '☰'}
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold">BugTracker</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline text-sm md:text-base">
                            Welcome, {user.name || user.email.split('@')[0]}
                        </span>
                        <span className="text-xs px-3 py-1 bg-blue-800/80 rounded-full font-medium">
                            {user.role.toUpperCase()}
                        </span>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm md:text-base transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <aside
                    className={`${sidebarOpen ? 'block' : 'hidden'
                        } md:block w-full md:w-72 bg-white rounded-xl shadow-lg p-5 border border-gray-200 md:sticky md:top-6 md:self-start overflow-y-auto max-h-[calc(100vh-5rem)]`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateProject(true)}
                                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                            >
                                + New Project
                            </button>
                        )}
                    </div>
                    <ProjectList
                        projects={projects}
                        selectedProjectId={selectedProjectId}
                        onSelect={setSelectedProjectId}
                        onEdit={isAdmin ? setEditingProject : null}
                        onDelete={isAdmin ? handleDeleteProject : null}
                        onAddMember={isAdmin ? handleAddMemberClick : null}
                    />
                </aside>

                {/* Main */}
                <main className="flex-1">
                    {selectedProjectId ? (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {projects.find((p) => p._id === selectedProjectId)?.title || 'Project'}
                                </h2>

                                {isMember && (
                                    <button
                                        onClick={() => setShowTicketForm(true)}
                                        className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium transition shadow-sm"
                                    >
                                        + New Ticket
                                    </button>
                                )}
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        placeholder="Search tickets by title or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>

                                        <select
                                            value={filterPriority}
                                            onChange={(e) => setFilterPriority(e.target.value)}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        >
                                            <option value="">All Priorities</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>

                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {showTicketForm && isMember && (
                                <TicketForm
                                    projectId={selectedProjectId}
                                    onClose={() => setShowTicketForm(false)}
                                    onCreated={handleCreateTicket}
                                />
                            )}

                            {loading ? (
                                <div className="text-center py-12 text-gray-500">Loading tickets...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                                    {hasActiveFilters
                                        ? 'No tickets match your current filters'
                                        : 'No tickets found in this project'}
                                </div>
                            ) : (
                                <KanbanBoard
                                    tickets={tickets}
                                    setTickets={setTickets}
                                    projectId={selectedProjectId}
                                    currentUser={user}
                                />
                            )}

                            {!isMember && (
                                <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-800">
                                    View-only mode — you can browse but cannot create or modify tickets.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm">
                            {projects.length === 0
                                ? isAdmin
                                    ? 'No projects yet. Create your first project using the "+ New Project" button!'
                                    : 'No projects available. Ask an admin to add you to a project.'
                                : 'Select a project from the sidebar to view its tickets'}
                        </div>
                    )}
                </main>
            </div>

            {/* Footer */}
            <footer className="mt-auto py-10 text-center text-gray-500 border-t bg-white">
                <div className="container mx-auto px-6">
                    <p className="text-sm">
                        © {new Date().getFullYear()} BugTracker • All rights reserved
                    </p>
                    <p className="text-sm mt-1.5 text-gray-400">
                        Made by Ahmad Raza Khan
                    </p>
                </div>
            </footer>

            {/* Create Project Modal */}
            {isAdmin && showCreateProject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/70">
                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title *</label>
                                    <input
                                        type="text"
                                        value={newProject.title}
                                        onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="e.g. Website Redesign"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
                                        placeholder="Brief project overview..."
                                    />
                                </div>
                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        onClick={() => setShowCreateProject(false)}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateProject}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {isAdmin && editingProject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/70">
                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Title *</label>
                                    <input
                                        type="text"
                                        value={editingProject.title || ''}
                                        onChange={(e) =>
                                            setEditingProject((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        value={editingProject.description || ''}
                                        onChange={(e) =>
                                            setEditingProject((prev) => ({ ...prev, description: e.target.value }))
                                        }
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
                                    />
                                </div>
                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        onClick={() => setEditingProject(null)}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateProject}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {isAdmin && showAddMemberModal && selectedProjectForMember && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/70">
                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                Add Member to "{selectedProjectForMember.title}"
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Member Email</label>
                                    <input
                                        type="email"
                                        value={memberEmail}
                                        onChange={(e) => setMemberEmail(e.target.value)}
                                        placeholder="Enter member's email"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        The user must already have an account in the system.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setMemberEmail('');
                                        }}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                                        disabled={addingMember}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={addingMember || !memberEmail.trim()}
                                        className={`px-6 py-2.5 text-white rounded-lg font-medium transition flex items-center gap-2 min-w-[140px] justify-center ${addingMember ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'
                                            }`}
                                    >
                                        {addingMember ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            'Add Member'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;