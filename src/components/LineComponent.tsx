type Props = {
  line: {line: string, hasEnded?: boolean},
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
    {line.hasEnded && <br />}
    </>
  );
}

export default LineComponent;