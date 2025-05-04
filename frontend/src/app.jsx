import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/home'  
import Chat from './pages/chat'  
import Perfil from './pages/perfil'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/perfil" element={<Perfil />} />
    </Routes>
  )
}

export default App