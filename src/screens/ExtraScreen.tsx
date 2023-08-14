import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/extra.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'


const ExtraScreen = () => {

  return (
    <motion.div
      className="page" id="extra"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      <div className="page-content">
        <h2 className="page-title">Extra</h2>
        <main>
          
          <Link to={SCREEN.GALLERY}>Gallery</Link>
          <Link to={SCREEN.ENDINGS}>Endings</Link>
        </main>

        <Link to={SCREEN.TITLE} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default ExtraScreen