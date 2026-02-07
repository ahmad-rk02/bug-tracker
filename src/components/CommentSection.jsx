import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import React from 'react';
const CommentSection = ({ ticketId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const canComment = ['admin', 'member'].includes(currentUser.role);
    const canDelete = (comment) =>
        currentUser.role === 'admin' || comment.userId?._id === currentUser._id;

    useEffect(() => {
        if (!ticketId) return;

        const fetchComments = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/comments/${ticketId}`);
                setComments(res.data);
            } catch (err) {
                toast.error('Could not load comments');
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [ticketId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            const res = await api.post(`/comments/${ticketId}`, {
                text: newComment.trim(),
            });
            setComments((prev) => [res.data, ...prev]);
            setNewComment('');
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            setDeletingId(commentId);
            await api.delete(`/comments/${commentId}`);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
            toast.success('Comment deleted');
        } catch {
            toast.error('Failed to delete comment');
        } finally {
            setDeletingId(null);
        }
    };

    if (!canComment) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-center">
                You cannot add comments (viewer mode).
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="text-gray-500 italic">No comments yet.</div>
            ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {comments.map((comment) => (
                        <div
                            key={comment._id}
                            className="bg-gray-50 p-4 rounded-lg border relative group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium text-sm">
                                        {comment.userId?.name || 'User'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                {canDelete(comment) && (
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        disabled={deletingId === comment._id}
                                        className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        {deletingId === comment._id ? 'Deleting…' : 'Delete'}
                                    </button>
                                )}
                            </div>

                            <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                                {comment.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentSection;