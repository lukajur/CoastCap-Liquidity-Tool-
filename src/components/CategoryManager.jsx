import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { generateId } from '../utils/helpers';

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        id: generateId(),
        name: newCategoryName.trim(),
      });
      setNewCategoryName('');
    } catch (error) {
      console.error('Failed to add category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onUpdate(editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to update category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Manage Payment Categories
        </h2>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            Add Category
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No categories added yet. Add your first category above.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between py-3"
              >
                {editingId === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      disabled={isSubmitting}
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-900">{category.name}</span>
                    <div className="flex items-center gap-1">
                      {deleteConfirmId === category.id ? (
                        <>
                          <span className="text-sm text-gray-500 mr-2">
                            Delete?
                          </span>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={isSubmitting}
                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={isSubmitting}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(category.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
