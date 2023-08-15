import { useEffect, useReducer } from 'react'
import '../styles/title-menu.scss'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import strings from '../utils/lang'
import { bb } from '../utils/utils'
import { useObserver } from '../utils/Observer'

const DisclaimerScreen = () => {
  const navigate = useNavigate()
  const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
  useObserver(forceUpdate, strings, 'translation-name')

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
        {strings.disclaimer.map((txt,i)=><p key={i}>{bb(txt)}</p>)}
      </div>
    </motion.div>
  )
}

export default DisclaimerScreen
