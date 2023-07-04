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
  lines.forEach((line, index) => {
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

export function objectMatch(toTest: Object, minKeys: Object, useSymbols=true): boolean {
	for(let p of [...Object.getOwnPropertyNames(minKeys), ...(useSymbols ? Object.getOwnPropertySymbols(minKeys) : [])]) {
		if(!(p in toTest) || (minKeys as any)[p] !== (toTest as any)[p])
			return false;
	}
	return true;
}

export function objectsEqual(obj1: Object, obj2: Object) {
	return objectMatch(obj1, obj2) && objectMatch(obj2, obj1);
}

export function objectsMerge(dest: Object, src: Object, override=false) {
	for(let p in [...Object.getOwnPropertyNames(src), ...Object.getOwnPropertySymbols(src)]) {
    if (!(p in dest))
      (dest as any)[p] = (src as any)[p]
    else if (typeof ((dest as any)[p]) == "object" && typeof ((src as any)[p]) == "object")
      objectsMerge((dest as any)[p], (src as any)[p], override)
    else if (override)
      (dest as any)[p] = (src as any)[p]
	}
  return dest
}

export function isDigit(str: string, index: number = 0) {
  const char = str.charAt(index)
  return char >= '0' && char <= '9'
}

export class Queue<T> {
  private buffer: T[]
  private limit: number
  constructor(init_elmts: Iterable<T> = [], limit: number = 0) {
    this.buffer = Array.from(init_elmts)
    if (limit == 0 && init_elmts instanceof Queue)
      this.limit = init_elmts.limit
    else
      this.limit = limit
  }
  private clean() {
    if (this.limit > 0 && this.buffer.length > this.limit)
      this.buffer.splice(0, this.buffer.length - this.limit)
  }
  push(elmt: T): Queue<T> {
    this.buffer.push(elmt)
    this.clean()
    return this
  }
  pop(): T|undefined {
    return this.buffer.shift()
  }
  get(index: number) {
    if (index >= 0)
      return this.buffer[index]
    else
      return this.buffer[this.buffer.length+index]
  }
  clear() {
    this.buffer.splice(0, this.buffer.length)
  }
  [Symbol.iterator]() {
    return this.buffer[Symbol.iterator]()
  }
  get length() {
    return this.buffer.length
  }
}

export function moveBg(dir: string) {

  if (!["up", "down"].includes(dir))
    throw Error(`Illegal argument ${dir}`)

  const positions = ['top', 'center', 'bottom']
  const bgClass = document.querySelector('.background')?.classList

  const currentPosition = positions.findIndex(pos => bgClass?.contains(pos));

  if (currentPosition !== -1) {
    bgClass?.replace(
      positions[currentPosition],
      positions[currentPosition + (dir === 'up' ? -1 : 1)] || positions[currentPosition]
    )
  }
}
