
export default class Timer {
  private time: number
  private timestamp: number|undefined
  private callback: ()=>void
  private timeout: NodeJS.Timeout|NodeJS.Timer|undefined // setTimeout ref
  private loop: boolean

  constructor(time_ms: number, callback: ()=>void, loop=false) {
    this.time = time_ms
    this.callback = callback
    this.loop = loop
  }

  start() {
    this.timestamp = Date.now()
    if (this.loop) {
      this.timeout = setInterval(this.callback, this.time)
    } else {
      this.timeout = setTimeout(this.callback, this.time)
    }
  }

  pause() {
    if (this.timeout !== undefined) {
      if (this.loop) {
        clearInterval(this.timeout)
      } else {
        clearTimeout(this.timeout)
        const elapsed_time = Date.now() - (this.timestamp as number)
        this.time -= elapsed_time
      }
    }
  }

  cancel() {
    if (this.loop) {
      clearInterval(this.timeout)
    } else {
      clearTimeout(this.timeout)
    }
  }

  skip()
  {
    if (!this.loop) {
      clearTimeout(this.timeout)
    }
    queueMicrotask(this.callback) // calls callback as soon as the processor is free
  }
}
