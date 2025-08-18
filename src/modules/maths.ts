export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function remap(x: number, min: number, max: number) {
	return (x - min) / (Math.abs(min - max))
}

export function clamp(x: number, min: number, max: number) {
	return Math.max(Math.min(x, max), min)
}