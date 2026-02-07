import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import KanbanBoard from './KanbanBoard.jsx';
import TicketForm from './TicketForm.jsx';
import ProjectList from './ProjectList.jsx';
import React from 'react';
const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const isAdmin = user.role === 'admin';
    const isMember = ['admin', 'member'].includes(user.role);
    const isViewer = user.role === 'viewer';

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

            // Refresh projects
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
        <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-700 text-white p-4 shadow">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-2xl"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? '×' : '☰'}
                        </button>
                        <h1 className="text-2xl font-bold">Bug Tracker</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline">Welcome, {user.name || user.email.split('@')[0]}</span>
                        <span className="text-xs px-2.5 py-1 bg-blue-800 rounded-full">
                            {user.role.toUpperCase()}
                        </span>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-6 flex flex-col md:flex-row gap-6">
                <aside
                    className={`${sidebarOpen ? 'block' : 'hidden'
                        } md:block w-full md:w-64 bg-white rounded-lg shadow p-4 fixed md:static inset-0 md:inset-auto z-40 md:z-auto overflow-y-auto bg-opacity-95 md:bg-opacity-100`}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Projects</h2>
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateProject(true)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                                + New
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

                <main className="flex-1">
                    {selectedProjectId ? (
                        <>
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                <h2 className="text-2xl font-bold">
                                    {projects.find((p) => p._id === selectedProjectId)?.title || 'Project'}
                                </h2>

                                {isMember && (
                                    <button
                                        onClick={() => setShowTicketForm(true)}
                                        className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
                                    >
                                        + New Ticket
                                    </button>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow mb-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search tickets by title..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-2 border rounded-lg bg-white min-w-[140px]"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                        <select
                                            value={filterPriority}
                                            onChange={(e) => setFilterPriority(e.target.value)}
                                            className="px-4 py-2 border rounded-lg bg-white min-w-[140px]"
                                        >
                                            <option value="">All Priorities</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>

                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="px-5 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 whitespace-nowrap"
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
                                <div className="text-center py-10">Loading tickets...</div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
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

                            {isViewer && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-center text-blue-800">
                                    View-only mode – you can browse but cannot modify anything.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            {projects.length === 0
                                ? isAdmin
                                    ? 'No projects yet. Click "+ New" in the sidebar to create your first project!'
                                    : 'No projects available. Contact an admin to be added.'
                                : 'Select a project from the sidebar to view tickets'}
                        </div>
                    )}
                </main>
            </div>

            {/* Create Project Modal */}
            {isAdmin && showCreateProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project Title *</label>
                                    <input
                                        type="text"
                                        value={newProject.title}
                                        onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Website Redesign"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Brief project overview..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateProject(false)}
                                        className="px-4 py-2 border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateProject}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Edit Project</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Project Title *</label>
                                    <input
                                        type="text"
                                        value={editingProject.title || ''}
                                        onChange={(e) =>
                                            setEditingProject((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={editingProject.description || ''}
                                        onChange={(e) =>
                                            setEditingProject((prev) => ({ ...prev, description: e.target.value }))
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setEditingProject(null)}
                                        className="px-4 py-2 border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateProject}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">
                                Add Member to "{selectedProjectForMember.title}"
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Member Email</label>
                                    <input
                                        type="email"
                                        value={memberEmail}
                                        onChange={(e) => setMemberEmail(e.target.value)}
                                        placeholder="Enter member's email"
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        User must already have an account in the system.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setMemberEmail('');
                                        }}
                                        className="px-4 py-2 border rounded hover:bg-gray-100"
                                        disabled={addingMember}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={addingMember || !memberEmail.trim()}
                                        className={`px-4 py-2 text-white rounded flex items-center gap-2 ${addingMember ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
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