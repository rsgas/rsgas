import logo from '../../Assets/icon/icon.png'; // relative to the file

import { useState, useRef, useEffect } from 'react'

const NavigationBar = () => {
    var navRef = useRef(null)
  // var isMobile = useState()
  var [isOpen, setIsOpen] = useState(false) 

  // var theme = {
  //   "dark": {
  //     "origin": "dark-theme",
  //     "button": "dark-button"
  //   }
  // }

  const navbar = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleGlobalClick = () => {
      setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('click', handleGlobalClick)
    } else {
      document.removeEventListener('click', handleGlobalClick)
  }

    return () => document.removeEventListener('click', handleGlobalClick)
  }, [isOpen])

  return (
    <>
      <div className={`navbar`}>
        <div className="icon">
          <a href="#">
            <img src={logo} alt="Logo" className='img-icon'/>
          </a>
          <h2>Awhbiem</h2>
        </div>
        <div className="tags">
          <div className="container">
            <a className="tag" href='#home'>Home</a>
            <a className="tag" href='#about'>About</a>
            <a className="tag" href='#project'>Project</a>
            <a className="tag" href='#contact'>Contact</a>
          </div>
        </div>
          <div className="icon-tags">
            <a className={`fa-solid fa-bars`} onClick={navbar}></a>
          </div>
      </div>
      <div  ref={navRef} 
            className={` responsive-navbar ${isOpen ? "active" : ""}`}
            onClick={(e) => e.stopPropagation()}
            >
        <div className={`wrap-responsive ${isOpen ? "active" : ""}`}>
          <div className={`container-responsive `}>
            <a onClick={() => setIsOpen(false)} className="tag res" href='#home'>Home</a>
            <a onClick={() => setIsOpen(false)} className="tag res" href='#about'>About</a>
            <a onClick={() => setIsOpen(false)} className="tag res" href='#project'>Project</a>
            <a onClick={() => setIsOpen(false)} className="tag res" href='#contact'>Contact</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavigationBar