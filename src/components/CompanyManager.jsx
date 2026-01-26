import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { generateId } from '../utils/helpers';

export default function CompanyManager({ companies, onAdd, onUpdate, onDelete }) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        id: generateId(),
        name: newCompanyName.trim(),
      });
      setNewCompanyName('');
    } catch (error) {
      console.error('Failed to add company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (company) => {
    setEditingId(company.id);
    setEditingName(company.name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onUpdate(editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to update company:', error);
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
      console.error('Failed to delete company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Manage Companies
        </h2>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Enter company name"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            Add Company
          </button>
        </form>

        {companies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No companies added yet. Add your first company above.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {companies.map((company) => (
              <li
                key={company.id}
                className="flex items-center justify-between py-3"
              >
                {editingId === company.id ? (
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
                    <span className="text-gray-900">{company.name}</span>
                    <div className="flex items-center gap-1">
                      {deleteConfirmId === company.id ? (
                        <>
                          <span className="text-sm text-gray-500 mr-2">
                            Delete?
                          </span>
                          <button
                            onClick={() => handleDelete(company.id)}
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
                            onClick={() => handleEdit(company)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(company.id)}
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
