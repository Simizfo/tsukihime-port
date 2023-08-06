import { TouchEvent, TouchEventHandler } from "react"

type Direction = ""|"left"|"right"|"up"|"down"

export type SwipeListener = (direction: Direction, distance: number, event: TouchEvent, dx: number, dy: number)=>boolean|void
const events = ["touchstart", "touchmove", "touchend", "touchcancel"]
export class GestureHandler {
  private _onTouch: TouchEventHandler
  private swipeListener: SwipeListener|undefined
  private element: HTMLElement|undefined
  private minDistance: number
  private moveTriggered = false
  private start =  {x: -1, y: -1, id: -1}
  private lastTouch = {x: -1, y: -1}
  constructor(element: HTMLElement|null|undefined, {
      swipeTrigDistance = 20, onSwipe = undefined as SwipeListener|undefined} = {}) {
    this._onTouch = this.touchEventHandler.bind(this)
    this.minDistance = swipeTrigDistance
    this.swipeListener = onSwipe
    if (element) {
      this.enable(element)
    }
  }
  enable(element: HTMLElement) {
    this.disable()
    this.element = element
    for (const evt of events) {
      element.addEventListener(evt, this._onTouch as unknown as (event: Event)=>void, {passive: false})
    }
  }
  disable() {
    if (this.element) {
      for (const evt of events) {
        this.element.removeEventListener(evt, this._onTouch as unknown as (event: Event)=>void)
      }
    }
  }

  get onTouch() {
    return this._onTouch
  }

  private touchEventHandler(event: TouchEvent) {
    switch(event.type) {
      case "touchstart" :
        this.start.x = event.targetTouches[0].screenX
        this.start.y = event.targetTouches[0].screenY
        this.start.id = event.targetTouches[0].identifier
        break
      case "touchmove" :
      case "touchend" :
        if (this.start.x == -1)
          return
        if (event.type == "touchmove") {
          const touch = Array.from(event.targetTouches).find(touch=>touch.identifier == this.start.id)
          if (!touch) {
            this.cancel()
            return;
          }
          const {screenX: x, screenY: y} = touch
          this.lastTouch.x = x
          this.lastTouch.y = y
        }
        else if (this.lastTouch.x == -1) {
          this.cancel()
          return
        }
        const dx = this.lastTouch.x - this.start.x;
        const dy = this.lastTouch.y - this.start.y;
        const distX = Math.abs(dx), distY = Math.abs(dy)
        const dist = Math.max(distX, distY)
        const dir = distX > distY * 2 ? (dx > 0 ? "right" : "left")
                  : distY > distX * 2 ? (dy > 0 ? "down" : "up")
                  : ""
        if (!this.moveTriggered &&
            dir != "" && dist > this.minDistance)
          this.moveTriggered = true;
        if (this.moveTriggered) {
          if (this.swipeListener?.(dir, dist, event, dx, dy)) {
            event.preventDefault()
            this.cancel()
          }
        }
        if (event.type == "touchend")
          this.cancel()
        break
      case "touchcancel" :
        if (this.moveTriggered)
          this.swipeListener?.("", 0, event, 0, 0)
        this.cancel()
        break
    }
  }
  cancel() {
    this.moveTriggered = false
    this.start.x = -1
    this.start.y = -1
    this.start.id = -1
    this.lastTouch.x = -1
    this.lastTouch.y = -1
  }
}

export default GestureHandler