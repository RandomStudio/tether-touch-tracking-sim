<script lang="ts">
    import type { Circle } from '$lib/types';

	const circle: Circle = $props();

	const x = circle.center.x;
	const y = circle.center.y;
	const range = circle.detectionRange;

</script>

<div
	class="circle"
	style:left={x + 'px'}
	style:top={y + 'px'}
	style:width={range + 'px'}
	style:height={range + 'px'}
>
</div>

<style>
	.circle {
		z-index: 8;
		border-radius: 50%;
		pointer-events: none;
		position: absolute;
		display: inline-block;
		transform: translate(-50%, -50%);
		background-color: rgb(128, 0, 0, 0.8);
		font-weight: bold;
		color: white;
		touch-action: none;
	}
</style>
