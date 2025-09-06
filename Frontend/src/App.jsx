import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {BrowserRouter as Router,Routes,Route} from "react-router-dom"
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    
     <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
