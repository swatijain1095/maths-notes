import "./App.css";
import MathCanvas from "./components/MathCanvas";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <MathCanvas />
    </ThemeProvider>
  );
}

export default App;
