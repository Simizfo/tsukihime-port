import { Page } from "../types"
import { HISTORY_MAX_PAGES } from "./constants"
import { SaveState, createSaveState } from "./savestates"

class History {
  private pages: Page[]
  private limit: number
  private listeners: VoidFunction[]

  /**
   * @param limit maximum number of pages. If 0 or unset, no limit is
   *              applied.
   */
  constructor(limit: number = 0) {
    this.pages = []
    this.limit = limit
    this.listeners = []
  }

  /**
   * number of items in the queue.
   */
  get length(): number {
    return this.pages.length
  }

  get empty(): boolean {
    return this.pages.length > 0
  }

  /**
   * oldest page in the queue. Next to be removed
   */
  get first(): Page {
    return this.pages[0]
  }

  /**
   * Most recent page in the queue.
   */
  get last(): Page {
    return this.pages[this.pages.length - 1]
  }

  /**
   * Get the page at the specified index in the buffer
   * @param index index of the page to get
   * @returns the page in the buffer at {@link index}
   */
  get(index: number) {
    if (index >= 0)
      return this.pages[index]
    else
      return this.pages[this.pages.length + index]
  }

  /**
   * Remove the oldest pages to fit the buffer size in the specified limit.
   * Nothing happens if the limit is not set (= 0).
   */
  private clean() {
    const overflow = this.pages.length - this.limit
    if (this.limit > 0 && overflow > 0)
      this.trimFirsts(overflow)
  }

  /**
   * Empty the buffer.
   */
  clear() {
    this.pages.splice(0, this.pages.length)
    this.onChange()
  }

  /**
   * Append the element at the end of the queue.
   * If the limit is exceeded, remove the oldest pages
   * @param elmt element to insert
   * @returns this
   */
  push(elmt: Page): typeof this {
    this.pages.push(elmt)
    this.clean()
    this.onChange()
    return this
  }

  /**
   * Push a new page to the history
   * @param createSS true if the new page must have a save-state
   * @param contentType type of the page
   */
  createPage(createSS: boolean = true, contentType: Page['contentType'] = 'text') {
    this.push({
      saveState: createSS ? createSaveState() : undefined,
      contentType,
      text: ""
    })
  }

  onPageBreak(createSS: boolean = true, contentType: Page['contentType'] = 'text') {
    if (this.last?.text.length == 0)
      this.pages.pop() // remove empty pages from history
    this.createPage(createSS, contentType)
  }

  /**
   * Remove and return the most recent element in the stack
   * @returns the removed item
   */
  pop(): Page | undefined {
    const page = this.pages.pop()
    if (page)
      this.onChange()
    return page
  }

  /**
   * remove the top-most n elements from the stack
   * @param quantity number of elements to remove
   */
  private trimLasts(quantity: number) {
    if (quantity > this.pages.length)
      quantity = this.pages.length
    this.pages.splice(this.pages.length - quantity)
  }

  /**
   * remove the bottom-most n elements from the stack
   * @param quantity number of elements to remove
   */
  private trimFirsts(quantity: number) {
    if (quantity > this.pages.length)
      quantity = this.pages.length
    this.pages.splice(0, quantity)
  }

  onSaveStateLoaded(saveState: SaveState) {
    let i = this.pages.findLastIndex(page=>page.saveState == saveState)
    if (i == -1)
      i = 0
    this.trimLasts(this.pages.length - i)
    this.onChange()
  }

  /**
   * Listen for pages addition or removal.
   * @param listener callback function
   */
  addListener(listener: VoidFunction) {
    this.listeners.push(listener)
  }

  removeListener(listener: VoidFunction): boolean {
    const i = this.listeners.indexOf(listener)
    if (i == -1)
      return false
    this.listeners.splice(i, 1)
    return true
  }

  private onChange() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  [Symbol.iterator]() {
    return this.pages[Symbol.iterator]()
  }
}

const history = new History(HISTORY_MAX_PAGES)

export default history
