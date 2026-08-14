'use client';

import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Task = {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
};

type Filter = 'all' | 'active' | 'done';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const withPending = async <T,>(id: number, fn: () => Promise<T>) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      return await fn();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const fetchTasks = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      setError("Impossible de contacter l'API. Vérifie que le backend tourne bien.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error();
      setTitle('');
      await fetchTasks();
    } catch {
      setError("Échec de la création de la tâche.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = (id: number) =>
    withPending(id, async () => {
      try {
        await fetch(`${API_URL}/tasks/${id}/toggle`, { method: 'PATCH' });
        await fetchTasks();
      } catch {
        setError('Échec de la mise à jour du statut.');
      }
    });

  const deleteTask = (id: number) =>
    withPending(id, async () => {
      try {
        await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        await fetchTasks();
      } catch {
        setError('Échec de la suppression.');
      }
    });

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEditing = (id: number) =>
    withPending(id, async () => {
      const next = editingTitle.trim();
      if (!next) return cancelEditing();
      try {
        await fetch(`${API_URL}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: next }),
        });
        cancelEditing();
        await fetchTasks();
      } catch {
        setError('Échec de la modification.');
      }
    });

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.done);
    if (filter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((t) => t.done).length,
      active: tasks.filter((t) => !t.done).length,
    }),
    [tasks],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Header */}
      <header className="mb-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-soft">
          ST
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            SmartTask
          </h1>
          <p className="text-sm text-slate-500">Gère tes tâches, simplement et efficacement.</p>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="rounded-md px-2 py-1 text-red-500 hover:bg-red-100"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total" value={stats.total} color="from-slate-500 to-slate-700" />
        <StatCard label="En cours" value={stats.active} color="from-amber-400 to-amber-600" />
        <StatCard label="Terminées" value={stats.done} color="from-emerald-400 to-emerald-600" />
      </div>

      {/* Add form */}
      <form
        onSubmit={addTask}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Ajout...' : '+ Ajouter'}
        </button>
      </form>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {(
          [
            ['all', 'Toutes'],
            ['active', 'En cours'],
            ['done', 'Terminées'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === key
                ? 'bg-slate-900 text-white shadow-soft'
                : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
                <th className="w-14 px-4 py-3 font-medium">✓</th>
                <th className="px-2 py-3 font-medium">Tâche</th>
                <th className="w-40 px-4 py-3 font-medium">Créée le</th>
                <th className="w-36 px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-4 py-4" colSpan={4}>
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filteredTasks.map((task) => {
                  const isEditing = editingId === task.id;
                  const isPending = pendingIds.has(task.id);
                  return (
                    <tr
                      key={task.id}
                      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60 animate-fade-in"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          disabled={isPending}
                          aria-label="Basculer le statut"
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${
                            task.done
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 hover:border-brand-400'
                          }`}
                        >
                          {task.done && '✓'}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(task.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="w-full rounded-lg border border-brand-300 bg-white px-2 py-1.5 text-sm outline-none ring-4 ring-brand-100"
                          />
                        ) : (
                          <span
                            onClick={() => startEditing(task)}
                            className={`cursor-text ${
                              task.done ? 'text-slate-400 line-through' : 'text-slate-700'
                            }`}
                          >
                            {task.title}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(task.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <ActionButton onClick={() => saveEditing(task.id)} title="Enregistrer">
                                💾
                              </ActionButton>
                              <ActionButton onClick={cancelEditing} title="Annuler">
                                ✕
                              </ActionButton>
                            </>
                          ) : (
                            <>
                              <ActionButton onClick={() => startEditing(task)} title="Modifier">
                                ✎
                              </ActionButton>
                              <ActionButton
                                onClick={() => deleteTask(task.id)}
                                title="Supprimer"
                                danger
                                disabled={isPending}
                              >
                                🗑
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-400">
                      {tasks.length === 0
                        ? 'Aucune tâche pour le moment. Ajoute-en une ci-dessus !'
                        : 'Aucune tâche dans ce filtre.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        SmartTask · NestJS + Prisma + PostgreSQL + Next.js
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className={`mb-2 h-1.5 w-8 rounded-full bg-gradient-to-r ${color}`} />
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-400 hover:bg-brand-50 hover:text-brand-600'
      }`}
    >
      {children}
    </button>
  );
}
