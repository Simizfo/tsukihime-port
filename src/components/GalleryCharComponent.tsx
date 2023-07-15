import { CHARACTERS } from "../utils/constants"

type Props = {
  character: CHARACTERS,
  selected: CHARACTERS,
  handleSelected: (selectedChar: CHARACTERS) => void
}

/**
 * Character selector in gallery
 */
const GalleryCharComponent = ({ character, selected, handleSelected }: Props) => {

  return (
    <button className={`menu-btn gallery-char-item ${character === selected ? "selected" : ""}`}
      onClick={() => handleSelected(character)}>
      <span>{character}</span>
    </button>
  )
}

export default GalleryCharComponent