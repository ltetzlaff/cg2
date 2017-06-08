import { App } from "./engine"

window.addEventListener("DOMContentLoaded", () => {
  const e = new App(document.querySelector("#c") as HTMLCanvasElement)
  e.setupUIBindings()
  e.run()  
})