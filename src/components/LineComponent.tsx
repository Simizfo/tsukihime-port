import { Line } from "../types"

type Props = {
  line: Line,
}

const LineComponent = ({ line }: Props) => {

  const lineDisplay = (line: string) => {
    if (line === 'br') {
      return <br />
    } else {
      return line.replace(/`/g, '').replace(/\\/g, '')
    }
  }

  return (
    <>
    <span>
      {lineDisplay(line.line)}
    </span>
    {line.lineHasEnded && <br />}
    </>
  );
}

export default LineComponent;