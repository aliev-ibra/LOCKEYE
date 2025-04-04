"use client"

import { useState, useEffect } from "react"

export const useMasterPassword = () => {
  const [masterPassword, setMasterPassword] = useState("")
  const [isMasterPasswordSet, setIsMasterPasswordSet] = useState(false)

  useEffect(() => {
    // In a real implementation, you might check for a stored master password here
    // For this demo, we'll assume it's not set initially
    setIsMasterPasswordSet(false)
  }, [])

  return {
    masterPassword,
    setMasterPassword,
    isMasterPasswordSet,
  }
}

