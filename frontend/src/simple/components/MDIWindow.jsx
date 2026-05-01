import { useRef, useCallback, useState } from 'react'
import useAppStore from '../stores/useAppStore'
import { HelpPopup } from '../screens/HelpSystem'

export default function MDIWindow({ id, title, icon, children }) {
  const { windows, focusedId, focusWindow, closeWindow, minimizeWindow, maximizeWindow, moveWindow, resizeWindow } = useAppStore()
  const win = windows.find(w => w.id === id)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const [showHelp, setShowHelp] = useState(false)

  const onDragStart = useCallback((e) => {
    if (win.maximized) return
    focusWindow(id)
    const startX = e.clientX - win.x
    const startY = e.clientY - win.y
    const onMove = (e2) => moveWindow(id, e2.clientX - startX, e2.clientY - startY)
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [win?.x, win?.y, win?.maximized, id])

  const onResizeStart = useCallback((e) => {
    if (win.maximized) return
    e.stopPropagation()
    focusWindow(id)
    const startX = e.clientX
    const startY = e.clientY
    const startW = win.w
    const startH = win.h
    const onMove = (e2) => resizeWindow(id, startW + (e2.clientX - startX), startH + (e2.clientY - startY))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [win?.w, win?.h, win?.maximized, id])

  if (!win || win.minimized) return null

  return (
    <div
      className={`mdi-window ${focusedId === id ? 'focused' : ''} ${win.maximized ? 'maximized' : ''}`}
      style={win.maximized ? {} : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onMouseDown={() => focusWindow(id)}
    >
      <div className="mdi-titlebar" onMouseDown={onDragStart} onDoubleClick={() => maximizeWindow(id)}>
        {icon && <span className="mdi-title-icon">{icon}</span>}
        <span className="mdi-title">{title}</span>
        <div className="mdi-win-btns">
          <button className="mdi-win-btn" onClick={(e) => { e.stopPropagation(); setShowHelp(s => !s) }} title="Help" style={{ color: '#eab308', fontWeight: 700, fontSize: 11 }}>?</button>
          <button className="mdi-win-btn" onClick={(e) => { e.stopPropagation(); minimizeWindow(id) }} title="Minimize">_</button>
          <button className="mdi-win-btn" onClick={(e) => { e.stopPropagation(); maximizeWindow(id) }} title="Maximize">□</button>
          <button className="mdi-win-btn close" onClick={(e) => { e.stopPropagation(); closeWindow(id) }} title="Close">✕</button>
        </div>
      </div>
      <div className="mdi-content" style={{ position: 'relative' }}>
        {children}
        {showHelp && <HelpPopup screenId={id} onClose={() => setShowHelp(false)} />}
      </div>
      {!win.maximized && <div className="mdi-resize" onMouseDown={onResizeStart} />}
    </div>
  )
}

