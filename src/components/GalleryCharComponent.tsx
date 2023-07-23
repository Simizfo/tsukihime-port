import { CHARACTERS } from "../utils/constants"

type Props = {
  character: CHARACTERS,
  selected: boolean,
  handleSelected: (selectedChar: CHARACTERS) => void
  [key:string]: any,
}

/**
 * Character selector in gallery
 */
const GalleryCharComponent = ({ character, selected, handleSelected, ...props }: Props) => {

  let {className, ...otherProps} = props
  className = `menu-btn gallery-char-item ${selected ? "selected" : ""} ${className??""}`
  return (
    <button className={className} {...otherProps}
      onClick={handleSelected.bind(null,character)}>
      <span>{character}</span>
    </button>
  )
}

export default GalleryCharComponent