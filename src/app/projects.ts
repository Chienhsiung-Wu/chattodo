import { api } from '@/lib/api.js';
import { state, patch, COLOR_POOL } from './state';
import { flashToast } from './toast';

export function submitNewProject() {
  const name = (state.newProjName || '').trim();
  if (!name) { flashToast('请输入项目名称'); return; }
  api.createProject(name, '').then((p: any) => {
    patch((s) => ({
      projects: [...s.projects, { id: p.id, name: p.name, desc: p.description || '', status: '进行中', color: COLOR_POOL[s.projects.length % COLOR_POOL.length] }],
      newProjOpen: false, newProjName: '', selProjectId: p.id,
    }));
    flashToast('项目已创建 · 聊天里提到项目名会自动归属');
  }).catch((e: any) => flashToast('创建失败：' + e.message));
}
