import { RouteDayName, RouteName, SceneName } from "../types";
import { SCENES_FOLDERS, SCENE_ATTRS } from "./constants";
import { getGameVariable } from "./variables";

//##############################################################################
//#                           FETCH SCENES / BLOCKS                            #
//##############################################################################

const LOGIC_FILE = 'scene0.txt';
/*
 * Fetch and split the script into lines
 */

export async function fetchScene(sceneId: string): Promise<string[] | undefined> {
  if (/^s\d+a?$/.test(sceneId))
    sceneId = `scene${sceneId.substring(1)}`;
  const script = await fetch(`./scenes/${SCENES_FOLDERS.english}/${sceneId}.txt`)
    .then(
      (response) => response.ok ? response.text() : undefined,
      (_failErr) => undefined);

  //split data on \n
  const result = script?.split(/\r?\n/).filter(line => line.length > 0);

  return result;
}

async function fetchBlock(label: string): Promise<string[]> {
  const script = await fetch(`./scenes/${SCENES_FOLDERS.english}/${LOGIC_FILE}`)
    .then(script => script.text());

  let start = script.search(new RegExp(`^\\*${label}\\b`, "m"));
  if (start == -1)
    return [];
  start = script.indexOf('\n', start + 1) + 1;

  let end = script.substring(start).search(/^\*(?!skip)/m);
  end = (end == -1) ? script.length : start + end;

  return script.substring(start, end)
    .split(/\r?\n/)
    .filter(line => line.length > 0);
}
const ignoredFBlockLines = [
  "gosub *regard_update",
  "!sd"
];

export async function fetchFBlock(label: string): Promise<string[]> {
  const afterScene = /^skip\d+a?$/.test(label);
  if (afterScene) {
    // extract block label from skip label after 'skip'
    label = `f${label.substring(4)}`;
  }
  const lines = (await fetchBlock(label)).filter(
    line => !ignoredFBlockLines.includes(line));

  // find 'gosub *sXXX'
  let sceneLine = lines.findIndex(line => /^gosub\s+\*s\d/.test(line));
  if (sceneLine >= 0) {
    // remove scene skip code
    const skipEnd = lines.indexOf("return") + 1;
    if (afterScene)
      lines.splice(0, skipEnd);
    else {
      lines.splice(sceneLine - 1, skipEnd - sceneLine + 1, lines[sceneLine]);
      sceneLine--;
    }
  }
  // concatenate choices
  let choiceLine = lines.findIndex(line => line.startsWith('select'));
  if (choiceLine >= 0) {
    const choices = lines.slice(choiceLine).map(line => line.trim()).join(' ');
    lines.splice(choiceLine);
    lines.push(choices);
  }
  return lines;
}

//##############################################################################
//#                     SCRIPT PROCESSING HELPER FUNCTIONS                     #
//##############################################################################

export function isScene(label: string): boolean {
  //TODO create a list of unique scene names (e.g., openning, eclipse)
  return /^\*?s\d+a?$/.test(label) || ["openning"].includes(label)
}

export function getSceneTitle(label: SceneName): string|undefined {
  const attrs = SCENE_ATTRS.scenes[label]
  if (!attrs)
    return undefined
  if ("title" in attrs)
    return attrs.title
  else {
    const {r, d, s} = attrs
    let route: keyof typeof SCENE_ATTRS.routes
    if (typeof r == "object" && 'flg' in r)
      route = r[(getGameVariable(`%flg${r.flg}`)) ? "1" : "0"]
    else
      route = r

    let sceneName = SCENE_ATTRS.routes[route][d]
    if (s) {
      sceneName += " - "
      if (typeof s == "object" && 'flg' in s)
        sceneName += s[(getGameVariable(`%flg${s.flg}`)) ? "1" : "0"]
      else
        sceneName += s
    }
    return sceneName
  }
}

const routePhaseRegexp = /word\\P(?<route>[A-Z]+)_(?<rDay>\d+[AB])/
const ignoredPhaseRegexp = /(?<ignored>bg\\.*)/
const dayPhaseRegexp = /word\\day_(?<day>\w+)/
const rawScenePhaseRegexp = /word\\(?<scene>\w+)/

export function getPhaseDetails() {

  const phaseTitle_a = getGameVariable("$phasetitle_a")
  const phaseTitle_b = getGameVariable("$phasetitle_b")
  let {route = "", rDay = "", day = "", ignored = "", scene = ""} = {
    ...(phaseTitle_a.match(routePhaseRegexp)?.groups ??
        phaseTitle_a.match(ignoredPhaseRegexp)?.groups ?? {}),
    ...(phaseTitle_b.match(dayPhaseRegexp)?.groups ??
        phaseTitle_b.match(rawScenePhaseRegexp)?.groups ?? {})
  }
  if (!(route && rDay && day) && !(ignored && scene))
    throw Error(`Cannot parse phase imgs ${phaseTitle_a} or ${phaseTitle_b}`)
  return {
    bg: getGameVariable("$phasebg"),
    route : (route.toLowerCase() as RouteName) || "others",
    routeDay : (rDay.toLowerCase() as RouteDayName) || scene,
    day : parseInt(day) || 0
  }
}

// (%var|n)(op)(%var|n)
const opRegexp = /(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))/
export function checkIfCondition(condition: string) {
  let value = true
  for (const [i, token] of condition.split(' ').entries()) {
    if (i % 2 == 0) {
      const match = opRegexp.exec(token)
      if (!match) throw Error(
        `Unable to parse expression "${token}" in condition ${condition}`)

      let {lhs: _lhs, op, rhs: _rhs} = match.groups as any
      const lhs = _lhs.startsWith("%")? getGameVariable(_lhs) : parseInt(_lhs)
      const rhs = _rhs.startsWith("%")? getGameVariable(_rhs) : parseInt(_rhs)

      switch (op) {
        case '==' : value = (lhs == rhs); break
        case '!=' : value = (lhs != rhs); break
        case '<'  : value = (lhs <  rhs); break
        case '>'  : value = (lhs >  rhs); break
        case '<=' : value = (lhs <= rhs); break
        case '>=' : value = (lhs >= rhs); break
        default : throw Error (
          `unknown operator ${op} in condition ${condition}`)
      }
    } else {
      switch (token) {
        case "&&" : if (!value) return false; break
        case "||" : if (value) return true; break
        default : throw Error(
          `Unable to parse operator "${token}" in condition ${condition}`)
      }
    }
  }
  return value
}

function splitText(text: string) {
  const instructions = new Array<{ cmd:string, arg:string }>()
  let index = 0
  // replace spaces with en-spaces at the beginning of the line
  while (text.charCodeAt(index) == 0x20)
    index++
  text = "\u2002".repeat(index) + text.substring(index)
  // split tokens at every '@', '\', '!xxx'
  while (text.length > 0) {
    index = text.search(/@|\\|!\w|$/)
    if (index > 0)
      instructions.push({cmd:'`',arg: text.substring(0, index)})
    text = text.substring(index)
    switch (text.charAt(0)) {
      case '@' :
      case '\\' :
        instructions.push({cmd: text.charAt(0), arg:""})
        text = text.substring(1)
        break
      case '!' : // !w<time>
        const argIndex = text.search(/\d|\s|$/)
        const endIndex = text.search(/\s|$/)
        instructions.push({
          cmd: text.substring(0, argIndex),
          arg: text.substring(argIndex, endIndex)})
        text = text.substring(endIndex)
        break
    }
  }
  return instructions
}

export function extractInstructions(line: string) {
  const instructions = new Array<{cmd:string,arg:string}>()
  const endPageBreak = line.endsWith('\\') && line.length > 1

  if (endPageBreak) // '\\' will be added as an individual command at the end
    line = line.substring(0, line.length-1)

  if (line.startsWith('`')) {
    // following space (if present) is part of the argument
    line = line.substring(1)
    if (!endPageBreak)
      line += '\n'
    instructions.push(...splitText(line))
  } else if (line.startsWith('!')) {
    instructions.push(...splitText(line)) // '!w' are handled as inline commands
  } else {
    let index = line.indexOf(' ')
    if (index == -1)
      index = line.length
    instructions.push({
      cmd: line.substring(0,index),
      arg: line.substring(index+1)
    })
  }

  if (endPageBreak)
    instructions.push({cmd:'\\',arg:''})

  return instructions
}
