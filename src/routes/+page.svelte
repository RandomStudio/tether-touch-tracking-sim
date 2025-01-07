<script lang="ts">
  import { onMount } from "svelte";
  import Shadow from "./Shadow.svelte";
  import { fade } from "svelte/transition";
  import {
    BROKER_DEFAULTS,
    encode,
    OutputPlug,
    TetherAgent,
  } from "tether-agent";
  import { type TrackedPoint } from "$lib/types";
  import { remap, remapCoords } from "@anselan/maprange";

  interface ShadowObject {
    uuid: number;
    pointerId: number;
    x: number;
    y: number;
  }

  const OriginMode = {
    TOP_LEFT: "TOP_LEFT",
    TOP_CENTRE: "TOP_CENTRE",
    CENTRE_CENTRE: "CENTRE_CENTRE",
  } as const;
  type OriginModeEnum = (typeof OriginMode)[keyof typeof OriginMode];

  let index = $state(0);

  let originMode: OriginModeEnum = $state(OriginMode.CENTRE_CENTRE);
  let outputDimensions: null | [number, number] = $state(null);
  let inputDimensions: null | [number, number] = $state(null);

  let shadows: ShadowObject[] = $state([]);

  let interactionElement: HTMLDivElement;

  let agent: TetherAgent | null = $state(null);
  let outputPlug: OutputPlug | null = $state(null);

  const remapCoordsFromOrigin = (inC: [number, number]): [number, number] => {
    if (!inputDimensions || !outputDimensions) {
      throw Error("input and/or output dimensions not set");
    }
    const [inX, inY] = inC;
    switch (originMode) {
      case "TOP_LEFT": {
        const [x, y] = remapCoords(
          [inX, inY],
          inputDimensions,
          outputDimensions
        );
        return [x, y];
      }
      case "TOP_CENTRE": {
        return [
          remap(
            inX,
            [0, inputDimensions[0]],
            [-outputDimensions[0] / 2, outputDimensions[0] / 2]
          ),
          remap(inY, [0, inputDimensions[1]], [0, outputDimensions[1]]),
        ];
      }
      case "CENTRE_CENTRE": {
        return [
          remap(
            inX,
            [0, inputDimensions[0]],
            [-outputDimensions[0] / 2, outputDimensions[0] / 2]
          ),
          remap(
            inY,
            [0, inputDimensions[1]],
            [-outputDimensions[1] / 2, outputDimensions[1] / 2]
          ),
        ];
      }
    }
  };

  const publishUpdate = () => {
    const trackedPoints = shadows.map((shadow) => {
      if (inputDimensions && outputDimensions) {
        const [x, y] = remapCoordsFromOrigin([shadow.x, shadow.y]);
        const trackedPoint: TrackedPoint = {
          id: shadow.uuid,
          x,
          y,
          velocity: [0, 0],
        };
        return trackedPoint;
      }
    });
    if (outputPlug) {
      outputPlug.publish(encode(trackedPoints));
    }
  };

  onMount(async () => {
    // Input dimensions by window pixel size on mount...
    // (Careful: browser zoom level can mess this up a bit)
    inputDimensions = [window.innerWidth, window.innerHeight];

    // Some things defined (optionally) via searchParams...
    const params = new URL(document.location.toString()).searchParams;

    // Set up Tether agent using either the searchParams or current URL...
    const tetherHostParams = params.get("tetherHost");
    agent = await TetherAgent.create("displays", {
      brokerOptions: {
        ...BROKER_DEFAULTS.browser,
        host: tetherHostParams || window.location.hostname,
      },
    });

    // Also set up the Output Plug now...
    outputPlug = new OutputPlug(agent, "smoothedRemappedPoints");

    // Output dimensions set up via searchParams, or fall back to defaults...
    const dimensionsParams = params.get("dimensions");
    if (dimensionsParams) {
      const [width, height] = dimensionsParams
        .split(",")
        .map((i) => parseFloat(i));
      outputDimensions = [width, height];
    } else {
      console.warn(
        "No output dimensions provided through params dimensions?=width,height; use defaults"
      );
      outputDimensions = [2000, 2000];
    }

    // Origin mode switched via searchParams if specified
    const originModeParams = params.get("origin");
    if (originModeParams) {
      originMode = originModeParams as OriginModeEnum;
    }
  });
</script>

<svelte:head>
  <title>Tracking Simulation</title>
</svelte:head>

<div class="container">
  <div class="hud">
    {#if agent === null}
      <h1>Connecting...</h1>
    {/if}
    {#if inputDimensions && outputDimensions}
      <h1>
        Tracking sim: {inputDimensions[0]}x{inputDimensions[1]} => {outputDimensions[0]}x{outputDimensions[1]}
      </h1>
      <h2>Origin Mode: {originMode}</h2>
    {/if}
    <div>
      {JSON.stringify(shadows)}
    </div>
  </div>

  <div
    bind:this={interactionElement}
    class="interaction-area"
    onpointerdown={(ev) => {
      const { x, y, pointerId } = ev;
      shadows = [
        ...shadows,
        {
          uuid: index,
          pointerId,
          x,
          y,
        },
      ];
      index++;
    }}
  ></div>

  {#if inputDimensions}
    <div
      class="origin-marker"
      style:left={(originMode === OriginMode.TOP_LEFT
        ? "0"
        : inputDimensions[0] / 2) + "px"}
      style:top={(originMode.includes("TOP") ? "0" : inputDimensions[1] / 2) +
        "px"}
    >
      <div>+</div>
    </div>
  {/if}

  {#each shadows as shadow}
    <div transition:fade>
      <Shadow
        uuid={shadow.uuid}
        pointerId={shadow.pointerId}
        initX={shadow.x}
        initY={shadow.y}
        onPointerUp={(uuid) => {
          console.log("should remove", { uuid });
          shadows = [...shadows.filter((s) => s.uuid !== uuid)];
          publishUpdate();
        }}
        onPointerMove={(x, y) => {
          shadow.x = x;
          shadow.y = y;
          publishUpdate();
        }}
      />
    </div>
  {/each}
</div>

<style>
  .container {
    font-family: "Courier New", Courier, monospace;
    font-size: small;
  }

  .hud {
    pointer-events: none;

    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    color: white;
    padding: 1em;
  }

  .interaction-area {
    overflow: hidden;
    z-index: 0;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: blue;
    touch-action: none;
  }

  .origin-marker {
    opacity: 0.75;
    pointer-events: none;
    z-index: 2;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border: 1px dotted yellow;
    transform: translate(-50%, -50%);
    font-size: xx-large;
    color: yellow;
  }

  .origin-marker div {
    /* border: 1px solid gray; */
    font-size: xx-large;
    color: yellow;
  }
</style>
