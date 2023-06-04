import { useState } from 'react'
import './styles/App.css'
import Window from './screens/Window'
import "./assets/fonts/Ubuntu-Regular.ttf"
import { StateProvider } from './context/GameContext'

function App() {

  return (
    <StateProvider>
      <Window />
    </StateProvider>
  )
}

export default App
