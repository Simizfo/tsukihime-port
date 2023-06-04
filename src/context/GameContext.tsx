import { createContext, useReducer } from 'react'

type State = {
  dispText: boolean,
  dispHistory: boolean,
  dispChoices: boolean,
  dispMenu: boolean,
}
type StateProviderProps = {
  children: React.ReactNode
}

const initialState = {
  dispText: true,
  dispHistory: false,
  dispChoices: false,
  dispMenu: false,
}

const store = createContext<{ state: State; dispatch: React.Dispatch<any> }>({
  state: initialState,
  dispatch: () => {},
})
const {Provider} = store

const StateProvider = ({children}: StateProviderProps) => {
const [state, dispatch] = useReducer((curState: State, action: any) => {
    switch (action.type) {
      case 'SET_DISP_TEXT' :
        return {
          ...curState,
          dispText: action.payload
        }
      case 'SET_DISP_HISTORY' :
        return {
          ...curState,
          dispHistory: action.payload
        }
      case 'SET_DISP_CHOICES' :
        return {
          ...curState,
          dispChoices: action.payload
        }
      case 'SET_DISP_MENU' :
        return {
          ...curState,
          dispMenu: action.payload
        }
      default:
        throw new Error()
    }
  }, initialState)
  
  return <Provider value={{state, dispatch}}>{children}</Provider>
}

export {store, StateProvider}