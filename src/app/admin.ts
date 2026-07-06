import { api } from '@/lib/api.js';
import { state, patch } from './state';
import { flashToast } from './toast';

export function fetchAdmin() {
  if (state.role !== 'admin') return;
  patch({ adminLoading: true });
  api.adminOverview().then((ov: any) => {
    const users = ov.users || [];
    const selId = state.adminSelId && users.some((u: any) => u.id === state.adminSelId) ? state.adminSelId : users[0] ? users[0].id : null;
    patch({ adminUsers: users, adminSelId: selId, adminLoading: false });
    if (selId) fetchAdminUser(selId);
  }).catch((e: any) => {
    patch({ adminLoading: false });
    flashToast('后台数据加载失败：' + e.message);
  });
}

export function fetchAdminUser(id: string) {
  patch({ adminSelId: id });
  api.adminUser(id).then((d: any) => {
    patch({ adminRecords: d.records || [], adminUserErrors: d.errors || [] });
  }).catch(() => {});
}
