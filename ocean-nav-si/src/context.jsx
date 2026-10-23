import { createContext, useContext } from "react";

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

export default AppContext;
