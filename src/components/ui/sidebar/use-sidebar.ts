
import * as React from "react"
import { SidebarContext } from "./types"
import { SidebarProvider } from "./sidebar-provider"

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

// Export the SidebarProvider component
export { SidebarProvider }
