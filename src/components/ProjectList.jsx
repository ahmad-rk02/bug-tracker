import React from 'react';

const ProjectList = ({
    projects,
    selectedProjectId,
    onSelect,
    onEdit,
    onDelete,
    onAddMember,
}) => {
    return (
        <div className="space-y-2">
            {projects.map((project) => (
                <div
                    key={project._id}
                    className={`p-4 rounded-xl transition-all border ${selectedProjectId === project._id
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow'
                        }`}
                >
                    <div
                        className="cursor-pointer"
                        onClick={() => onSelect(project._id)}
                    >
                        <div className="font-semibold text-gray-900">{project.title}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {project.description || 'No description provided'}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                                className="text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
                                className="text-red-600 hover:text-red-800 font-medium transition"
                            >
                                Delete
                            </button>
                        )}
                        {onAddMember && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddMember(project); }}
                                className="text-green-600 hover:text-green-800 font-medium transition"
                            >
                                + Add Member
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectList;