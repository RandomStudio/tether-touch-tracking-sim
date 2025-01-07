<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		uuid: number;
		initX: number;
		initY: number;
		pointerId: number;
		onPointerUp: (uuid: number) => void;
		onPointerMove: (x: number, y: number) => void;
	}

	let { initX, initY, pointerId, uuid, onPointerUp, onPointerMove }: Props = $props();

	let element: HTMLDivElement;

	let capturedPointerId: number | null = $state(pointerId);

	let x = $state(initX);
	let y = $state(initY);

	onMount(() => {
		element.setPointerCapture(pointerId);
	});
</script>

<div
	bind:this={element}
	class="shadow"
	style:left={x + 'px'}
	style:top={y + 'px'}
	onpointerdown={(e) => {
		element.setPointerCapture(e.pointerId);
		const { pointerId } = e;
		console.log('onpointerdown', pointerId);
		capturedPointerId = pointerId;
		x = e.x;
		y = e.y;
	}}
	onpointerup={(e) => {
		element.releasePointerCapture(e.pointerId);
		capturedPointerId = null;
		setTimeout(() => {
			onPointerUp(uuid);
		}, 1000);
	}}
	onpointermove={(e) => {
		if (capturedPointerId != e.pointerId) return;

		e.preventDefault();
		e.stopPropagation();

		x += e.movementX;
		y += e.movementY;

		onPointerMove(x, y);
	}}
>
	{uuid}: {capturedPointerId}
</div>

<style>
	.shadow {
		border-radius: 50%;
		position: absolute;
		display: inline-block;
		width: 15vw;
		height: 15vw;
		transform: translate(-50%, -50%);
		background-color: green;
		font-weight: bold;
		color: white;
		touch-action: none;
	}
</style>
