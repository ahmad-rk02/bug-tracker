import React from 'react';

const ProjectList = ({
    projects,
    selectedProjectId,
    onSelect,
    onEdit,
    onDelete,
    onAddMember, // new prop
}) => {
    return (
        <div className="space-y-2">
            {projects.map((project) => (
                <div
                    key={project._id}
                    className={`p-3 rounded-lg ${selectedProjectId === project._id
                            ? 'bg-blue-100 border-l-4 border-blue-600'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    <div
                        className="cursor-pointer"
                        onClick={() => onSelect(project._id)}
                    >
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                            {project.description || 'No description'}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(project)}
                                className="text-blue-600 hover:underline"
                            >
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(project._id)}
                                className="text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        )}
                        {onAddMember && (
                            <button
                                onClick={() => onAddMember(project)}
                                className="text-green-600 hover:underline"
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