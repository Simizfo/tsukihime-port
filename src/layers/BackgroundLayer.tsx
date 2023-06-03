type Props = {
  bg: string
}

const BackgroundLayer = ({ bg }: Props) => {
  return (
    <img src={"/" + bg} alt="background" className="background" />
  )
}

export default BackgroundLayer