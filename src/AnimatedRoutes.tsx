import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import { AnimatePresence } from 'framer-motion';
import SavesScreen from "./screens/SavesScreen";

const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <div className="page">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/window" />} /> {/* nav to title latter in prod */}
          <Route path="/title" element={<TitleMenuScreen />} />
          <Route path="/window" element={<Window />} />
          <Route path="/gallery" element={<GalleryScreen />} />
          <Route path="/config" element={<ConfigScreen />} />
          <Route path="/save" element={<SavesScreen variant="save" />} />
          <Route path="/load" element={<SavesScreen variant="load" />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default AnimatedRoutes