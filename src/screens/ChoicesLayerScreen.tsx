import { Choice } from "../types"

type Props = {
  choices: Choice[],
  setNewScene: (sceneNumber: number) => void
}

const ChoicesLayerScreen = ({ choices, setNewScene }: Props) => {
  return (
    <div className="box-choices">
      <div className="choices-container">
        {choices.map((choice: Choice, i:any) =>
          <button key={i} className="choice" onClick={() => setNewScene(choice.f)}>
            {choice.libe}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChoicesLayerScreen;