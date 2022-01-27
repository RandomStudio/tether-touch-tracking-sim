import { Output, TetherAgent } from "tether-agent";
import { encode } from "@msgpack/msgpack";
import { remap} from "@anselan/maprange";
import './style.scss'

const agent = new TetherAgent("trackingSim");

interface IDimensions {
  w: number;
  h: number;
}

const main = async(tetherHost: string | null, dimensions: IDimensions) => {
  console.log("Connect Tether @ ", tetherHost, "...");
  try {
    await agent.connect({ protocol: "ws", host: tetherHost || undefined, port: 15675, path: "/ws"}, false);
  } catch(e) {
    console.error("Tether connect error:", e);
  }

  const trackedObjects = await agent.createOutput("trackedPoints");

  const interactionArea = document.getElementById("interaction-area") as HTMLDivElement;

  if (interactionArea) {
    interactionArea.addEventListener("pointerdown", (ev) => {
      const shadow = document.createElement("div");
        shadow.classList.add("shadow");
        shadow.style.left = `${ev.x}px`;
        shadow.style.top = `${ev.y}px`;
  
        interactionArea.appendChild(shadow);
  
        shadow.setPointerCapture(ev.pointerId);

        sendTrackedObject(trackedObjects, ev.pointerId, ev.x, ev.y, dimensions);
  
        shadow.addEventListener("pointermove", (ev) => {
          shadow.style.left = `${ev.x}px`;
          shadow.style.top = `${ev.y}px`;
          sendTrackedObject(trackedObjects, ev.pointerId, ev.x, ev.y, dimensions);
          });
  
        shadow.addEventListener("pointerup", (_ev) => {
          interactionArea.removeChild(shadow);
        });
    })
  }
}

const urlParams = new URLSearchParams(window.location.search);
const tetherHost = urlParams.get("tetherHost");

const sendTrackedObject = (output: Output, id: number, inX: number, inY: number, inputDimensions: IDimensions) =>  {
  const [x,y] = [
    remap(inX, [0, inputDimensions.w], [0, 1]),
    remap(inY, [0, inputDimensions.h], [0,1])
  ];

  const m = {
    id, position: {x, y}
  };
  output.publish(Buffer.from(encode(m)));
}

window.onload = () => { main(tetherHost, { w: window.innerWidth, h: window.innerHeight}); }

