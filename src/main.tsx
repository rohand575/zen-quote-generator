import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.classList.add("dark");
document.documentElement.style.colorScheme = "dark";
document.body.style.backgroundColor = "hsl(var(--background))";
document.body.style.color = "hsl(var(--foreground))";

createRoot(document.getElementById("root")!).render(<App />);
