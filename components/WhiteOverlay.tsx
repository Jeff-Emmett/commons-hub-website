"use client";

import { motion } from "framer-motion"

export default function WhiteOverlay() {
  return (
    <motion.div 
             initial={{
              x: 0,
              opacity: 100
              }}
              animate={{
                  x: '-1000vw',
                  opacity: 1
              }}
              transition={{
                duration: 0.5
            }}
            className="w-full h-full bg-white absolute"></motion.div>
  )
}
