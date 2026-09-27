export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new RangeError("Duration must be a finite, non-negative number");
  }

  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainingSeconds]
      .map((value) => value.toString().padStart(2, "0"))
      .join(":");
  }

  return [minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}
