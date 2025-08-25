
import * as React from "react"
import { SidebarContext, SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE } from "./types"
import { useIsMobile } from "@/hooks/use-mobile"
import Cookies from "js-cookie"

interface SidebarProviderProps {
  children: React.ReactNode
  defaultState?: "expanded" | "collapsed"
}

export function SidebarProvider({
  children,
  defaultState = "expanded",
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)
  const isMobile = useIsMobile()
  const [state, setState] = React.useState<"expanded" | "collapsed">(() => {
    // Get the state from cookie on client-side
    if (typeof window !== "undefined") {
      const savedState = Cookies.get(SIDEBAR_COOKIE_NAME) as
        | "expanded"
        | "collapsed"
        | undefined
      return savedState || defaultState
    }
    return defaultState
  })

  const toggleSidebar = React.useCallback(() => {
    const newState = state === "expanded" ? "collapsed" : "expanded"
    setState(newState)
    Cookies.set(SIDEBAR_COOKIE_NAME, newState, {
      expires: SIDEBAR_COOKIE_MAX_AGE,
    })
  }, [state])

  return (
    <SidebarContext.Provider
      value={{
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
