import { Output, TetherAgent } from "@tether/tether-agent";
import { encode } from "@msgpack/msgpack";
import { remap} from "@anselan/maprange";
import './style.scss'

const agent = new TetherAgent("trackingSim");

interface IDimensions {
  w: number;
  h: number;
}

const main = async(tetherHost: string | null, screen: IDimensions, outputDimensions: IDimensions) => {

  const statusEl = document.getElementById("status");
  if(statusEl) {
    statusEl.innerText = `Connecting Tether @ ${tetherHost}...`;
  }

  console.log("Connect Tether @ ", tetherHost, "...");
  try {
    await agent.connect({ protocol: "ws", host: tetherHost || undefined, port: 15675, path: "/ws"}, false);
    if (statusEl) { statusEl.innerText = `Connected OK @ ${tetherHost}`; }
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

  const m = {
    id, position: {x: newX, y: newY}
  };
  // @ts-ignore
  output.publish(encode(m));
  // TODO: Tether Agent should accept UInt8Array from browser?
}

window.onload = () => { 
  if (outputDimensions) {
    const [w,h] = outputDimensions?.split(",")
    const parsedOutputDimensions: IDimensions = {
      w: parseFloat(w),h: parseFloat(h)
    }
    console.log({ parsedOutputDimensions});
    main(
      tetherHost, 
      { w: window.innerWidth, h: window.innerHeight},
      parsedOutputDimensions
    ); 
  } else {
    throw Error("no output dimensions provided");
  }

}

