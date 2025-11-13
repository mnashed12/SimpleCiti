import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/pure.css'

export default function Newsletter() {
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPosition')
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10) || 0)
      sessionStorage.removeItem('scrollPosition')
    }
  }, [])

  const saveScroll = () => sessionStorage.setItem('scrollPosition', String(window.scrollY))

  return (
    <div className="pure-root">
      <div className="tabs-container">
        <Link to="/Newsletter" className="tab-button active" onClick={saveScroll}>Newsletter</Link>
        <Link to="/Blog" className="tab-button" onClick={saveScroll}>Blog</Link>
      </div>

      <div className="container own-deed">
        <h1>Newsletter</h1>
      </div>
    </div>
  )
}
