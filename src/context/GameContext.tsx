import { createContext, useReducer } from 'react'
import { ContextState } from '../types'
import { initialContextState } from '../utils/constants'

type StateProviderProps = {
  children: React.ReactNode
}


const store = createContext<{ state: ContextState; dispatch: React.Dispatch<any> }>({
  state: initialContextState,
  dispatch: () => {},
})
const {Provider} = store

const StateProvider = ({children}: StateProviderProps) => {
  const [state, dispatch] = useReducer((curState: ContextState, action: any) => {
    switch (action.type) {
      case 'SET_DISP_TEXT' :
        return {
          ...curState,
          disp: {
            ...curState.disp,
            text: action.payload
          }
        }
      case 'SET_DISP_HISTORY' :
        return {
          ...curState,
          disp: {
            ...curState.disp,
            history: action.payload
          }
        }
      case 'SET_DISP_CHOICES' :
        return {
          ...curState,
          disp: {
            ...curState.disp,
            choices: action.payload
          }
        }
      case 'SET_DISP_MENU' :
        return {
          ...curState,
          disp: {
            ...curState.disp,
            menu: action.payload
          }
        }
      case 'SET_GAME' :
        return {
          ...curState,
          game: action.payload
        }
      case 'SET_GAME_INDEX' :
        return {
          ...curState,
          game: {
            ...curState.game,
            index: action.payload
          }
        }
      case 'ADD_GAME_EVENT_IMAGE' :
        return {
          ...curState,
          game: {
            ...curState.game,
            eventImages: [...curState.game.eventImages, action.payload]
          }
        }
      default:
        throw new Error()
    }
  }, initialContextState)
  
  return <Provider value={{state, dispatch}}>{children}</Provider>
}

export {store, StateProvider}