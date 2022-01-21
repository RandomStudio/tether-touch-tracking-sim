import { Output, TetherAgent } from "tether-agent";
import { encode } from "@msgpack/msgpack";
import './style.scss'

const agent = new TetherAgent("trackingSim");

const main = async(tetherHost: string | null) => {
  console.log("Connect Tether @ ", tetherHost, "...");
  try {
    await agent.connect({ protocol: "ws", host: tetherHost || undefined, port: 15675, path: "/ws"}, false);
  } catch(e) {
    console.error("Tether connect error:", e);
  }

  const trackedObjects = await agent.createOutput("trackedObjects");

  const interactionArea = document.getElementById("interaction-area") as HTMLDivElement;

  if (interactionArea) {
    interactionArea.addEventListener("pointerdown", (ev) => {
      const shadow = document.createElement("div");
        shadow.classList.add("shadow");
        shadow.style.left = `${ev.x}px`;
        shadow.style.top = `${ev.y}px`;
  
        interactionArea.appendChild(shadow);
  
        shadow.setPointerCapture(ev.pointerId);

        sendTrackedObject(trackedObjects, ev.pointerId, ev.x, ev.y);
  
        shadow.addEventListener("pointermove", (ev) => {
          shadow.style.left = `${ev.x}px`;
          shadow.style.top = `${ev.y}px`;
          sendTrackedObject(trackedObjects, ev.pointerId, ev.x, ev.y);
          });
  
        shadow.addEventListener("pointerup", (_ev) => {
          interactionArea.removeChild(shadow);
        });
    })
  }
}

const urlParams = new URLSearchParams(window.location.search);
const tetherHost = urlParams.get("tetherHost");

const sendTrackedObject = (output: Output, id: number, x: number, y: number) =>  {
  const m = {
    id, x, y
  };
  output.publish(encode(m));
}

window.onload = () => { main(tetherHost); }

