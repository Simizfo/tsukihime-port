import { useState } from "react"
import { Choice, LabelName } from "../types"
import { SCREEN, displayMode, gameContext } from "../utils/variables"
import { useObserver } from "../utils/Observer"
import script from "../utils/script"

const choicesContainer: {choices: Choice[]} = {
  choices: []
}


//##############################################################################
//#                                  COMMANDS                                  #
//##############################################################################

export const commands = {
  'select': (arg: string)=> {
    const choices: Choice[] = []
    const tokens = arg.split(/`,|(?<=\*\w+),/)
    for (let i = 0; i < tokens.length; i+= 2) {
      choices.push({
        str: tokens[i].trim().substring(1), // remove '`'
        label: tokens[i+1].trim().substring(1) as LabelName // remove '*'
      })
    }
    onChoices(choices)
    return {next:()=>{}}; // prevent processing next line
  }
}

function onChoices(choices: Choice[]) {
  if (choices.length > 1) {
    choicesContainer.choices = choices
    displayMode.choices = true;
    console.log(choices)
  } else if (choices.length == 1) {
    gameContext.label = choices[0].label
    console.log(choices[0])
  } else {
    console.error("no choice after scene", gameContext.label)
  }
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const ChoicesLayer = () => {
  const [display, setDisplay] = useState<boolean>(displayMode.choices)
  const [choices, setChoices] = useState<Choice[]>([])

  useObserver(setDisplay, displayMode, 'choices')
  useObserver(setChoices, choicesContainer, 'choices')
  useObserver((screen)=> {
    if (screen != SCREEN.WINDOW)
      displayMode.choices = false // 'select' will be re-processed
  }, displayMode, 'screen')

  const handleSelect = (choice: Choice) => {
    console.log(choice)
    script.moveTo(choice.label)
    displayMode.choices = false
  }

  return display ? (
    <div className="box box-choices">
      <div className="choices-container">
        {choices.map((choice: Choice, i:any) =>
          <button key={i} className="choice" onClick={()=> handleSelect(choice)}>
            {choice.str}
          </button>
        )}
      </div>
    </div>
  ) : (<></>)
}

export default ChoicesLayer