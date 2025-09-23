import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscriptionPlan: string;
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError('Please provide both title and content');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newNote),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note');
      }

      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setSuccess('Note created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter(note => note.id !== noteId));
      setSuccess('Note deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError('');

    try {
      const response = await fetch(`/api/tenants/${user.tenant?.slug}/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade');
      }

      // Update user data in localStorage
      const updatedUser = {
        ...user,
        tenant: {
          ...user.tenant,
          subscriptionPlan: 'PRO',
        },
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('Successfully upgraded to Pro plan!');
      setTimeout(() => {
        window.location.reload(); // Refresh to show updated plan
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUpgrading(false);
    }
  };

  const canCreateNote = user.tenant?.subscriptionPlan === 'PRO' || notes.length < 3;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                YardStick Notes
              </h1>
              <p className="text-sm text-gray-600">
                {user.tenant?.name || 'Unknown Tenant'} ({user.tenant?.subscriptionPlan || 'FREE'} Plan) - {user.role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Upgrade Section */}
        {user.tenant?.subscriptionPlan === 'FREE' && user.role === 'ADMIN' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-800">
                  Upgrade to Pro Plan
                </h3>
                <p className="text-yellow-700">
                  You are currently limited to 3 notes. Upgrade to Pro for unlimited notes!
                </p>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}

        {/* Note Limit Warning */}
        {user.tenant?.subscriptionPlan === 'FREE' && notes.length >= 3 && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
            You have reached the maximum number of notes for the Free plan (3 notes).
            {user.role === 'ADMIN' ? ' Upgrade to Pro for unlimited notes!' : ' Contact your admin to upgrade.'}
          </div>
        )}

        {/* Create Note Form */}
        {canCreateNote && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Note</h2>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  placeholder="Note content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Note'}
              </button>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Your Notes ({notes.length}{user.tenant?.subscriptionPlan === 'FREE' ? '/3' : ''})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No notes yet. {canCreateNote ? 'Create your first note above!' : ''}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notes.map((note) => (
                <div key={note.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
                      <p className="text-gray-600 mt-2">{note.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Created by {note.user.email} on {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}