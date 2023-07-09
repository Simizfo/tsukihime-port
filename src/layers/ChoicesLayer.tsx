import { useEffect, useState } from "react"
import { Choice } from "../types"
import { displayMode, gameContext } from "../utils/variables"
import { observe, unobserve } from "../utils/Observer"
import { fetchChoices } from "../utils/utils"
import script from "../utils/ScriptManager"

const choicesContainer: {choices: Choice[]} = {
  choices: []
}

script.onReturn = ()=> {
  fetchChoices(gameContext.scene).then(choices=> {
    if (choices.length > 1) {
      choicesContainer.choices = choices
      displayMode.choices = true;
      console.log(choices)
    } else if (choices.length == 1) {
      gameContext.scene = choices[0].f
      console.log(choices[0])
    } else {
      console.error("no choice after scene", gameContext.scene)
    }
  })
}

const ChoicesLayer = () => {
  const [display, setDisplay] = useState<boolean>(displayMode.choices)
  const [choices, setChoices] = useState<Choice[]>([])

  useEffect(()=> {
    observe(displayMode, 'choices', setDisplay)
    observe(choicesContainer, 'choices', setChoices)
    return ()=> {
      unobserve(displayMode, 'choices', setDisplay)
      unobserve(choicesContainer, 'choices', setChoices)
    }
  }, [])

  return display ? (
    <div className="box box-choices">
      <div className="choices-container">
        {choices.map((choice: Choice, i:any) =>
          <button key={i} className="choice" onClick={() => {
            console.log(choice)
            gameContext.scene = choice.f
            gameContext.index = 0
            displayMode.choices = false
          }}>
            {choice.libe}
          </button>
        )}
      </div>
    </div>
  ) : (<></>)
}

export default ChoicesLayer