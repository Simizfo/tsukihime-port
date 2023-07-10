import './styles/App.scss'
import { BrowserRouter } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import { observe } from './utils/Observer';
import { displayMode } from './utils/variables';
import AnimatedRoutes from './AnimatedRoutes';

function App() {

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

observe(displayMode, 'screen', (screen)=> {
  console.log("[SCREEN]", screen)
})

export default App
