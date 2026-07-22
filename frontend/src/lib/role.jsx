import React, { createContext, useContext, useEffect, useState } from "react";

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem("sg_role") || "");
  const [name, setName] = useState(() => localStorage.getItem("sg_name") || "");

  useEffect(() => {
    localStorage.setItem("sg_role", role);
    localStorage.setItem("sg_name", name);
    // theme: dark for officer + admin, light for citizen and landing
    const isDark = role === "officer" || role === "admin";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.style.backgroundColor = isDark ? "#0B1120" : "#F8FAFC";
  }, [role, name]);

  return (
    <RoleContext.Provider value={{ role, setRole, name, setName }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
