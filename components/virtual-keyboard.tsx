"use client"

import { useState, useEffect } from "react"
import { Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onEnter: () => void
  onBackspace: () => void
  className?: string
  randomize?: boolean
}

export function VirtualKeyboard({
  onKeyPress,
  onEnter,
  onBackspace,
  className,
  randomize = true,
}: VirtualKeyboardProps) {
  // Define the keyboard layouts
  const standardLayout = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ]

  const symbolsLayout = [
    ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
    ["-", "_", "=", "+", "[", "]", "{", "}", "|", "\\"],
    [";", ":", "'", '"', ",", ".", "<", ">", "/", "?"],
    ["~", "`"],
  ]

  // State for the current layout
  const [layout, setLayout] = useState<string[][]>(standardLayout)
  const [showSymbols, setShowSymbols] = useState(false)
  const [showShift, setShowShift] = useState(false)

  // Function to shuffle an array
  const shuffleArray = (array: string[]): string[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Randomize the layout
  const randomizeLayout = () => {
    const currentBase = showSymbols ? symbolsLayout : standardLayout

    // Create a new layout with shuffled rows
    const newLayout = currentBase.map((row) => shuffleArray(row))
    setLayout(newLayout)
  }

  // Initialize the layout
  useEffect(() => {
    if (randomize) {
      randomizeLayout()
    } else {
      setLayout(showSymbols ? symbolsLayout : standardLayout)
    }
  }, [showSymbols, randomize])

  // Handle key press
  const handleKeyPress = (key: string) => {
    // Apply shift if needed
    const finalKey = showShift ? key.toUpperCase() : key
    onKeyPress(finalKey)

    // Reset shift after use
    if (showShift) {
      setShowShift(false)
    }
  }

  // Toggle between letters and symbols
  const toggleSymbols = () => {
    setShowSymbols(!showSymbols)
  }

  // Toggle shift
  const toggleShift = () => {
    setShowShift(!showShift)
  }

  return (
    <div className={cn("p-2 bg-background border rounded-lg shadow-lg", className)}>
      {/* Keyboard rows */}
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 mb-1">
          {row.map((key, keyIndex) => (
            <Button
              key={`${rowIndex}-${keyIndex}-${key}`}
              variant="outline"
              size="sm"
              className="w-10 h-10 text-center"
              onClick={() => handleKeyPress(key)}
            >
              {showShift ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>
      ))}

      {/* Bottom row with special keys */}
      <div className="flex justify-center gap-1">
        <Button variant="outline" size="sm" className="px-3" onClick={toggleShift}>
          Shift
        </Button>

        <Button variant="outline" size="sm" className="px-3" onClick={toggleSymbols}>
          {showSymbols ? "ABC" : "!@#"}
        </Button>

        <Button variant="outline" size="sm" className="px-3 flex-grow" onClick={() => handleKeyPress(" ")}>
          Space
        </Button>

        <Button variant="outline" size="sm" className="px-3" onClick={onBackspace}>
          ←
        </Button>

        <Button variant="outline" size="sm" className="px-3" onClick={onEnter}>
          Enter
        </Button>

        {randomize && (
          <Button variant="outline" size="sm" className="px-3" onClick={randomizeLayout}>
            <Shuffle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

