import { api } from '@/lib/api.js';
import { state, patch } from './state';
import { flashToast } from './toast';
import { loadState } from './session';

export function loadFriends() {
  api.friends().then((f: any) => patch({ friends: { accepted: f.friends || [], incoming: f.incoming || [], outgoing: f.outgoing || [] } })).catch(() => {});
}

export function submitAddFriend() {
  const email = (state.addFriendEmail || '').trim();
  if (!email) { flashToast('请输入对方的注册邮箱'); return; }
  api.friendRequest(email).then((r: any) => {
    patch({ addFriendEmail: '' });
    flashToast(r.autoAccepted ? '你们互相发过请求 · 已直接成为好友' : r.already ? '你们已经是好友了' : r.pending ? '请求已在等待对方处理' : '好友请求已发送');
    loadFriends();
    if (r.autoAccepted) api.team().then((t: any) => patch({ team: t.users || [] })).catch(() => {});
  }).catch((e: any) => flashToast('发送失败：' + e.message));
}

export function respondFriendUi(friendshipId: string, accept: boolean) {
  api.friendRespond(friendshipId, accept).then(() => {
    flashToast(accept ? '已成为好友 · 现在可以互相 @ 与邀请协作' : '已拒绝（不会通知对方）');
    loadFriends();
    return loadState();
  }).catch((e: any) => flashToast('操作失败：' + e.message));
}

export function removeFriendUi(f: any) {
  if (!window.confirm('解除与「' + f.name + '」的好友关系？已有协作任务不受影响，但不能再互相邀请。')) return;
  api.friendRemove(f.friendshipId).then(() => {
    flashToast('已解除好友');
    loadFriends();
    api.team().then((t: any) => patch({ team: t.users || [] })).catch(() => {});
  }).catch((e: any) => flashToast('操作失败：' + e.message));
}

export function withdrawFriendUi(f: any) {
  api.friendRemove(f.friendshipId).then(() => { flashToast('已撤回好友请求'); loadFriends(); }).catch((e: any) => flashToast('操作失败：' + e.message));
}

export function respondInviteUi(n: any, mode: any) {
  api.respondInvite(n.actionRef, mode, true).then(() => {
    flashToast(mode === 'follow' ? '已关注 · 进展会通知你' : mode ? '已加入协作 · 任务已进入你的数据库' : '已婉拒邀请');
    return loadState();
  }).catch((e: any) => flashToast('操作失败：' + e.message));
}
