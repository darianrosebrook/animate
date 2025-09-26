import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Animator</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/ui/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Get started by reading the{' '}
          <a href="/implementation/README.md" target="_blank">
            implementation guide
          </a>
          .
        </p>
      </div>
    </>
  )
}

export default App
