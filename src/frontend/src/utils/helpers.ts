export function formatRelativeTime(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const now = Date.now();
  const diff = now - ms;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 10) return `${seconds}s ago`;
  return "Just now";
}

export function formatTimestamp(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleString();
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "seniorAdmin":
      return "Senior Admin";
    case "staff":
      return "Staff";
    default:
      return role;
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "owner":
      return "text-yellow-700 bg-yellow-100 border border-yellow-300";
    case "seniorAdmin":
      return "text-amber-700 bg-amber-100 border border-amber-300";
    case "staff":
      return "text-slate-600 bg-slate-100 border border-slate-300";
    default:
      return "text-slate-600 bg-slate-100 border border-slate-300";
  }
}

export function getInitials(username: string): string {
  return username
    .split(/[_\s-]/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(username: string): string {
  const colors = [
    "bg-orange-700",
    "bg-amber-700",
    "bg-yellow-700",
    "bg-red-700",
    "bg-rose-700",
    "bg-orange-800",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
