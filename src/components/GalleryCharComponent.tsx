import { CHARACTERS } from "../utils/constants"

type Props = {
  character: CHARACTERS,
  background: string,
  selected: CHARACTERS,
  handleSelected: (selectedChar: CHARACTERS) => void
}

/**
 * Character selector in gallery
 */
const GalleryCharComponent = ({ character, background, selected, handleSelected }: Props) => {

  return (
    <button className={`gallery-char-item ${character === selected ? "selected" : ""}`}
      onClick={() => handleSelected(character)}>
      <img src={background} alt={character} draggable={false} />
      <span>{character}</span>
    </button>
  )
}

export default GalleryCharComponent