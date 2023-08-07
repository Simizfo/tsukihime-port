import { motion } from "framer-motion"
import '../styles/saves.scss'
import SavesLayout from "../components/SavesLayout"
import { useNavigate } from "react-router-dom"
import { SCREEN } from "../utils/variables"

const LoadScreen = () => {
  const navigate = useNavigate()

  function back(saveLoaded: boolean) {
    if (!saveLoaded)
      navigate(SCREEN.TITLE)
  }
  return (
    <motion.div
      className="page" id="saves"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <SavesLayout variant="load" back={back}/>
      </div>
    </motion.div>
  )
}

export default LoadScreen