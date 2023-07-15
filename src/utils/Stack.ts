/**
 * A LIFO stack of objects
 * Can be used as a history the keeps only the last N entries.
 */

export default class Stack<T> {
  private buffer: T[];
  private limit: number;

  /**
   * @param init_elmts initial elements in the buffer.
   * @param limit maximum number of elements. If 0 or unset, no limit is
   *              applied. If {@link init_elmts} is a Queue and
   *              {@link limit} = 0, the limit is copied from the copied queue.
   */
  constructor(init_elmts: Iterable<T> = [], limit: number = 0) {
    this.buffer = Array.from(init_elmts);
    if (limit == 0 && init_elmts instanceof Stack)
      this.limit = init_elmts.limit;

    else
      this.limit = limit;
  }

  /**
   * number of items in the queue.
   */
  get length(): number {
    return this.buffer.length;
  }

  /**
   * oldest element in the queue. Next to be removed
   */
  get bottom(): T {
    return this.buffer[0];
  }

  /**
   * Most recent element in the queue.
   */
  get top(): T {
    return this.buffer[this.buffer.length - 1];
  }

  /**
   * Remove the oldest elements to fit the buffer size in the specified limit.
   * Nothing happens if the limit is not set (= 0).
   */
  private clean() {
    if (this.limit > 0 && this.buffer.length > this.limit)
      this.trimBottom(this.limit - this.buffer.length);
  }
  /**
   * Empty the buffer.
   */
  clear() {
    this.buffer.splice(0, this.buffer.length);
  }

  /**
   * Append the element at the end of the queue.
   * If the limit is exceeded, remove the oldest elements
   * @param elmt element to insert
   * @returns this
   */
  push(elmt: T): Stack<T> {
    this.buffer.push(elmt);
    this.clean();
    return this;
  }

  /**
   * Remove and return the most recent element in the stack
   * @returns the removed item
   */
  pop(): T | undefined {
    return this.buffer.pop();
  }

  /**
   * remove the top-most n elements from the stack
   * @param quantity number of elements to remove
   */
  trimTop(quantity: number) {
    if (quantity > this.buffer.length)
      quantity = this.buffer.length;
    this.buffer.splice(this.buffer.length - quantity);
  }

  /**
   * remove the bottom-most n elements from the stack
   * @param quantity number of elements to remove
   */
  trimBottom(quantity: number) {
    if (quantity > this.buffer.length)
      quantity = this.buffer.length;
    this.buffer.splice(0, quantity);
  }

  /**
   * Get the element at the specified index in the buffer
   * @param index index of the element to get
   * @returns the element in the buffer at {@link index}
   */
  get(index: number) {
    if (index >= 0)
      return this.buffer[index];

    else
      return this.buffer[this.buffer.length + index];
  }

  [Symbol.iterator]() {
    return this.buffer[Symbol.iterator]();
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[] {
    return this.buffer.map(callbackfn, thisArg);
  }
}
