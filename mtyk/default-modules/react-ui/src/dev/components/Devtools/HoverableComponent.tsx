import { useState } from 'react'

interface HoverableComponentProps {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  children: React.ReactNode
  name: React.ReactNode
}

export const HoverableComponent: React.FC<HoverableComponentProps> = ({
  boundingBox,
  children,
  name,
}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
    >
      {children}
      <div
        className={`border border-red-500 fixed ${hovered ? '' : 'hidden'}`}
        style={{
          pointerEvents: 'none',
          top: boundingBox.y,
          left: boundingBox.x,
          width: boundingBox.width,
          height: boundingBox.height,
        }}
      >
        {name && (
          <div
            className="absolute
        
          top-0 left-1/2 transform -translate-x-1/2 text-xs
          bg-red-500 text-white px-2 py-1 rounded
        "
          >
            {name}
          </div>
        )}
      </div>
    </div>
  )
}
