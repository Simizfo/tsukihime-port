import { useState } from 'react'
import './styles/App.scss'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import { StateProvider } from './context/GameContext'
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';

function App() {

  return (
    <StateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/window" />} /> {/* nav to title latter in prod */}
          <Route path="/title" element={<TitleMenuScreen />} />
          <Route path="/window" element={<Window />} />
          <Route path="/gallery" element={<GalleryScreen />} />
          <Route path="/config" element={<ConfigScreen />} />
        </Routes>
      </BrowserRouter>
    </StateProvider>
  )
}

export default App
