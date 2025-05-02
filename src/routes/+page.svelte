<script lang="ts">
  import { onMount } from "svelte";
  import Shadow from "./Shadow.svelte";
  import CircleComponent from "./shapes/CircleComponent.svelte";
  import LineComponent from "./shapes/LineComponent.svelte";
  import { fade } from "svelte/transition";
  import {
    BROKER_DEFAULTS,
    encode,
    decode,
    OutputPlug,
    InputPlug,
    TetherAgent,
  } from "tether-agent";
  import { type TrackedPoint, type Circle, type Line, type Shape } from "$lib/types";
  import { remap, remapCoords } from "@anselan/maprange";
  import { getBearing, getRangeFromOrigin } from "$lib";

  interface ShadowObject {
    uuid: number;
    pointerId: number;
    x: number;
    y: number;
  }

  const OriginMode = {
    CORNER: "CORNER",
    CLOSE_CENTRE: "CLOSE_CENTRE",
    CENTRE: "CENTRE",
  } as const;
  type OriginModeEnum = (typeof OriginMode)[keyof typeof OriginMode];

  let index = $state(0);

  let originMode: OriginModeEnum = $state(OriginMode.CENTRE);
  let outputDimensions: null | [number, number] = $state(null);
  let inputDimensions: null | [number, number] = $state(null);

  let shadows: ShadowObject[] = $state([]);
  let outputPoints: TrackedPoint[] = $state([]);

  let interactionElement: HTMLDivElement | null = $state(null);

  let agent: TetherAgent | null = $state(null);
  let outputPlug: OutputPlug | null = $state(null);
  let shapesPlug: InputPlug | null = $state(null);

  let modeControl: "mouse" | "touch" | null = $state("mouse");
  let modeSending: "auto" | "onMove" | null = $state("auto");
  let intervalId: number | undefined = undefined;

  let shapes: Shape[] = $state([]);

  const delayAutoInterval: number = 100;

  const remapCoordsFromOrigin = (inC: [number, number]): [number, number] => {
    if (!inputDimensions || !outputDimensions) {
      throw Error("input and/or output dimensions not set");
    }
    const [inX, inY] = inC;
    switch (originMode) {
      case "CORNER": {
        const [x, y] = remapCoords(
          [inX, inY],
          inputDimensions,
          outputDimensions
        );
        return [x, y];
      }
      case "CLOSE_CENTRE": {
        return [
          remap(
            inX,
            [0, inputDimensions[0]],
            [outputDimensions[0] / 2, -outputDimensions[0] / 2]
          ),
          remap(inY, [0, inputDimensions[1]], [0, outputDimensions[1]]),
        ];
      }
      case "CENTRE": {
        return [
          remap(
            inX,
            [0, inputDimensions[0]],
            [-outputDimensions[0] / 2, outputDimensions[0] / 2]
          ),
          remap(
            inY,
            [0, inputDimensions[1]],
            [outputDimensions[1] / 2, -outputDimensions[1] / 2]
          ),
        ];
      }
    }
  };

  const remapCoordsFromOriginReverse = (inC: [number, number]): [number, number] => {
    if (!inputDimensions || !outputDimensions) {
      throw Error("input and/or output dimensions not set");
    }
    const [inX, inY] = inC;
    switch (originMode) {
      case "CORNER": {
        const [x, y] = remapCoords(
          [inX, inY],
          outputDimensions,
          inputDimensions,
        );
        return [x, y];
      }
      case "CLOSE_CENTRE": {
        return [
          remap(
            inX,
            [outputDimensions[0] / 2, -outputDimensions[0] / 2],
            [0, inputDimensions[0]]
          ),
          remap(inY, [0, outputDimensions[1]], [0, inputDimensions[1]],),
        ];
      }
      case "CENTRE": {
        return [
          remap(
            inX,
            [-outputDimensions[0] / 2, outputDimensions[0] / 2],
            [0, inputDimensions[0]],
          ),
          remap(
            inY,
            [outputDimensions[1] / 2, -outputDimensions[1] / 2],
            [0, inputDimensions[1]],
          ),
        ];
      }
    }
  };

  const deleteShadow = (uuid:number) => {
    console.log("Deleting: ", uuid);
    shadows = [...shadows.filter((s) => s.uuid !== uuid)];
    publishUpdate();
  }

  const roundValue = (value: number, digits:number) => {
    return Math.round(value * (10**digits)) / (10**digits);
  }

  const publishUpdate = () => {
    if (inputDimensions && outputDimensions) {
      outputPoints = shadows.map((shadow) => {
        const [x, y] = remapCoordsFromOrigin([shadow.x, shadow.y]);
        const bearing = getBearing(x, y);
        const range = getRangeFromOrigin(x, y);
        const trackedPoint: TrackedPoint = {
          id: shadow.uuid,
          x: roundValue(x, 0),
          y: roundValue(y, 0),
          bearing: roundValue(bearing, 0),
          range: roundValue(range, 0),
        };
        return trackedPoint;
      });
      if (modeSending == "auto") {
        if (intervalId != undefined) {
          clearInterval(intervalId);
        }
        if (outputPlug) {
          outputPlug?.publish(encode(outputPoints));
          intervalId = setInterval(() => {
            outputPlug?.publish(encode(outputPoints));
          }, delayAutoInterval);
        }
      }
      else {
        if (outputPlug) {
          outputPlug?.publish(encode(outputPoints));
        }
      }
    }
  };

  onMount(async () => {
    // Input dimensions by window pixel size on mount...
    // (Careful: browser zoom level can mess this up a bit)
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (width>height) {
      width = Math.round(1.4 * height);
    } else {
      height = Math.round(width / 1.4);
    }
    inputDimensions = [width, height];

    // Some things defined (optionally) via searchParams...
    const params = new URL(document.location.toString()).searchParams;
    // Set up the control mode (mouse/touch) via searchParams
    modeControl = params.get("control") as "mouse" | "touch" | null;
    if ((modeControl == "touch") || (modeControl == "mouse")) {
      console.log("Using control mode: ", modeControl);
    }
    else {
      console.warn("No valid control mode specified, defaulting to mouse");
      modeControl = "mouse";
    }
    // Set up the sending mode (auto/onMove) via searchParams
    modeSending = params.get("sending") as "auto" | "onMove" | null;
    if ((modeSending == "auto") || (modeSending == "onMove")) {
      console.log("Using sending mode: ", modeSending);
    }
    else {
      console.warn("No valid sending mode specified, defaulting to mouse");
      modeSending = "auto";
    }
    
    // Set up Tether agent using either the searchParams or current URL...
    const tetherHostParams = params.get("tetherHost");
    agent = await TetherAgent.create("displays", {
      brokerOptions: {
        ...BROKER_DEFAULTS.browser,
        host: tetherHostParams || window.location.hostname,
      },
    });

    // Also set up the Output and Input Plug now...
    outputPlug = new OutputPlug(agent, "smoothedTrackedPoints");
    shapesPlug = await InputPlug.create(agent, "shapesArea");

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
      outputDimensions = [7000, 5000];
    }

    // Origin mode switched via searchParams if specified (default to "CENTRE")
    const originModeParams = params.get("origin");
    if (originModeParams) {
      originMode = originModeParams as OriginModeEnum;
    }

    shapesPlug.on("message", async (payload) => {
      shapes = [...decode(payload) as Shape[]];
      shapes = shapes.map((shape) => {
        switch(shape.type) {
          case "Circle": {
            const circle = shape.shape as Circle;
            const [x, y] = remapCoordsFromOriginReverse([circle.center.x, circle.center.y]);
            let range = 0;
            if (outputDimensions && inputDimensions) {
              range = remapCoords([circle.detectionRange, circle.detectionRange], outputDimensions, inputDimensions)[0];
            }
            const newCircle = {
              center: { x, y },
              detectionRange: range,
            } as Circle
            return {
              type: shape.type,
              shape: newCircle,
            };
          }
          case "Line": {
            const line = shape.shape as Line;
            const [fromX, fromY] = remapCoordsFromOriginReverse([line.from.x, line.from.y]);
          const [toX, toY] = remapCoordsFromOriginReverse([line.to.x, line.to.y]);
          let thickness = 0;
          if (outputDimensions && inputDimensions) {
            thickness = remapCoords([line.thickness, line.thickness], outputDimensions, inputDimensions)[0];
          }
          const newLine = {
            from: {
              x: fromX,
              y: fromY,
            },
            to: {
              x: toX,
              y: toY, 
            },
            thickness: thickness,
          } as Line;
            return {
              type: shape.type,
              shape: newLine,
            };
          }
        }
      });
    });

    publishUpdate();
  });
</script>

<svelte:head>
  <title>Tracking Simulation</title>
</svelte:head>

{#if ((shadows.length > 0) && (modeControl == "mouse"))}
<div class="delete-area">
  {#each shadows as shadow (shadow.uuid)}
  <div in:fade out:fade>
    <button class="delete-btn" onclick={() => deleteShadow(shadow.uuid)}>
      {shadow.uuid}
    </button>
    <br />
    <br />
  </div>
  {/each}
</div>
{/if}

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
      Points: {shadows.length} to {outputPoints.length} output
    </div>
  </div>

  {#if inputDimensions}
    <div
      bind:this={interactionElement}
      class="interaction-area"
      style:width={inputDimensions[0] + "px"}
      style:height={inputDimensions[1] + "px"}
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
  {/if}

  {#if inputDimensions}
    <div
      class="origin-marker"
      style:left={(originMode === OriginMode.CORNER
        ? "0"
        : inputDimensions[0] / 2) + "px"}
      style:top={(originMode.includes("TOP") ? "0" : inputDimensions[1] / 2) +
        "px"}
    >
      <div>+</div>
    </div>
  {/if}
  
  {#each shapes as shape}
  {#if shape.type=="Circle"}
    <CircleComponent
    center={(shape.shape as Circle).center}
    detectionRange={(shape.shape as Circle).detectionRange}
  />
  {:else if shape.type=="Line"}
  <LineComponent
    from={(shape.shape as Line).from}
    to={(shape.shape as Line).to}
    thickness={(shape.shape as Line).thickness}
  />
  {/if}
  {/each}

  {#each shadows as shadow (shadow.uuid)}
    <div transition:fade>
      <Shadow
        uuid={shadow.uuid}
        pointerId={shadow.pointerId}
        initX={shadow.x}
        initY={shadow.y}
        onPointerUp={async () => {
          await publishUpdate();
          if (modeControl=="touch") {
            deleteShadow(shadow.uuid);
          }
        }}
        onPointerMove={async (x, y) => {
          shadow.x = x;
          shadow.y = y;
          await publishUpdate();
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
    bottom: 0;
    left: 0;
    color: gray;
    padding: 1em;
  }

  .interaction-area {
    overflow: hidden;
    z-index: 0;
    position: fixed;
    top: 0;
    left: 0;
    background-color: blue;
    border: 2px solid red;
    box-sizing: border-box;
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

  .delete-btn {
    cursor: pointer;
    background-color: rgb(210, 210, 210);
    border: black 1px solid;
    padding: 0.5em;
    font-size: large;
    cursor: pointer;
  }

  .delete-area {
    max-height: 95vh;
    overflow: auto;
    position: fixed;
    top: 5px;
    right: 5px;
    z-index: 1;
    padding: 0.5em;
    font-size: large;
  }
</style>
