import { RecursivePartial } from "../types"

//##############################################################################
//#                            OBJECTS MANIPULATION                            #
//##############################################################################

export function objectMatch<T extends Record<PropertyKey, any>>(toTest: T, ref: RecursivePartial<T>, useSymbols=true): boolean {
  const props = [
      ...Object.getOwnPropertyNames(ref),
      ...(useSymbols ? Object.getOwnPropertySymbols(ref) : [])]
	for(const p of props) {
    if (!(p in toTest))
      return false
		if(ref[p] !== toTest[p]) {
      const refType = ref[p]?.constructor
      if (refType != toTest[p]?.constructor)
        return false
      if (refType != Object && refType != Array)
        return false
      if (!objectMatch(toTest[p], ref[p] as Exclude<typeof ref[typeof p], undefined>, useSymbols))
        return false
    }
	}
	return true;
}

export function objectsEqual(obj1: Record<PropertyKey, any>, obj2: Record<PropertyKey, any>, useSymbols=true) {
	return objectMatch(obj1, obj2, useSymbols) && objectMatch(obj2, obj1, useSymbols)
}

const primitiveTypes = [String, Number, BigInt, Symbol, Boolean, null, undefined]

export function deepAssign<Td extends Record<string,any>, Ts extends Td>(dest: Td, src: Readonly<Ts>,
  opts?: {createMissing?: true, morphTypes?: true}): Ts; // Td ⊂ Ts
export function deepAssign<Td extends Record<string, any>, Ts = RecursivePartial<Td>>(dest: Td, src: Readonly<Ts>,
  opts?: {createMissing?: true, morphTypes?: true}): Td; // Td ⊃ Ts
export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts: {createMissing: false, morphTypes: false}): Td; // only update values
export function deepAssign<Td extends Record<string,any>, Ts extends Record<keyof Td, Ts[keyof Td]>>(dest: Td, src: Readonly<Ts>,
  opts: {createMissing: false, morphTypes?: true}): {[K in keyof Td] : Ts[K]}; // update values and types

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts?: {createMissing?: boolean, morphTypes?: boolean}): Record<string, any>

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
    {createMissing = true, morphTypes = true} = {}): Record<string, any> {
  for (const p of Object.getOwnPropertyNames(src)) {
    let create = false
    let exists = Object.hasOwn(dest, p)
    const srcType = src[p]?.constructor
    if (!exists)
      create = createMissing
    else
      create = morphTypes && srcType != dest[p]?.constructor
    if (create) {
      if (primitiveTypes.includes(srcType))
        (dest as any)[p] = src[p]
      else if (srcType == Object)
        (dest as any)[p] = deepAssign({}, src[p])
      else if (srcType == Array)
        (dest as any)[p] = src[p].slice(0, src[p].length)
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    } else if (exists) {
      if (primitiveTypes.includes(srcType)) {
        (dest as any)[p] = src[p]
      } else if (srcType == Object)
        deepAssign(dest[p], src[p] as any, {createMissing, morphTypes})
      else if (srcType == Array)
        dest[p].splice(0, dest[p].length, ...(src[p] as Array<any>))
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    }
  }
  return dest
}

export function deepFreeze<T extends Record<PropertyKey, any>>(object: T): Readonly<T> {
  const props = Reflect.ownKeys(object)
  for (const p of props) {
    const value = object[p]
    if (value && ["object", "function"].includes(typeof value))
      deepFreeze(value)
  }
  return Object.freeze(object)
}

//##############################################################################
//#                              TEXT CONVERSION                               #
//##############################################################################

export function convertText(text: string, props: Record<string, any> = {}): JSX.Element {

  if (text == "br")
    text = ""
  else if ( text.length > 0) {
    //remove '`', '@' and '\', EDIT : already removed by script parser
    //replace '|' with '…'
    text = text//.replace(/[`@\\]|(\!w\d+\b)/g, '')
               .replaceAll('|', '…')
  }
  return <span {...props}>{replaceDashes(text)}</span>
}

function bbcodeTagToJSX({tag: Tag, arg, content}: {tag: string, arg: string, content: JSX.Element[]}) {
  switch(Tag) {
    case 'b' :
    case 'i' :
    case 's' :
    case 'sup' :
    case 'sub' : return <Tag>{...content}</Tag>
    case 'u' : return <span style={{textDecoration: "underline"}}>{...content}</span>
    case 'size' : return <span style={{fontSize: arg}}>{...content}</span>
    case 'color' : return <span style={{color: arg}}>{...content}</span>
    case 'center':
    case 'left':
    case 'right': return <div style={{textAlign: Tag}}>{...content}</div>
    case 'url': return <a href={arg}>{...content}</a>
    default :
      throw Error(`Unknown bbcode tag ${Tag}`)
  }
}

function replaceDashes(text: string): JSX.Element {
    const nodes: Array<JSX.Element|string> = []
    //replace consecutive dashes with a continuous line
    let m
    while ((m = /[-―─]{2,}/g.exec(text)) !== null) {
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
    return <>{...nodes}</>
}

//[/?<tag>=<arg>] not preceded by a '\'
const bbcodeTagRegex = /(?<!\\)\[(?<tag>\/?\w+)(=(?<arg>[^\]]+))?\]/g
/**
 * convert text with BB code to JSX nodes
 */
export function parseBBcode(text: string): JSX.Element {
  const nodes = [{tag:"", arg: "", content:[] as JSX.Element[]}]
  let lastIndex = 0
  let m
  while(((m = bbcodeTagRegex.exec(text))) !== null) {
    let {tag, arg} = m.groups ?? {}
    const currNode = nodes[nodes.length-1]
    const subText = text.substring(lastIndex, m.index)
    currNode.content.push(replaceDashes(subText))
    lastIndex = bbcodeTagRegex.lastIndex
    if (tag.startsWith('/')) {
      if (tag.substring(1) != currNode?.tag)
        throw Error(`Unmatched [${tag}] in "${text}"`)
      nodes.pop()
      const prevNode = nodes[nodes.length-1]
      prevNode.content.push(bbcodeTagToJSX(currNode))
    } else {
      nodes.push({tag, arg, content:[]})
    }
  }
  if (lastIndex == 0) // no bbcode
    return replaceDashes(text)
  if (lastIndex < text.length) //
    nodes[nodes.length-1].content.push(replaceDashes(text.substring(lastIndex)))
  while (nodes.length > 1) {
    const currNode = nodes.pop() as typeof nodes[0]
    const prevNode = nodes[nodes.length-1]
    prevNode.content.push(bbcodeTagToJSX(currNode))
  }
  return <>{...nodes[0].content}</>
}

//##############################################################################
//#                                   OTHERS                                   #
//##############################################################################

export const addEventListener = ({event, handler, element = window}: any) => {
  element.addEventListener(event, handler)
  return () => element.removeEventListener(event, handler)
}

export function isDigit(str: string, index: number = 0) {
  const char = str.charAt(index)
  return char >= '0' && char <= '9'
}

export function negative(n: number) {
  return !Object.is(Math.abs(n), n)
}

/**
 * Let the user download the text in a text file
 * @param text content of the file to download
 * @param fileName default name of the file
 */
export function textFileUserDownload(text: string, fileName: string) {
	let element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', fileName);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

/**
 * requests one or multiple files from the user
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
 * for more details on the {@link multiple} and {@link accept} parameters
 */
export function requestFilesFromUser({ multiple = false, accept = '' }): Promise<File|File[]|null> {
	return new Promise(((resolve) => {
		const input = document.createElement('input');
		input.setAttribute("type", "file");

		if (accept?.length > 0)
			input.setAttribute("accept", accept);

		if (multiple)
			input.toggleAttribute("multiple", true);

		input.addEventListener("change", ()=> {
			resolve(input.files as File|File[]|null);
		})
		input.click();
	}));
}

export async function requestJSONs({ multiple = false, accept = ''}) : Promise<Record<string,any>[]|null> {
  let files = await requestFilesFromUser(({multiple, accept}))
  if (!files)
    return null; // canceled by user
  if (files instanceof File)
    files = [files]
  const jsons = await Promise.all(Array.from(files).map(file=> {
    return new Promise<string>((resolve,reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = (evt) => {
        if (evt.target?.result?.constructor == String)
          resolve(evt.target.result)
        else
          reject(`cannot read save file ${file.name}`)
      }
    }).then(
      (text)=>JSON.parse(text),
      (errorMsg)=> {
        throw Error(errorMsg)
    })
  }));
  return jsons
}

export function toggleFullscreen() {
  if (isFullscreen())
    document.exitFullscreen()
  else
    document.documentElement.requestFullscreen()
}

export function isFullscreen() {
  return document.fullscreenElement !== null
}