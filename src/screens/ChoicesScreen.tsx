import { Choice } from "../types"

type Props = {
  choices: Choice[],
  setNewScene: (sceneNumber: number) => void
}

const ChoicesScreen = ({ choices, setNewScene }: Props) => {
  const findNextScene = (choice: Choice) => {
    setNewScene(choice.f)
  }

  return (
    <div className="box-choices">
      <div className="choices-container">
        {choices.map((choice: Choice, i:any) =>
          <button key={i} className="choice" onClick={() => findNextScene(choice)}>
            {choice.libe}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChoicesScreen;