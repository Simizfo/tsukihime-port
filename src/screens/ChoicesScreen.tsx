import { Choice } from "../types"

type Props = {
  choices: Choice[],
}

const ChoicesScreen = ({ choices }: Props) => {
  const findNextScene = (choice: Choice) => {
    console.log(choice)
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