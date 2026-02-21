<script lang="ts">
	import { onMount } from 'svelte';
	import { isDarkMode, toggleTheme } from '$lib';

	const SIZE = 23;
	const CENTER = 11;
	const R = 11;
	const R_SQ = R * R;
	const MAP_W = 24;
	const MAP_H = 12;
	const BASE_SPEED = (2 * Math.PI) / 6;
	const HOVER_SPEED = BASE_SPEED * 3;

	// 23x23 pixel circle with proper taper at poles
	// Widths: 5,9,11,13,15,17,19,19,21,21,21,23,21,21,21,19,19,17,15,13,11,9,5
	const CIRCLE = [
		'00000000011111000000000',
		'00000001111111110000000',
		'00000011111111111000000',
		'00000111111111111100000',
		'00001111111111111110000',
		'00011111111111111111000',
		'00111111111111111111100',
		'00111111111111111111100',
		'01111111111111111111110',
		'01111111111111111111110',
		'01111111111111111111110',
		'11111111111111111111111',
		'01111111111111111111110',
		'01111111111111111111110',
		'01111111111111111111110',
		'00111111111111111111100',
		'00111111111111111111100',
		'00011111111111111111000',
		'00001111111111111110000',
		'00000111111111111100000',
		'00000011111111111000000',
		'00000001111111110000000',
		'00000000011111000000000',
	];

	// 24x12 equirectangular continent map (15° per cell)
	const EARTH_MAP = [
		'000001000000000000000000',
		'000111100011100011111000',
		'000111100011110011111100',
		'000111110011111001111100',
		'000011100011111001111000',
		'000001110001110000111000',
		'000000111001110000011100',
		'000000111000110000001110',
		'000000011000010000011100',
		'000000010000000000001000',
		'000000000000000000000000',
		'000000011111111110000000',
	];

	// Precompute outline: circle pixels adjacent to empty space
	const OUTLINE: boolean[][] = Array.from({ length: SIZE }, (_, y) =>
		Array.from({ length: SIZE }, (_, x) => {
			if (CIRCLE[y][x] === '0') return false;
			return (
				x === 0 || x === SIZE - 1 || y === 0 || y === SIZE - 1 ||
				CIRCLE[y][x - 1] === '0' || CIRCLE[y][x + 1] === '0' ||
				CIRCLE[y - 1]?.[x] === '0' || CIRCLE[y + 1]?.[x] === '0'
			);
		})
	);

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
				if (CIRCLE[y][x] === '0') continue;

				if (OUTLINE[y][x]) {
					ctx.fillStyle = fg;
					ctx.fillRect(x, y, 1, 1);
					continue;
				}

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
	<canvas bind:this={canvasEl} width={SIZE} height={SIZE} class="earth-canvas" />
</button>

<style>
	.toggle-btn {
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		line-height: 0;
	}

	.earth-canvas {
		width: 2.25rem;
		height: 2.25rem;
		image-rendering: -moz-crisp-edges;
		image-rendering: pixelated;
		display: block;
	}

	@media (min-width: 768px) {
		.earth-canvas {
			width: 3rem;
			height: 3rem;
		}
	}
</style>
