import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'
import { settings } from '../utils/variables'

//Distant Reed Warbler (Akiha Normal Ending)
//Warm Afternoon Nap (Akiha True Ending)
//Moon at Dawn (Arcueid Good Ending)
//Tsukihime (Arcueid True Ending)
//Sun (Ciel Good Ending)
//Daylight Blue (Ciel True Ending)
//Dreams of Sunshine (Hisui Good Ending)
//Midday Moon (Hisui True Ending)
//Dreams of Sunshine (Kohaku True Ending)

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
          
          {/* {settings.completedScenes.map((scene, index) =>
            <div key={index} className="ending">
              {scene}
            </div>
          )} */}

          <div className="endings-list">
            <div className="ending">
              Distant Reed Warbler (Akiha Normal Ending)
            </div>
            <div className="ending">
              Warm Afternoon Nap (Akiha True Ending)
            </div>
            <div className="ending">
              Moon at Dawn (Arcueid Good Ending)
            </div>
            <div className="ending">
              Tsukihime (Arcueid True Ending)
            </div>
            <div className="ending">
              Sun (Ciel Good Ending)
            </div>
            <div className="ending">
              Daylight Blue (Ciel True Ending)
            </div>
            <div className="ending">
              Dreams of Sunshine (Hisui Good Ending)
            </div>
            <div className="ending">
              Midday Moon (Hisui True Ending)
            </div>
            <div className="ending">
              Dreams of Sunshine (Kohaku True Ending)
            </div>
          </div>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen