"use client"

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react"

interface MinimizablePanelProps {
  children: React.ReactNode
  title: string
  icon?: React.ReactNode
  side: 'left' | 'right' | 'top' | 'bottom'
  defaultMinimized?: boolean
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  className?: string
  onToggle?: (minimized: boolean) => void
}

export default function MinimizablePanel({
  children,
  title,
  icon,
  side,
  defaultMinimized = false,
  minWidth = 280,
  maxWidth = 600,
  minHeight = 200,
  maxHeight = 800,
  className = "",
  onToggle
}: MinimizablePanelProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized)
  const [isResizing, setIsResizing] = useState(false)
  const [size, setSize] = useState(
    side === 'left' || side === 'right' ? minWidth : minHeight
  )

  const handleToggle = useCallback(() => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    onToggle?.(newMinimized)
  }, [isMinimized, onToggle])

  const getMinimizedIcon = () => {
    switch (side) {
      case 'left':
        return isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
      case 'right':
        return isMinimized ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
      case 'top':
        return isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
      case 'bottom':
        return isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }
  }

  const getAnimationProps = () => {
    const isHorizontal = side === 'left' || side === 'right'
    
    if (isMinimized) {
      return {
        [isHorizontal ? 'width' : 'height']: isHorizontal ? 48 : 48,
        opacity: 0.8
      }
    }
    
    return {
      [isHorizontal ? 'width' : 'height']: size,
      opacity: 1
    }
  }

  const getResizeHandle = () => {
    const handleClass = "absolute bg-gray-600/50 hover:bg-blue-500/50 transition-colors duration-200 z-10"
    
    switch (side) {
      case 'left':
        return (
          <div
            className={`${handleClass} top-0 right-0 w-1 h-full cursor-col-resize`}
            onMouseDown={(e) => {
              setIsResizing(true)
              const startX = e.clientX
              const startWidth = size
              
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (e.clientX - startX)))
                setSize(newWidth)
              }
              
              const handleMouseUp = () => {
                setIsResizing(false)
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )
      case 'right':
        return (
          <div
            className={`${handleClass} top-0 left-0 w-1 h-full cursor-col-resize`}
            onMouseDown={(e) => {
              setIsResizing(true)
              const startX = e.clientX
              const startWidth = size
              
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - (e.clientX - startX)))
                setSize(newWidth)
              }
              
              const handleMouseUp = () => {
                setIsResizing(false)
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )
      case 'top':
        return (
          <div
            className={`${handleClass} bottom-0 left-0 w-full h-1 cursor-row-resize`}
            onMouseDown={(e) => {
              setIsResizing(true)
              const startY = e.clientY
              const startHeight = size
              
              const handleMouseMove = (e: MouseEvent) => {
                const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + (e.clientY - startY)))
                setSize(newHeight)
              }
              
              const handleMouseUp = () => {
                setIsResizing(false)
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )
      case 'bottom':
        return (
          <div
            className={`${handleClass} top-0 left-0 w-full h-1 cursor-row-resize`}
            onMouseDown={(e) => {
              setIsResizing(true)
              const startY = e.clientY
              const startHeight = size
              
              const handleMouseMove = (e: MouseEvent) => {
                const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - (e.clientY - startY)))
                setSize(newHeight)
              }
              
              const handleMouseUp = () => {
                setIsResizing(false)
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        )
    }
  }

  const getFlexDirection = () => {
    switch (side) {
      case 'left':
      case 'right':
        return 'flex-col'
      case 'top':
      case 'bottom':
        return 'flex-row'
    }
  }

  return (
    <motion.div
      className={`relative bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 flex ${getFlexDirection()} ${className}`}
      animate={getAnimationProps()}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8
      }}
      style={{
        borderWidth: side === 'left' ? '0 1px 0 0' : 
                    side === 'right' ? '0 0 0 1px' : 
                    side === 'top' ? '0 0 1px 0' : '1px 0 0 0'
      }}
    >
      {/* Panel Header */}
      <div className={`flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm ${
        isMinimized ? 'flex-1' : ''
      }`}>
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-blue-400">
              {icon}
            </div>
          )}
          <AnimatePresence>
            {!isMinimized && (
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-white text-sm"
              >
                {title}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggle}
          className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
          title={isMinimized ? `Expand ${title}` : `Minimize ${title}`}
        >
          {getMinimizedIcon()}
        </Button>
      </div>

      {/* Panel Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle */}
      {!isMinimized && getResizeHandle()}

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 border-dashed rounded pointer-events-none" />
      )}
    </motion.div>
  )
}
