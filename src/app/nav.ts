import { patch } from './state';
import { fetchAdmin } from './admin';
import { loadFriends } from './friends';
import { scrollMsgs } from './chat';

export function go(view: string) {
  patch({ view, detailId: null, mobilePane: view === 'chat' || view === 'database' || view === 'friends' ? 'main' : 'list' }, () => {
    if (view === 'chat') scrollMsgs(true);
  });
  if (view === 'admin') fetchAdmin();
  if (view === 'friends') loadFriends();
}
