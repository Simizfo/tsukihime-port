import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { StrictMode } from 'react';

function App() {

  return (
    <StrictMode>
      <BrowserRouter basename="/tsukidev">
        <AnimatedRoutes />
      </BrowserRouter>
    </StrictMode>
  )
}

export default App
