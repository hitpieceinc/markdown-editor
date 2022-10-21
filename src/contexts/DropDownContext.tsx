import React, { ReactNode, useContext, useState } from "react"

const DropDownContext = React.createContext<{
  closeDropDown: boolean
  setCloseDropDown: (_: boolean) => void
}>({
  closeDropDown: false,
  setCloseDropDown: () => {},
})

const DropDownProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [closeDropDown, setCloseDropDown] = useState(false)

  return (
    <DropDownContext.Provider
      value={{
        closeDropDown,
        setCloseDropDown,
      }}
    >
      {children}
    </DropDownContext.Provider>
  )
}

export const useDropDown = () => useContext(DropDownContext)

export { DropDownContext, DropDownProvider }
