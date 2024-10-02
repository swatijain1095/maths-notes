import "./App.css";
import MathCanvas from "./components/MathCanvas";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <MathCanvas />
    </ThemeProvider>
  );
}

export default App;
