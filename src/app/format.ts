/** Backend <-> frontend display helpers (verbatim from the legacy module). */

export function lxPad(n: number) {
  return String(n).padStart(2, '0');
}

export function lxFmtDue(iso?: string | null) {
  if (!iso) return '待定';
  const d = new Date(iso), t = new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((sod(d).getTime() - sod(t).getTime()) / 86400000);
  const hm = lxPad(d.getHours()) + ':' + lxPad(d.getMinutes());
  if (diff === 0) return '今天 ' + hm;
  if (diff === 1) return '明天 ' + hm;
  if (diff === -1) return '昨天 ' + hm;
  if (diff > 1 && diff <= 6) return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return lxPad(d.getMonth() + 1) + '/' + lxPad(d.getDate());
}

export function lxIsToday(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso), t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
