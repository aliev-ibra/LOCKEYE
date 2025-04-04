"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-muted-foreground mb-4"
          >
            {icon}
          </motion.div>
          <CardTitle className="mb-2">{title}</CardTitle>
          <CardDescription className="text-center mb-6">{description}</CardDescription>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={onAction}>
              <Plus className="mr-2 h-4 w-4" /> {actionLabel}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

