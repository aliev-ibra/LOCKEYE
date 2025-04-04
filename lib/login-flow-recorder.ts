// Interface for login flow step
export interface LoginFlowStep {
  type: "input" | "click" | "wait"
  selector?: string
  value?: string
  waitTime?: number
  description: string
}

// Interface for login flow
export interface LoginFlow {
  id: string
  name: string
  url: string
  steps: LoginFlowStep[]
  createdAt: number
  updatedAt: number
}

// Login flow recorder manager
export class LoginFlowRecorder {
  private static FLOWS_KEY = "lockeye_login_flows"

  // Get all login flows
  static getFlows(): LoginFlow[] {
    const flowsJson = localStorage.getItem(this.FLOWS_KEY)
    if (!flowsJson) {
      return []
    }

    try {
      return JSON.parse(flowsJson)
    } catch (error) {
      return []
    }
  }

  // Save login flows
  static saveFlows(flows: LoginFlow[]): void {
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows))
  }

  // Add a new login flow
  static addFlow(flow: Omit<LoginFlow, "id" | "createdAt" | "updatedAt">): LoginFlow {
    const flows = this.getFlows()

    const newFlow: LoginFlow = {
      ...flow,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    flows.push(newFlow)
    this.saveFlows(flows)

    return newFlow
  }

  // Update a login flow
  static updateFlow(id: string, updates: Partial<Omit<LoginFlow, "id" | "createdAt" | "updatedAt">>): LoginFlow {
    const flows = this.getFlows()

    const flowIndex = flows.findIndex((flow) => flow.id === id)
    if (flowIndex === -1) {
      throw new Error("Flow not found")
    }

    flows[flowIndex] = {
      ...flows[flowIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    this.saveFlows(flows)

    return flows[flowIndex]
  }

  // Delete a login flow
  static deleteFlow(id: string): void {
    const flows = this.getFlows()

    const flowIndex = flows.findIndex((flow) => flow.id === id)
    if (flowIndex === -1) {
      throw new Error("Flow not found")
    }

    flows.splice(flowIndex, 1)
    this.saveFlows(flows)
  }

  // Get a login flow by ID
  static getFlowById(id: string): LoginFlow | null {
    const flows = this.getFlows()
    return flows.find((flow) => flow.id === id) || null
  }

  // Get login flows for a URL
  static getFlowsForUrl(url: string): LoginFlow[] {
    const flows = this.getFlows()

    // Extract the domain from the URL
    let domain = ""
    try {
      domain = new URL(url).hostname
    } catch (error) {
      return []
    }

    // Find flows that match the domain
    return flows.filter((flow) => {
      try {
        const flowDomain = new URL(flow.url).hostname
        return flowDomain === domain
      } catch (error) {
        return false
      }
    })
  }

  // Generate a browser extension script for a flow
  static generateExtensionScript(flow: LoginFlow): string {
    // This would generate a script that could be executed by a browser extension
    // For this demo, we'll just return a simplified representation

    let script = `// Login flow script for ${flow.name}\n`
    script += `// URL: ${flow.url}\n\n`

    flow.steps.forEach((step, index) => {
      script += `// Step ${index + 1}: ${step.description}\n`

      switch (step.type) {
        case "input":
          script += `document.querySelector('${step.selector}').value = '${step.value}';\n`
          break
        case "click":
          script += `document.querySelector('${step.selector}').click();\n`
          break
        case "wait":
          script += `await new Promise(resolve => setTimeout(resolve, ${step.waitTime}));\n`
          break
      }

      script += "\n"
    })

    return script
  }
}

