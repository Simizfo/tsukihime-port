import { useEffect } from 'react'
import '../styles/title-menu.scss'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const DisclaimerScreen = () => {
  const navigate = useNavigate()

  useEffect(()=> {
    const timeout = setTimeout(()=> {
      sawDisclaimer()
    }, 4000)
    return ()=> clearTimeout(timeout)
  }, [])

  const sawDisclaimer = () => {
    navigate("/title")
  }

  return (
    <motion.div
      className="page" id="disclaimer"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0, transition: {duration: 1}}}
      onClick={sawDisclaimer}
      >

      <div className="box">
        <p>
          This is a web version of <i>Tsukihime</i>, a visual novel published on 2000 by Type-Moon.
        </p>
        <p>
          The game contains adult content and is intended for mature audiences only.
        </p>
      </div>
    </motion.div>
  )
}

export default DisclaimerScreen
