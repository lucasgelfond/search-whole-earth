<script lang="ts">
	import { onMount } from 'svelte';
	import { isDarkMode, toggleTheme } from '$lib';

	const SIZE = 24;
	const CENTER = 11.5;
	const R = 12;
	const R_SQ = R * R;
	const MAP_W = 36;
	const MAP_H = 18;
	const BASE_SPEED = (2 * Math.PI) / 8;
	const HOVER_SPEED = BASE_SPEED * 3;

	// 36x18 equirectangular continent map (10° per cell)
	const EARTH_MAP = [
		'000000000000000000000000000000000000',
		'000000000000111000000000000000110000',
		'000011111000111100110000001111110000',
		'000011111100001111111111111111111000',
		'000011111110001111111111111111111000',
		'000001111110000111111111111111111000',
		'000000111100000011111110011111000000',
		'000000001100000001111000011111000000',
		'000000000111000001111100000011100000',
		'000000000111110000111000000001110000',
		'000000000111110000011100000000110000',
		'000000000111110000001100000000111100',
		'000000000011100000001000000000111110',
		'000000000011000000000000000000011100',
		'000000000010000000000000000000000010',
		'000000000000000000000000000000000000',
		'000011111111111111111111111111110000',
		'000000011111111111111111111111000000',
	];

	// Circle mask with half-pixel center for perfect even-grid symmetry
	const circleMask: boolean[][] = Array.from({ length: SIZE }, (_, y) =>
		Array.from({ length: SIZE }, (_, x) => {
			const dx = x - CENTER;
			const dy = y - CENTER;
			return dx * dx + dy * dy <= R_SQ;
		})
	);

	// Outline: circle pixels with at least one non-circle neighbor
	const outlineMask: boolean[][] = Array.from({ length: SIZE }, (_, y) =>
		Array.from({ length: SIZE }, (_, x) => {
			if (!circleMask[y][x]) return false;
			return (
				!circleMask[y]?.[x - 1] || !circleMask[y]?.[x + 1] ||
				!circleMask[y - 1]?.[x] || !circleMask[y + 1]?.[x]
			);
		})
	);

	export let compact = false;

	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animFrame: number;
	let rotation = 0;
	let speed = BASE_SPEED;
	let hovering = false;
	let lastTime = 0;
	let darkMode = true;

	$: darkMode = $isDarkMode;

	function render(time: number) {
		const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
		lastTime = time;

		const target = hovering ? HOVER_SPEED : BASE_SPEED;
		speed += (target - speed) * Math.min(dt * 4, 1);
		rotation += speed * dt;

		ctx.clearRect(0, 0, SIZE, SIZE);

		const fg = darkMode ? '#fff' : '#000';
		const bg = darkMode ? '#000' : '#fff';

		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				if (!circleMask[y][x]) continue;

				// Outline pixels: always fg so the sphere boundary is visible
				if (outlineMask[y][x]) {
					ctx.fillStyle = fg;
					ctx.fillRect(x, y, 1, 1);
					continue;
				}

				// Interior pixels: project onto sphere
				const dx = x - CENTER;
				const dy = y - CENTER;
				const dz = Math.sqrt(Math.max(0, R_SQ - dx * dx - dy * dy));

				const lat = Math.asin(Math.max(-1, Math.min(1, -dy / R)));
				const lon = Math.atan2(dx, dz) + rotation;

				const mapY = Math.min(
					Math.max(0, Math.floor((0.5 - lat / Math.PI) * MAP_H)),
					MAP_H - 1
				);
				const normLon = (((lon / (2 * Math.PI)) % 1) + 1) % 1;
				const mapX = Math.floor(normLon * MAP_W) % MAP_W;

				ctx.fillStyle = EARTH_MAP[mapY][mapX] === '1' ? fg : bg;
				ctx.fillRect(x, y, 1, 1);
			}
		}

		animFrame = requestAnimationFrame(render);
	}

	onMount(() => {
		ctx = canvasEl.getContext('2d')!;
		animFrame = requestAnimationFrame(render);
		return () => cancelAnimationFrame(animFrame);
	});
</script>

<button
	aria-label="Toggle theme"
	class="toggle-btn"
	on:click={toggleTheme}
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
>
	<canvas bind:this={canvasEl} width={SIZE} height={SIZE} class="earth-canvas" class:compact />
</button>

<style>
	.toggle-btn {
		padding: 0;
		margin: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		line-height: 0;
		flex-shrink: 0;
	}

	.earth-canvas {
		width: 2.25rem;
		height: 2.25rem;
		image-rendering: -moz-crisp-edges;
		image-rendering: pixelated;
		display: block;
		transition:
			width 200ms cubic-bezier(0.645, 0.045, 0.355, 1),
			height 200ms cubic-bezier(0.645, 0.045, 0.355, 1);
	}

	@media (min-width: 768px) {
		.earth-canvas {
			width: 3rem;
			height: 3rem;
		}
	}

	.earth-canvas.compact {
		width: 1.25rem;
		height: 1.25rem;
	}

	@media (min-width: 768px) {
		.earth-canvas.compact {
			width: 1.75rem;
			height: 1.75rem;
		}
	}
</style>
