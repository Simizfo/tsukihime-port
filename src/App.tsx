import { useState } from 'react'
import './styles/App.scss'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import { StateProvider } from './context/GameContext'
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';

function App() {

  return (
    <StateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/title" />} />
          <Route path="/title" element={<TitleMenuScreen />} />
          <Route path="/window" element={<Window />} />
        </Routes>
      </BrowserRouter>
    </StateProvider>
  )
}

export default App
