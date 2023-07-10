import { Choice } from "../types";

const LOGIC_FILE = 'scene0.txt'

/*
 * Fetch and split the script into lines
 */
export const fetchScene = async (scene: number):Promise<string[]> => {
  const script = await fetch(`./scenes/scene${scene}.txt`)

  const data = await script.text();

  //split data on \n or @
  const result = data.split(/[\n\r]/).filter(line=>line.length > 0)

  return result
}

export const fetchF = async (sceneNumber: number):Promise<any> => {
  const script = await fetch(`./scenes/` + LOGIC_FILE)

  const data = await script.text();

  //keep only lines after *f sceneNumber and before *f sceneNumber + 1
  const lines = data.split(/[\n\r@]/)
  const result: any = {};

  let i = 0
  let start = false
  let end = false
  lines.forEach((line, _index) => {
    if (line === ('*f' + sceneNumber)) {
      start = true
    }
    if (line === ('*f' + (sceneNumber + 1))) {
      end = true
    }
    if (start && !end) {
      result[i] = line
      i++
    }
  })

  return result
}

export const fetchChoices = async (sceneNumber: number):Promise<any> => {
  const result = await fetchF(sceneNumber)

  //if line starts with select, keep it and the lines after
  const selectResult: any = [];
  let j = 0
  let selectStart = false
  let selectEnd = false
  Object.keys(result).forEach((key) => {
    if (result[key].startsWith('select')) {
      selectStart = true
    }

    if (selectStart && !selectEnd) {
      selectResult[j] = result[key]
      j++
    }
  })

  //remove select and tab from the lines
  Object.keys(selectResult).forEach((key) => {
    selectResult[key] = selectResult[key].replace('select `', '')
    selectResult[key] = selectResult[key].replace('\t`', '')
    if (selectResult[key] === '') {
      delete selectResult[key]
    }
  })

  let choices:Choice[] = []
  //split on ` and remove ,*f
  selectResult.forEach((line:string) => {
    const libe = line.split('`, *f')[0]
    const f = parseInt(line.split('`, *f')[1])
    choices.push({libe, f})
  })

  return choices
}

export const fetchGoToNextScene = async (sceneNumber: number):Promise<number> => {
  const result = await fetchF(sceneNumber)
  console.log("scene", sceneNumber)

  //if line starts with gosub *s keep the number after
  let goToNextScene = 0
  Object.keys(result).forEach((key) => {
    if (result[key].startsWith('goto *f')) {
      goToNextScene = parseInt(result[key].replace('goto *f', ''))
    }
  })

  return goToNextScene
}

export const addEventListener = ({event, handler, element = window}: any) => {
  element.addEventListener(event, handler)
  return () => element.removeEventListener(event, handler)
}

export function convertText(text: string, key: any = undefined): JSX.Element {

  const nodes: Array<JSX.Element|string> = []
  if ( text.length > 0 && text != "br") {
    //remove '`', '@' and '\',
    //replace '|' with '…'
    text = text.replace(/[`@\\]|(\!w\d+\b)/g, '')
              .replace(/\|/g, '…')

    //replace consecutive dashes with a continuous line
    //TODO make text transparent in CSS, replace with straight line.
    let m
    while ((m = /-{2,}/g.exec(text)) !== null) {
      if (m.index > 0)
        nodes.push(text.substring(0, m.index))
      const len = m[0].length
      nodes.push(<span className="dash" dash-size={len}>
          {"\u{2002}".repeat(len) /*en-dash-sized space*/}
        </span>)
      text = text.substring(m.index + len)
    }
    if (text.length > 0)
      nodes.push(text)
  }
  if (key !== undefined)
    return <span key={key}>{...nodes}</span>
  else
    return <span>{...nodes}</span>
}

export function objectMatch(toTest: {[key:PropertyKey]: any}, minKeys: {[key:PropertyKey]: any}, useSymbols=true): boolean {
  const props = [
    ...Object.getOwnPropertyNames(minKeys),
    ...(useSymbols ? Object.getOwnPropertySymbols(minKeys) : [])]
	for(let p of props) {
    if (!(p in toTest))
      return false
		if(minKeys[p] !== toTest[p]) {
      if (minKeys[p] instanceof Object && toTest[p] instanceof Object)
        return objectMatch(toTest[p], minKeys[p])
      return false;
    }
	}
	return true;
}

export function objectsEqual(obj1: {[key:PropertyKey]: any}, obj2: {[key:PropertyKey]: any}, useSymbols=true) {
	return objectMatch(obj1, obj2, useSymbols) && objectMatch(obj2, obj1, useSymbols)
}

export function objectsMerge(dest: {[key:PropertyKey]: any}, src: {[key:PropertyKey]: any}, {override=false, copyNamed=true, copySymbols=true} = {}) {
  const props = [
    ...(copyNamed ? Object.getOwnPropertyNames(src) : []),
    ...(copySymbols ? Object.getOwnPropertySymbols(src) : [])]
	for(let p of props) {
    if (src[p]?.constructor == Object) {
      if (dest[p]?.constructor == Object)
        objectsMerge(dest[p], src[p], {override, copyNamed, copySymbols})
      else if (!(p in dest) || override)
        dest[p] = objectsMerge({}, src[p], {override, copyNamed, copySymbols})
    } else if (src[p]?.constructor == Array) {
      if (dest[p]?.constructor == Array) {
        if (override)
          dest[p].splice(0, dest[p].length)
        dest[p].push(src[p].slice(dest[p].length))
      } else if (!(p in dest) || override) {
        dest[p] = Array.from(src[p])
      }
    } else if (!(p in dest) || override) {
      dest[p] = src[p]
    }
	}
  return dest
}

export function isDigit(str: string, index: number = 0) {
  const char = str.charAt(index)
  return char >= '0' && char <= '9'
}

/**
 * A FIFO queue of objects
 * Can be used as a history the keeps only the last N entries.
 */
export class Queue<T> {
  private buffer: T[]
  private limit: number
  /**
   * @param init_elmts initial elements in the buffer.
   * @param limit if > 0, there is no limit. Defaults to 0.
   *              If {@link init_elmts} is a Queue and {@link limit} = 0,
   *              the limit is copied from the copied queue.
   */
  constructor(init_elmts: Iterable<T> = [], limit: number = 0) {
    this.buffer = Array.from(init_elmts)
    if (limit == 0 && init_elmts instanceof Queue)
      this.limit = init_elmts.limit
    else
      this.limit = limit
  }
  /**
   * number of items in the queue
   */
  get length() {
    return this.buffer.length
  }
  /**
   * Remove the oldest elements to fit the buffer size
   * in the specified limit.
   * Nothing happens if the limit is not set (= 0).
   */
  private clean() {
    if (this.limit > 0 && this.buffer.length > this.limit)
      this.buffer.splice(0, this.buffer.length - this.limit)
  }
  /**
   * Empty the buffer.
   */
  clear() {
    this.buffer.splice(0, this.buffer.length)
  }
  /**
   * Append the element at the end of the queue.
   * If the limit is exceeded, remove the oldest elements
   * @param elmt element to insert
   * @returns this
   */
  push(elmt: T): Queue<T> {
    this.buffer.push(elmt)
    this.clean()
    return this
  }
  /**
   * Remove and return the oldest element in the queue
   * @returns the removed item
   */
  pop(): T|undefined {
    return this.buffer.shift()
  }
  /**
   * Get the element at the specified index in the buffer
   * @param index index of the element to get
   * @returns the element in the buffer at {@link index}
   */
  get(index: number) {
    if (index >= 0)
      return this.buffer[index]
    else
      return this.buffer[this.buffer.length+index]
  }
  [Symbol.iterator]() {
    return this.buffer[Symbol.iterator]()
  }
}
