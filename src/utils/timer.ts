
export default class Timer {
  private time: number
  private timestamp: number
  private callback: ()=>void
  private timeout: NodeJS.Timeout|NodeJS.Timer|0 // setTimeout ref. underlying type is number
  private loop: boolean

  constructor(time_ms: number, callback: ()=>void, loop=false) {
    this.time = time_ms
    this.timeout = 0
    this.timestamp = 0
    this.loop = loop
    this.callback = callback
  }
  get started() {
    return this.timeout != 0
  }

  start() {
    this.timestamp = Date.now()
    this.cancel() // cancel if previously started
    if (this.loop) {
      this.timeout = setInterval(this.callback, this.time)
    } else {
      this.timeout = setTimeout(this.callback, this.time)
    }
  }

  pause() {
    if (this.timeout) {
      if (this.loop) {
        clearInterval(this.timeout)
      } else {
        clearTimeout(this.timeout)
        const elapsed_time = Date.now() - (this.timestamp as number)
        this.time -= elapsed_time
      }
      //does not set timeout = 0: allow skip() to work when timer is paused
    }
  }

  cancel() {
    if (this.timeout) {
      if (this.loop) {
        clearInterval(this.timeout)
      } else {
        clearTimeout(this.timeout)
      }
      this.timeout = 0
    }
  }

  skip()
  {
    if (this.timeout) {
      if (!this.loop) {
        clearTimeout(this.timeout)
        this.timeout = 0
      }
      queueMicrotask(this.callback) // calls callback as soon as the processor is free
    }
  }
}

export const commands = {
  'resettimer': null, // all 'waittimer' are immediately after 'resettimer'
  'waittimer' : processTimerCmd,
  '!w'        : processTimerCmd,
}

function processTimerCmd(arg: string, _: string, onFinish: VoidFunction) {
  const time_to_wait = parseInt(arg)
  const timer = new Timer(time_to_wait, onFinish)
  timer.start()
  return {next: timer.skip.bind(timer)}
}