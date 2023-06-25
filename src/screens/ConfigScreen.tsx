import React from 'react'
import { Link } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { store } from '../context/GameContext'
import '../styles/config.scss'

const ConfigScreen = () => {
  const { state } = useContext(store)


  return (
    <div className="page" id="config">
      <div className="page-content">
        <main>
          
        </main>

        <Link to="/title" className="back-button">Back</Link>
      </div>
    </div>
  )
}

export default ConfigScreen