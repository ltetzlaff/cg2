import { ArcRotateCamera, Mesh, Vector3 } from "../../node_modules/babylonjs/dist/preview release/babylon.module"

export enum UIElementType {
  Checkbox, Radio, File, Numeric
}

export class UI {
  get(sel : string, type : UIElementType) : Boolean | FileList | string | number {
    switch (type) {
      case UIElementType.Checkbox:
        return getCheckbox($(sel))
      case UIElementType.File:
        return getFiles($(sel))
      case UIElementType.Radio:
        return getRadioValue(sel)
      case UIElementType.Numeric:
        return getFloat($(sel))
    }
  }

  bind(sel : string, type : UIElementType, cb : (x : any) => void) : void {
    switch (type) {
      case UIElementType.Checkbox:
        bindOnChangeCheckbox(sel, cb)
        break
      case UIElementType.Radio:
        bindOnChangeRadio(sel, cb)
        break
      case UIElementType.File:
        bindOnChangeFile(sel, cb)
        break
      case UIElementType.Numeric:
        bindOnChangeNumeric(sel, cb)
        break
    }
  }

  bindFileShortcuts(sel : string, cb : (fileName : string) => void) : void {
    $$(sel).forEach((el : Element) => {
      el.addEventListener("click", () => {
        cb(el.getAttribute("value"))
      })
    }) 
  }

  bindLightPivot(pivot : Mesh) {
    var lastX = 0
    var lastY = 0
    window.addEventListener("mousemove", ev => {
      const factor = 1/50
      const dx = (ev.offsetX - lastX) * factor
      const dy = (ev.offsetY - lastY) * factor
      lastX = ev.offsetX
      lastY = ev.offsetY
      if (ev.ctrlKey) {
        if (lastX !== 0) pivot.rotate(new Vector3(0, 0, 1), -dx)
        if (lastY !== 0) pivot.rotate(new Vector3(0, 1, 0), -dy)
      }
    })
  }

  bindCameraKeys(cam : ArcRotateCamera) {
    window.addEventListener("keydown", ev => {
      if (ev.keyCode == 107 || ev.keyCode == 81) cam.radius -= .1 // num+, q
      if (ev.keyCode == 106 || ev.keyCode == 69) cam.radius += .1 // num-, e
      if (ev.keyCode == 87) cam.beta += .1 // w
      if (ev.keyCode == 83) cam.beta -= .1 // s
      if (ev.keyCode == 65) cam.alpha += .1 // a
      if (ev.keyCode == 68) cam.alpha -= .1 // d
    })
  }
}

const $  = (selector : string) => document.querySelector(selector)
const $$ = (selector : string) => Array.prototype.slice.call(document.querySelectorAll(selector))
const getFloat = (el : EventTarget) => parseFloat(getString(el))
const getCheckbox = (el : EventTarget) => (el as HTMLInputElement).checked
const getString = (el : EventTarget) => (el as HTMLInputElement).value
const getRadio = (name : string) =>$$("input[name='" + name + "']") as HTMLInputElement[]
const getRadioValue = (name : string) => getRadio(name).find(el => el.checked).value
const getFiles = (el : EventTarget) => (el as HTMLInputElement).files

function bindOnChangeNumeric(selector : string, cb : (n: number) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFloat(ev.target))
}

function bindOnChangeCheckbox(selector : string, cb : (b: boolean) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getCheckbox(ev.target))
}

function bindOnChangeRadio(name : string, cb : (s : string) => void) {
  getRadio(name).forEach(el => {
    el.onchange = ev => {
      const i = ev.target
      if ((i as HTMLInputElement).checked) cb(getString(i))
    }
  })
}

function bindOnChangeFile(selector: string, cb : (fl : FileList) => void) {
  ;($(selector) as HTMLInputElement).onchange = ev => cb(getFiles(ev.target))
}