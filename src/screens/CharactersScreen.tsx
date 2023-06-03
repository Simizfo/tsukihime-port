import { Character } from "../types"

type Props = {
  characters: Character[]
}

const CharactersScreen = ({ characters }: Props) => {

  console.log(characters)
  return (
    <div className="box-characters">
      {characters.map((character: Character, i) =>
        <div className={`img-container ${character.pos}`} key={i}>
          <img src={"/image/tachipng/" + character.image + ".png"} alt="character" className={character.type} />
        </div>
      )}
    </div>
  )
}

export default CharactersScreen