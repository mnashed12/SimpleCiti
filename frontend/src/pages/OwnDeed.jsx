import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/pure.css'

export default function OwnDeed() {
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPosition')
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10) || 0)
      sessionStorage.removeItem('scrollPosition')
    }
  }, [])

  const saveScroll = () => {
    sessionStorage.setItem('scrollPosition', String(window.scrollY))
  }
  return (
    <div className="pure-root">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <Link to="/Pure" className="tab-button" onClick={saveScroll}>Pure Play 1031</Link>
        <Link to="/OwnDeed" className="tab-button active" onClick={saveScroll}>Own The Deed</Link>
      </div>

      <div className="container own-deed">
        <h1>Own The Deed</h1>

        {/* Own The Deed Content */}
        <div className="blog-item">
          <p><strong>Understanding Direct Ownership</strong></p>
          <p>Summary or excerpt of the blog goes here. Learn about the benefits of holding deeded real estate versus beneficial interests.</p>
        </div>
        <div className="blog-item">
          <p><strong>The Power of TIC Structures</strong></p>
          <p>Summary or excerpt of the blog goes here. Discover how Tenant-in-Common ownership provides flexibility and control.</p>
        </div>
        <div className="blog-item">
          <p><strong>Why Direct Title Matters</strong></p>
          <p>Explore the fundamental differences between owning actual title to property versus holding a beneficial interest in a trust structure.</p>
        </div>
      </div>
    </div>
  )
}
