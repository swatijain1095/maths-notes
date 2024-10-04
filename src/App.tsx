import "./App.css";
import MathCanvas from "./components/MathCanvas";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1
            className="text-4xl font-bold text-black dark:text-white"
            style={{ zIndex: 100 }}
          >
            Maths Notes
          </h1>
          <ThemeToggle />
        </div>
        <MathCanvas />
      </div>
    </ThemeProvider>
  );
}

export default App;
