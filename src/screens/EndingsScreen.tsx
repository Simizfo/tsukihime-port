import { Link } from 'react-router-dom'
import '../styles/endings.scss'
import { motion } from 'framer-motion'
import strings from '../utils/lang'
import { SCREEN } from '../utils/display'
import { settings } from '../utils/variables'
import chalkboard from '../assets/images/chalkboard.webp'
import { wbb } from '../utils/utils'

const imgPrefix = "/image/event/"

const EndingsScreen = () => {
  const endings = [
    {name: wbb(strings.scenario.routes.aki['13b']), character: "aki", type: "Normal", img: "aki_f01", route: "aki"},
    {name: wbb(strings.scenario.routes.aki['13a']), character: "aki", type: "True", img: "aki_f02"},
    {name: wbb(strings.scenario.routes.ark['13b']), character: "ark", type: "Good", img: "ark_f02"},
    {name: wbb(strings.scenario.routes.ark['13a']), character: "ark", type: "True", img: "ark_f03"},
    {name: wbb(strings.scenario.routes.cel['13b']), character: "cel", type: "Good", img: "cel_e07a"},
    {name: wbb(strings.scenario.routes.cel['13a']), character: "cel", type: "True", img: "cel_f02"},
    {name: wbb(strings.scenario.routes.his['14b']), character: "his", type: "Good", img: "his_f02"},
    {name: wbb(strings.scenario.routes.his['14a']), character: "his", type: "True", img: "his_f03"},
    {name: wbb(strings.scenario.routes.koha['12a']), character: "koha", type: "True", img: "koha_f01"},
  ]

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
            {endings.map((ending, index) =>
              <div key={index} className={`ending ${ending.character}`}>
                <img className="ending-img" src={`${imgPrefix}${ending.img}.webp`} alt={ending.name} />
                <div className="ending-name">{ending.name}</div>
                <div className="ending-bottom">
                  <div>{strings.characters[ending.character as keyof typeof strings.characters]}</div>
                  <div className="ending-type">{ending.type}</div>
                </div>
              </div>
            )}
          </div>

          <div className="badendings-list">
            <h3>Oshiete</h3>

            {/* TODO: tooltip with the title of each bad end */}
            <div className="badending">
              <img src={chalkboard} alt="Bad Endings" />
            </div>
            <div className="badending">
              <img src={chalkboard} alt="Bad Endings" />
            </div>
            <div className="badending">
              <img src={chalkboard} alt="Bad Endings" />
            </div>
          </div>
        </main>

        <Link to={SCREEN.EXTRA} className="menu-btn back-button">{strings.back}</Link>
      </div>
    </motion.div>
  )
}

export default EndingsScreen