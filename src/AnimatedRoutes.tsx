import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import { AnimatePresence } from 'framer-motion';
import LoadScreen from "./screens/LoadScreen";
import { useObserver } from "./utils/Observer";
import { settings } from "./utils/variables";
import { useState } from "react";
import { ViewRatio } from "./types";
import { Slide, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.scss'


const AnimatedRoutes = () => {
  const location = useLocation()
  const [style, setStyle] = useState<Record<string, any>>({
    "--font": settings.font
  })
  const [viewStyle, setViewStyle] = useState<Record<string, any>>({
    "--ratio": settings.fixedRatio == ViewRatio.unconstrained ? "initial" : `${settings.fixedRatio}`,
    "--width": settings.fixedRatio == ViewRatio.unconstrained ? "100%" : "initial"
  })

  useObserver(font => {
    setStyle({...style, '--font': font})
  }, settings, "font")

  useObserver(ratio => {
    if (ratio == ViewRatio.unconstrained) {
      setViewStyle({...viewStyle, '--ratio': "initial", '--width': "100%"})
    } else {
      setViewStyle({...viewStyle, '--ratio': `${ratio}`, '--width': "initial"})
    }
  }, settings, "fixedRatio")

  return (
    <div id="root-view" style={style}>
      <div id="view" style={viewStyle}>
        <AnimatePresence mode="wait">
          <ToastContainer
            transition={Slide}
            position="bottom-right"
            theme="dark" />
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