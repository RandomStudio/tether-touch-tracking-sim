import './style.scss'

console.log("start");

const interactionArea = document.getElementById("interaction-area") as HTMLDivElement;

if (interactionArea) {
  interactionArea.addEventListener("pointerdown", (ev) => {
    const shadow = document.createElement("div");
      shadow.classList.add("shadow");
      shadow.style.left = `${ev.x}px`;
      shadow.style.top = `${ev.y}px`;

      interactionArea.appendChild(shadow);

      shadow.setPointerCapture(ev.pointerId);

      shadow.addEventListener("pointermove", (ev) => {
        shadow.style.left = `${ev.x}px`;
        shadow.style.top = `${ev.y}px`;
      });

      shadow.addEventListener("pointerup", (_ev) => {
        interactionArea.removeChild(shadow);
      });
  })
}