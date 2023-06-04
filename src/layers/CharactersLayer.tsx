import { Character } from "../types"

type Props = {
  characters: Character[]
}


const CharactersLayer = ({ characters }: Props) => {
  return (
    <div className="box box-characters">
      {characters.map((character: Character, i) =>
        <div className={`img-container ${character.pos}`} key={i}>
          <img src={"/image/tachipng/" + character.image + ".png"} alt="character" className={character.type} draggable={false} />
        </div>
      )}
    </div>
  )
}

export default CharactersLayer