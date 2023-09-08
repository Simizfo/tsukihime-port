import { Link } from "react-router-dom"
import { innerText, replaceDashes } from "./utils"
import { Fragment, memo } from "react"


type TagTranslator<T=string|undefined> = (tag: string, content: Array<string|JSX.Element>, arg: T, props?: Record<string, any>)=> JSX.Element

//[/?<tag>=<arg>/?] not preceded by a '\'
const bbcodeTagRegex = /(?<!\\)\[(?<tag>\/?\w*)(=(?<arg>([^\/\]]|\/(?!\]))+))?(?<leaf>\/)?\]/g

const simple: TagTranslator = (tag, content, _, props?)=> {
  const Tag = tag as 'b'|'i'|'s'|'sup'|'sub'
  return <Tag {...(props ?? {})}>{content}</Tag>
}

const leaf: TagTranslator = (tag, content, _, props?)=> {
  const Tag = tag as 'br'|'wbr'
  if (content.length == 0)
    return <Tag {...props}/>
  else if (props && Object.getOwnPropertyNames(props).length > 0)
    return <span {...props}><Tag/>{content}</span>
  else
    return <><Tag/>{content}</>
}

const styled: TagTranslator<Record<string, any>> = (tag, content, style, props?)=> {
  const Tag = tag as 'span'
  let {style: _s, ...attrs} = props || {}
  style = {
    ...style,
    ...(_s || {})
  }
  return <Tag {...(attrs ?? {})} style={style}>{content}</Tag>
}

const align: TagTranslator = (tag, content, arg, props?)=> {
  const width = arg ? `${arg}em` : "100%"
  return styled('span', content,
    { textAlign: tag, display: "inline-block", width },
    props)
}

const url: TagTranslator = (_, content, arg, props?)=> {
  if (!arg)
    arg = innerText(content)
  if (arg?.startsWith("'") && arg.endsWith("'"))
    arg = arg.substring(1, arg.length-1)
  if (arg.lastIndexOf('.') > arg.lastIndexOf('/') || arg.startsWith("http"))
    return <a href={arg} target="_blank" {...(props || {})}>{...content}</a>
  else
    return <Link to={arg} {...(props || {})}>{...content}</Link>
}

const line: TagTranslator = (_, content, arg, props?)=> {
  const n = parseInt(arg || "1")
  const {className: insertClass, ...attrs} = props ?? {}
  return <>
    {simple('span', ["\u{2002}".repeat(n)/*en-dash-sized space*/], "",
            {className: `dash ${insertClass}`, ...attrs})}
    {content}
  </>
}

export const defaultBBcodeDict: Record<string, TagTranslator> = {
  '': (_, content, _a, props)=> simple('span', content, _, props),
  'br' : leaf,
  'wbr' : leaf,
  'b' : simple,
  'i' : simple,
  's' : simple,
  'sup' : simple,
  'sub' : simple,
  'u' : (_, content, _a, props)=> styled('span', content, {textDecoration: "underline"}, props),
  'size' : (_, content, arg, props)=> styled('span', content, {fontSize: arg}, props),
  'font': (_, content, arg, props)=> styled('span', content, {fontFamily: arg}, props),
  'color' : (_, content, arg, props)=> styled('span', content, {color: arg, textShadow: "none"}, props),
  'opacity': (_, content, arg, props)=> styled('span', content, {opacity: arg}, props),
  'hide': (_, content, _a, props)=> styled('span', content, {visibility: "hidden"}, props),
  'center': align,
  'left': align,
  'right': align,
  'url': url,
  'line': line,
  'copy': (_, content, _a, props)=> <span {...props}>&copy;{content}</span>,
  'class': (_, content, arg, props)=> <span className={arg} {...props}>{content}</span>,
}

type BbNode = {tag: string, arg: string, content: (BbNode|string)[]}

function tagToJSX({tag, arg, content}: BbNode, dict: typeof defaultBBcodeDict,
                  props?: Record<string, any>): JSX.Element {
  const transform = dict[tag]
  if (!transform)
    throw Error(`Unknown bbcode tag ${tag}`)
  const children = content.map((n, i)=>
      n.constructor == String ?
        <Fragment key={i}>{replaceDashes(n as string)}</Fragment>
      : tagToJSX(n as BbNode, dict, {key: i})
  )
  return transform(tag, children, arg, props)
}

function createTree(text: string): BbNode {
  const nodes = [{tag:"", arg: "", content:[]} as BbNode]
  let lastIndex = 0
  text = text.replaceAll("\n", "[br/]")
  let m
  while(((m = bbcodeTagRegex.exec(text))) !== null) {
    let {tag, arg, leaf} = m.groups ?? {}
    const currNode = nodes[nodes.length-1]
    if (m.index != lastIndex) {
      const subText = text.substring(lastIndex, m.index)
      currNode.content.push(subText)
    }
    lastIndex = bbcodeTagRegex.lastIndex
    if (tag.startsWith('/')) {
      if ((tag.length > 1 && tag.substring(1) != currNode?.tag) || nodes.length == 1)
        throw Error(`Unmatched [${tag}] in "${text}"`)
      nodes.pop()
    } else {
      const node = {tag, arg, content: []}
      currNode.content.push(node)
      if (!leaf)
        nodes.push(node)
    }
  }
  if (lastIndex < text.length) // unclosed tag
    nodes[nodes.length-1].content.push(text.substring(lastIndex))
  return (nodes.length > 1 && nodes[0].content.length == 1) ? nodes[1] : nodes[0]
}

function innerBbText(node: BbNode): string {
  if (node.tag == "hide")
    return " "
  if (node.tag == "line")
    return "-".repeat(parseInt(node.arg))
  return node.content.reduce<string>((str, child)=> {
    if (child.constructor == String)
      return child
    return innerBbText(child as BbNode)
  }, "")
}

export function bb(text: string, props?: Record<string, any>, dict=defaultBBcodeDict) {
  const root = createTree(text)
  return tagToJSX(root, dict, props)
}

export function wbb(text: string): string {
  return innerBbText(createTree(text))
}

export function closeBB(text: string): string {
  const openCount = Array.from(text.matchAll(/\[[^\]]*(?<!\/)\]/g)).length
  const closeCount = Array.from(text.matchAll(/\[\/[^\]]*\]/g)).length
  if (openCount == closeCount)
    return text
  else return text + '[/]'.repeat(openCount-closeCount)
}

type Props = {
  text: string,
  dict: typeof defaultBBcodeDict
} & Record<string, any>

export const Bbcode = memo(({text, dict = defaultBBcodeDict, ...props}: Props)=> {
  return bb(text, dict, props)
})