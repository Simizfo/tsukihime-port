import { useState } from "react"
import { Choice, LabelName } from "../types"
import { gameContext } from "../utils/variables"
import { useObserver } from "../utils/Observer"
import script from "../utils/script"
import { displayMode } from "../utils/display"

const choicesContainer = {
  choices: [] as Choice[]
}


//##############################################################################
//#                                  COMMANDS                                  #
//##############################################################################

export const commands = {
  'select': (arg: string)=> {
    const choices: Choice[] = []
    const tokens = arg.split(/[`"],|(?<=\*\w+),/)
    for (let i = 0; i < tokens.length; i+= 2) {
      choices.push({
        str: tokens[i].trim().substring(1), // remove '`' or '"'
        label: tokens[i+1].trim().substring(1) as LabelName // remove '*'
      })
    }
    if (choices.length == 0)
      console.error("no choice after scene", gameContext.label)
    choicesContainer.choices = choices
    displayMode.choice = true;
    console.log(choices)

    return {
      next: ()=>{}, // prevent continuing to next instruction
      cancel: ()=> { choicesContainer.choices = [] }
    }; // prevent processing next line
  }
}

//##############################################################################
//#                                 COMPONENT                                  #
//##############################################################################

const ChoicesLayer = () => {
  const [display, setDisplay] = useState<boolean>(false)
  const [choices, setChoices] = useState<Choice[]>([])

  function updateDisplay() {
    if (displayMode.choice && choicesContainer.choices.length == 0)
      displayMode.choice = false
    else setDisplay(displayMode.choice)
  }

  useObserver(updateDisplay, displayMode, 'choice')
  useObserver((choices)=> {
    setChoices(choices)
    updateDisplay()
  }, choicesContainer, 'choices')

  /*
  useObserver((screen)=> {
    if (screen != SCREEN.WINDOW)
      displayMode.choices = false // 'select' will be re-processed
  }, displayMode, 'screen')
  */

  const handleSelect = (choice: Choice) => {
    console.log(choice)
    script.moveTo(choice.label)
    choicesContainer.choices = []
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