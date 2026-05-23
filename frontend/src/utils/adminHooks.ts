import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, del, patch } from './apiClient';
import type { User, Conversation, Message, AuditLog } from '@open-arena/shared';

/* ───── Dashboard ───── */

export interface Stats {
  totalUsers: number;
  activeToday: number;
  totalConversations: number;
  messagesToday: number;
  last30Days: { date: string; count: number }[];
  topUsers: { id: string; username: string; email: string; _count: { conversations: number } }[];
}

export function useAdminStats(period: string = '30d') {
  return useQuery({
    queryKey: ['admin', 'stats', period],
    queryFn: () => get<Stats>(`/admin/stats?period=${period}`),
  });
}

/* ───── Users ───── */

export interface UserListResponse {
  items: User[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useAdminUsers(page: number = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['admin', 'users', { page, search }],
    queryFn: () => get<UserListResponse>(`/admin/users?${params}`),
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      patch(`/admin/users/${userId}/ban`, { ban: true, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      patch(`/admin/users/${userId}/ban`, { ban: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => del(`/admin/users/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

/* ───── Conversations ───── */

export function useAdminConversations(page: number = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['admin', 'conversations', { page, search }],
    queryFn: () =>
      get<{ items: Conversation[]; pagination: { page: number; pageSize: number; total: number } }>(
        `/admin/conversations?${params}`,
      ),
  });
}

/* ───── Audit Log ───── */

export function useAuditLog(page: number = 1) {
  return useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: () =>
      get<{ items: AuditLog[]; pagination: { page: number; pageSize: number; total: number } }>(
        `/admin/audit-log?page=${page}&pageSize=50`,
      ),
  });
}
