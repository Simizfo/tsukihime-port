import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'
import chalkboard from '../assets/images/chalkboard.webp'
import { wbb } from '../utils/utils'
import { RouteEnding, endings, osiete } from '../utils/endings'

const imgPrefix = "/image/event/"
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

          <div className="endings-list">
          {Object.values(endings).map((ending, index) => {
            if (ending.seen) {
              return <EndingComponent ending={ending} key={index} />
            } else {
              return <div key={index} className="ending" />
            }
          })}
          </div>

          <div className="badendings-list">
            <h3>{strings.endings.osiete}</h3>
            {Object.values(osiete).filter(e=>e?.seen).map((ending, index)=>
              // TODO: tooltip with the title of each bad end
              <div key={index} className="badending">
                <img src={chalkboard} alt="Bad Ending" />
              </div>
            )}
          </div>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen

const EndingComponent = ({ending:{char, image, name, day, type}}: {ending: RouteEnding}) => {
  return (
    <div className={`ending ${char}`}>
      <img className="ending-img" src={`${imgPrefix}${image}.webp`} alt={name} />
      <div className="ending-name">{wbb(strings.scenario.routes[char][day])}</div>
      <div className="ending-bottom">
        <div>{strings.characters[char]}</div>
        <div className="ending-type">{type}</div>
      </div>
    </div>
  )
}