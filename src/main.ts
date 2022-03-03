import { Output, TetherAgent } from "@tether/tether-agent";
import { encode } from "@msgpack/msgpack";
import { remap} from "@anselan/maprange";
import './style.scss'


interface IDimensions {
  w: number;
  h: number;
}

export interface TrackedPoint2D {
  id: number;
  size?: number;
  x: number;
  y: number;
}

const main = async(agent: TetherAgent, screen: IDimensions, outputDimensions: IDimensions) => {



  const statusEl = document.getElementById("status");
  if(statusEl) {
    statusEl.innerText = `Connecting Tether @ ${tetherHost}...`;
  }

  const trackedObjects = agent.createOutput("trackedPoints");

  const interactionArea = document.getElementById("interaction-area") as HTMLDivElement;

  if (interactionArea) {

    interactionArea.addEventListener("pointerdown", (ev) => {
      const shadow = document.createElement("div");
        shadow.classList.add("shadow");
        shadow.style.left = `${ev.x}px`;
        shadow.style.top = `${ev.y}px`;
  
        interactionArea.appendChild(shadow);
        shadow.innerText = ev.pointerId.toString();
  
        shadow.setPointerCapture(ev.pointerId);

        const { x, y, pointerId} = ev;
        sendTrackedObject(trackedObjects, pointerId, x, y, screen,   outputDimensions);
  
        shadow.addEventListener("pointermove", (ev) => {
          shadow.style.left = `${ev.x}px`;
          shadow.style.top = `${ev.y}px`;
          sendTrackedObject(trackedObjects, ev.pointerId, ev.x, ev.y, screen,   outputDimensions);
          });
  
        shadow.addEventListener("pointerup", (_ev) => {
          interactionArea.removeChild(shadow);
        });
    })

    
  }
}

const urlParams = new URLSearchParams(window.location.search);
const tetherHost = urlParams.get("tetherHost");
const outputDimensions = urlParams.get("outputDimensions");


console.log({ tetherHost, outputDimensions });

const sendTrackedObject = (
  output: Output, id: number, x: number, y: number,
  inputDimensions: IDimensions, outputDimensions: IDimensions
) =>  {
  const [newX,newY] = [
    remap(x, [0, inputDimensions.w], [0, outputDimensions.w]),
    remap(y, [0, inputDimensions.h], [0,outputDimensions.h])
  ];

  const m: TrackedPoint2D[] = [{
    id, x: newX, y: newY
  }];
  output.publish(encode(m));
}

const connect = async(tetherHost: string | null, parsedOutputDimensions: IDimensions) => {
  console.log("Connect Tether @ ", tetherHost, "...");

  const agent = await TetherAgent.create("trackingSim", { protocol: "ws", host: tetherHost || undefined, port: 15675, path: "/ws"});
  main(
    agent,
    { w: window.innerWidth, h: window.innerHeight},
    parsedOutputDimensions
  ); 
}

window.onload = () => { 
  if (outputDimensions) {
    const [w,h] = outputDimensions?.split(",")
    const parsedOutputDimensions: IDimensions = {
      w: parseFloat(w),h: parseFloat(h)
    }
    console.log({ parsedOutputDimensions});
    connect(tetherHost, parsedOutputDimensions);
  } else {
    throw Error("no output dimensions provided");
  }

}

