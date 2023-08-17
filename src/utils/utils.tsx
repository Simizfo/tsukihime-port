import { Link } from "react-router-dom"
import { JSONObject, JSONPrimitive, RecursivePartial } from "../types"

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

const primitiveTypes = [String, Number, BigInt, Symbol, Boolean, null, undefined] as Array<Function|null|undefined>

function isPrimitive(v: any) : v is string|number|BigInt|Symbol|boolean|null|undefined {
  return primitiveTypes.includes(v?.constructor)
}
export function deepAssign<Td extends Record<string,any>, Ts extends Td>(dest: Readonly<Td>, src: Readonly<Ts>,
  opts: {extend?: true, morphTypes?: true, clone: true}): Ts
export function deepAssign<Td extends Record<string,any>, Ts extends RecursivePartial<Td>>(dest: Readonly<Td>, src: Readonly<Ts>,
  opts: {extend?: boolean, morphTypes?: boolean, clone: true}): Td
export function deepAssign<Td extends Record<string,any>, Ts extends Td>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: true, morphTypes?: true, clone?: false}): Ts; // Td ⊂ Ts
export function deepAssign<Td extends Record<string, any>, Ts = RecursivePartial<Td>>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: boolean, morphTypes: false, clone?: false}): Td; // Td ⊃ Ts
export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts: {extend: false, morphTypes: false, clone?: false}): Td; // only update values
export function deepAssign<Td extends Record<string,any>, Ts extends Record<keyof Td, Ts[keyof Td]>>(dest: Td, src: Readonly<Ts>,
  opts: {extend: false, morphTypes?: true, clone?: false}): {[K in keyof Td] : Ts[K]}; // update values and types

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: boolean, morphTypes?: boolean, clone?: boolean}): Record<string, any>

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
    {extend = true, morphTypes = true, clone = false} = {}): Record<string, any> {
  const res = clone ? {} : dest as Record<string, any>
  for (const p of Object.getOwnPropertyNames(src)) {
    let create = false
    let exists = Object.hasOwn(dest, p)
    const srcType = src[p]?.constructor
    if (!exists)
      create = extend
    else
      create = morphTypes && srcType != dest[p]?.constructor
    if (create) {
      if (isPrimitive(src[p]))
        res[p] = src[p]
      else if (srcType == Object)
        res[p] = deepAssign({}, src[p])
      else if (srcType == Array)
        res[p] = src[p].slice(0, src[p].length)
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    } else if (exists) {
      if (isPrimitive(src[p])) {
        res[p] = src[p]
      } else if (srcType == Object)
        res[p] = deepAssign(dest[p], src[p] as any, {extend, morphTypes, clone})
      else if (srcType == Array) {
        if (clone)
          res[p] = Array.from(src[p])
        else
          dest[p].splice(0, dest[p].length, ...(src[p] as Array<any>))
      }
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    }
  }
  if (clone) {
    for (const p of Object.getOwnPropertyNames(dest)) {
      if (!Object.hasOwn(src, p)) {
        if (isPrimitive(dest[p]))
          res[p] = dest[p]
        else if (Array.isArray(dest[p]))
          res[p] = Array.from(dest[p])
        else if (dest[p]?.constructor == Object)
          res[p] = deepAssign({}, dest[p], {extend, morphTypes, clone: false})
        else
          throw Error(`cannot clone ${p as string}:${dest[p].constructor}`)
      }
    }
  }
  return res
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

export function jsonDiff<T extends JSONObject>(obj: T, ref: Readonly<RecursivePartial<T>>) {
  const result: JSONObject = {}
  for (const p of Object.keys(obj)) {
    TSForceType<keyof T>(p)
    if (!Object.hasOwn(ref, p)) {
      if (isPrimitive(obj[p]))
        result[p] = ref[p] as JSONPrimitive
      else if (Array.isArray(obj[p])) {
        result[p] = Array.from(obj[p] as Array<JSONPrimitive|JSONObject>)
      } else {
        result[p] = deepAssign({}, obj[p] as JSONObject)
      }
    } else if (obj[p] == ref[p]) {
      continue
    } else if (isPrimitive(obj[p])) {
      result[p] = obj[p]
    } else if (Array.isArray(obj[p])) {
      const refArray = ref[p] as any[]
      const objArray = obj[p] as any[]
      if (objArray.length != refArray.length ||
          objArray.some((v, i) => v != refArray[i])) {
        result[p] = Array.from(objArray)
      }
    } else {
      const val = jsonDiff(obj[p] as JSONObject, ref[p] as JSONObject) as JSONObject
      if (Object.keys(val).length > 0)
        result[p] = val
    }
  }
  return result as RecursivePartial<T>
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
    case 'br' :
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
    case 'url':
      if (arg.startsWith("'") && arg.endsWith("'"))
        arg = arg.substring(1, arg.length-1)
      if (arg.lastIndexOf('.') > arg.lastIndexOf('/'))
        return <a href={arg} target="_blank">{...content}</a>
      else
        return <Link to={arg}>{...content}</Link>
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
export function bb(text: string): JSX.Element {
  const nodes = [{tag:"", arg: "", content:[] as JSX.Element[]}]
  let lastIndex = 0
  text = text.replaceAll("\n", "[br/]")
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

/** remove bb code */
export function wbb(text: string): string {
  return text?.replaceAll(/\[[^\]]+\]/g, "")
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

export function TSForceType<T>(v: any): asserts v is T {}