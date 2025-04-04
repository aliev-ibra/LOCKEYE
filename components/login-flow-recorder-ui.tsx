"use client"

import { useState } from "react"
import { Plus, Play, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { LoginFlowRecorder, type LoginFlowStep } from "@/lib/login-flow-recorder"

interface LoginFlowRecorderUIProps {
  onClose: () => void
  existingFlowId?: string
}

export function LoginFlowRecorderUI({ onClose, existingFlowId }: LoginFlowRecorderUIProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [steps, setSteps] = useState<LoginFlowStep[]>([])
  const [loading, setLoading] = useState(false)

  // Load existing flow if provided
  useState(() => {
    if (existingFlowId) {
      const flow = LoginFlowRecorder.getFlowById(existingFlowId)
      if (flow) {
        setName(flow.name)
        setUrl(flow.url)
        setSteps(flow.steps)
      }
    }
  })

  // Add a new step
  const addStep = (type: "input" | "click" | "wait") => {
    const newStep: LoginFlowStep = {
      type,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} action`,
      selector: type !== "wait" ? "" : undefined,
      value: type === "input" ? "" : undefined,
      waitTime: type === "wait" ? 1000 : undefined,
    }

    setSteps([...steps, newStep])
  }

  // Remove a step
  const removeStep = (index: number) => {
    const newSteps = [...steps]
    newSteps.splice(index, 1)
    setSteps(newSteps)
  }

  // Update a step
  const updateStep = (index: number, updates: Partial<LoginFlowStep>) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setSteps(newSteps)
  }

  // Save the flow
  const saveFlow = () => {
    // Validate inputs
    if (!name) {
      toast({
        title: "Error",
        description: "Please enter a name for the login flow",
        variant: "destructive",
      })
      return
    }

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL for the login flow",
        variant: "destructive",
      })
      return
    }

    if (steps.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one step to the login flow",
        variant: "destructive",
      })
      return
    }

    // Validate each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      if (!step.description) {
        toast({
          title: "Error",
          description: `Step ${i + 1} is missing a description`,
          variant: "destructive",
        })
        return
      }

      if (step.type !== "wait" && !step.selector) {
        toast({
          title: "Error",
          description: `Step ${i + 1} is missing a selector`,
          variant: "destructive",
        })
        return
      }

      if (step.type === "input" && !step.value) {
        toast({
          title: "Error",
          description: `Step ${i + 1} is missing a value`,
          variant: "destructive",
        })
        return
      }

      if (step.type === "wait" && (!step.waitTime || step.waitTime < 0)) {
        toast({
          title: "Error",
          description: `Step ${i + 1} has an invalid wait time`,
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      if (existingFlowId) {
        // Update existing flow
        LoginFlowRecorder.updateFlow(existingFlowId, {
          name,
          url,
          steps,
        })
      } else {
        // Add new flow
        LoginFlowRecorder.addFlow({
          name,
          url,
          steps,
        })
      }

      toast({
        title: "Success",
        description: `Login flow ${existingFlowId ? "updated" : "created"} successfully`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${existingFlowId ? "update" : "create"} login flow`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{existingFlowId ? "Edit" : "Create"} Login Flow</CardTitle>
        <CardDescription>Record a sequence of steps to automate complex login processes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flow-name">Flow Name</Label>
            <Input
              id="flow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bank Login"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flow-url">Website URL</Label>
            <Input
              id="flow-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Steps</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addStep("input")}>
                <Plus className="mr-1 h-3 w-3" />
                Input
              </Button>
              <Button variant="outline" size="sm" onClick={() => addStep("click")}>
                <Plus className="mr-1 h-3 w-3" />
                Click
              </Button>
              <Button variant="outline" size="sm" onClick={() => addStep("wait")}>
                <Plus className="mr-1 h-3 w-3" />
                Wait
              </Button>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No steps added yet. Add steps using the buttons above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="rounded-md border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Step {index + 1}</h4>
                    <Button variant="ghost" size="icon" onClick={() => removeStep(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-type`}>Type</Label>
                        <Select
                          value={step.type}
                          onValueChange={(value) =>
                            updateStep(index, {
                              type: value as "input" | "click" | "wait",
                              selector: value !== "wait" ? step.selector || "" : undefined,
                              value: value === "input" ? step.value || "" : undefined,
                              waitTime: value === "wait" ? step.waitTime || 1000 : undefined,
                            })
                          }
                        >
                          <SelectTrigger id={`step-${index}-type`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="input">Input</SelectItem>
                            <SelectItem value="click">Click</SelectItem>
                            <SelectItem value="wait">Wait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-description`}>Description</Label>
                        <Input
                          id={`step-${index}-description`}
                          value={step.description}
                          onChange={(e) => updateStep(index, { description: e.target.value })}
                          placeholder="Describe this step"
                        />
                      </div>
                    </div>

                    {step.type !== "wait" && (
                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-selector`}>CSS Selector</Label>
                        <Input
                          id={`step-${index}-selector`}
                          value={step.selector}
                          onChange={(e) => updateStep(index, { selector: e.target.value })}
                          placeholder="e.g., #username, .login-button"
                        />
                      </div>
                    )}

                    {step.type === "input" && (
                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-value`}>Value</Label>
                        <Input
                          id={`step-${index}-value`}
                          value={step.value}
                          onChange={(e) => updateStep(index, { value: e.target.value })}
                          placeholder="Text to input"
                        />
                      </div>
                    )}

                    {step.type === "wait" && (
                      <div className="space-y-2">
                        <Label htmlFor={`step-${index}-wait-time`}>Wait Time (ms): {step.waitTime}</Label>
                        <Input
                          id={`step-${index}-wait-time`}
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={step.waitTime}
                          onChange={(e) => updateStep(index, { waitTime: Number.parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={steps.length === 0}>
            <Play className="mr-2 h-4 w-4" />
            Test Flow
          </Button>
          <Button onClick={saveFlow} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Flow
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

