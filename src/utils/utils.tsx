const LOGIC_FILE = 'scene0.txt'

/*
 * Fetch and split the script into lines
 */
export async function fetchScene(sceneId: string):Promise<string[]> {
  const script = await fetch(`./scenes/scene${sceneId}.txt`)
      .then(script=>script.text())

  //split data on \n
  const result = script.split(/\r?\n/).filter(line=>line.length > 0)

  return result
}

async function fetchBlock(label: string):Promise<string[]> {
  const script = await fetch(`./scenes/` + LOGIC_FILE)
      .then(script=>script.text())

  let start = script.indexOf(`\n*${label}`)
  if (start == -1)
    return []
  start = script.indexOf('\n', start+1)+1

  let end = script.substring(start).search(/^\*(?!skip)/m)
  end = (end == -1) ? script.length : start + end
  
  return script.substring(start, end)
      .split(/\r?\n/)
      .filter(line=>line.length>0)
}

const ignoredFBlockLines= [
  "gosub *regard_update",
  "!sd"
]

export async function fetchFBlock(label: string): Promise<string[]> {
  const afterScene = /^skip\d+a?$/.test(label)
  if (afterScene) {
    label = label.substring(4) // after 'skip'
  }
  const lines = (await fetchBlock(`f${label}`)).filter(
      line=>!ignoredFBlockLines.includes(line))
  
  // find 'gosub *sXXX'
  let sceneLine = lines.findIndex(line=>/^gosub\s+\*s\d/.test(line))
  if (sceneLine >= 0) {
    // remove scene skip code
    const skipEnd = lines.indexOf("return")+1
    if (afterScene)
      lines.splice(0, skipEnd)
    else {
      lines.splice(sceneLine-1, skipEnd - sceneLine + 1, lines[sceneLine])
      sceneLine--
    }
  }
  // concatenate choices
  let choiceLine = lines.findIndex(line=>line.startsWith('select'))
  if (choiceLine >= 0) {
    const choices = lines.slice(choiceLine).map(line=>line.trim()).join(' ')
    lines.splice(choiceLine)
    lines.push(choices)
  }
  return lines
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
	for(const p of props) {
    if (!(p in toTest))
      return false
		if(minKeys[p] !== toTest[p]) {
      if (minKeys[p].constructor != toTest[p].constructor)
        return false
      if (minKeys[p].constructor != Object && minKeys[p].constructor != Array)
        return false
      if (!objectMatch(toTest[p], minKeys[p], useSymbols))
        return false
    }
	}
	return true;
}

export function objectsEqual(obj1: {[key:PropertyKey]: any}, obj2: {[key:PropertyKey]: any}, useSymbols=true) {
	return objectMatch(obj1, obj2, useSymbols) && objectMatch(obj2, obj1, useSymbols)
}

export function overrideAttributes(dest: {[key: PropertyKey]: any}, src: {[key: PropertyKey]: any}, useSymbols=true) {
  const props = [
    ...Object.getOwnPropertyNames(src),
    ...(useSymbols ? Object.getOwnPropertySymbols(src) : [])]

  for (const p of props) {
    if (src[p]?.constructor == Object) { // deep-copy objects
      if (dest[p]?.constructor != Object)
        dest[p] = {}
      overrideAttributes(dest[p], src[p], useSymbols)
    } else if (src[p]?.constructor == Array) { // copy arrays
      dest[p] = src[p].slice(0, src[p].length)
    } else { // use same value/ref for other attributes
      dest[p] = src[p]
    }
  }
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
   * @param limit maximum number of elements. If 0 or unset, no limit is
   *              applied. If {@link init_elmts} is a Queue and
   *              {@link limit} = 0, the limit is copied from the copied queue.
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