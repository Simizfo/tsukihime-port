import { motion } from "framer-motion"
import '../styles/saves.scss'
import SavesLayout from "../components/SavesLayout"
import { Link } from "react-router-dom"

const LoadScreen = () => {
  return (
    <motion.div
      className="page" id="saves"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <main>
          <SavesLayout variant="load" />
        </main>

        <Link to="/title" className="menu-btn back-button">Back</Link>
      </div>
    </motion.div>
  )
}

export default LoadScreen