import { Choice } from "../types";

const LOGIC_FILE = 'scene0.txt'

/*
 * Fetch and split the script into lines
 */
export const fetchScene = async (scene: number):Promise<string[]> => {
  const script = await fetch(`./scenes/scene${scene}.txt`)

  const data = await script.text();

  //split data on \n or @
  const lines = data.split(/[\n@]/)
  const result: any = {};

  lines.forEach((line, index) => {
    result[index] = line
  });
  // console.log(result); // Check the output in the console

  return result
}

export const fetchF = async (sceneNumber: number):Promise<any> => {
  const script = await fetch(`./scenes/` + LOGIC_FILE)

  const data = await script.text();

  //keep only lines after *f sceneNumber and before *f sceneNumber + 1
  const lines = data.split(/[\n@]/)
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