import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import { AnimatePresence } from 'framer-motion';
import LoadScreen from "./screens/LoadScreen";

const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <div id="root-view">
      <div id="view">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/title" />} />
            <Route path="/title" element={<TitleMenuScreen />} />
            <Route path="/window" element={<Window />} />
            <Route path="/gallery" element={<GalleryScreen />} />
            <Route path="/config" element={<ConfigScreen />} />
            <Route path="/load" element={<LoadScreen />} />
            <Route path="/load" element={<LoadScreen />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnimatedRoutes