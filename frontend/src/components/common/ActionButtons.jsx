import { Pencil, Trash2 } from 'lucide-react';

const ActionButtons = ({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) => {
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            onDelete();
        }
    };

    return (
        <div className="flex items-center justify-end gap-1">
            {onEdit && (
                <button
                    onClick={onEdit}
                    title={editLabel}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                    <Pencil size={15} />
                </button>
            )}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    title={deleteLabel}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={15} />
                </button>
            )}
        </div>
    );
};

export default ActionButtons;
