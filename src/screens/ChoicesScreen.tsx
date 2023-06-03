type Props = {
  choices: string[],
}

const ChoicesScreen = ({ choices }: Props) => {
  console.log(choices)
  return (
    <div className="box-choices">
      <div className="choices-container">
        {choices.map((choice: any, i:any) =>
          <button key={i} className="choice">
            {choice}
          </button>
        )}
      </div>
    </div>
  )
}

export default ChoicesScreen;