import { useContext } from "react";
import { store } from "../context/GameContext";
import { Character } from "../types"

type Props = {
  characters: Character[]
}

const CharactersLayer = ({ characters }: Props) => {
  const { state } = useContext(store)

  return (
    <div className="box box-characters">
      {characters.map((character: Character, i) =>
        <div className={`img-container ${character.pos}`} key={i}>
          <img src={`/${state.permanent.imagesFolder}/tachi/${character.image}.webp`} alt="character" className={character.type} />
        </div>
      )}
    </div>
  )
}

export default CharactersLayer