'use client';
import { useAdminUsers } from '@/hooks/useAdminDashboard';
import { LoadingSpinner } from '@/components/common/index';
import { formatDate, cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminUsers();
  const users = data?.data ?? [];
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ivory font-light">Users</h1>
      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td className="font-medium text-ivory">{u.full_name ?? '—'}</td>
                  <td className="text-xs">{u.email}</td>
                  <td><span className={cn('badge text-[10px] capitalize', u.role === 'admin' ? 'badge-gold' : 'bg-obsidian-light text-ivory-muted border-obsidian-border')}>{u.role}</span></td>
                  <td className="text-xs">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
