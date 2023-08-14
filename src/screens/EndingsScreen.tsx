import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'


const EndingsScreen = () => {

  return (
    <motion.div
      className="page" id="endings"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Endings</h2>
        <main>
          
          
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen