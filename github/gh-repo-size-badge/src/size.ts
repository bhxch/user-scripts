// github/gh-repo-size-badge/src/size.ts
//
// 纯函数：把 GitHub API 返回的 size（单位 KB）格式化成人类可读的体积文本。
// 入参不是合法数字（含 null/undefined/负数）时返回 null，调用方据此放弃显示。

export function formatSize(kb: number | null | undefined): string | null {
  if (typeof kb !== "number" || !Number.isFinite(kb) || kb < 0) return null;
  if (kb === 0) return "0 KB";

  const bytes = kb * 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unit = 0;
  let size = bytes;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}
