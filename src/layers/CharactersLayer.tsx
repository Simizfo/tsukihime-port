import { Character } from "../types"

type Props = {
  characters: Character[]
}


const CharactersLayer = ({ characters }: Props) => {
  return (
    <div className="box box-characters">
      {characters.map((character: Character, i) =>
        <div className={`img-container ${character.pos}`} key={i}>
          <img src={"/image/tachi/" + character.image + ".webp"} alt="character" className={character.type} />
        </div>
      )}
    </div>
  )
}

export default CharactersLayer