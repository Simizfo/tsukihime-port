import { motion } from "framer-motion"

type Props = {
  variant: "save" | "load"
}

const SavesScreen = (props: Props) => {
  return (
    <motion.div
      className="page" id="saves"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}>
      
    </motion.div>
  )
}

export default SavesScreen