import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { callGeminiApi } from "../api";
import { ThemeToggle } from "./ThemeToggle";
import { Eraser, PencilLine } from "lucide-react";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

const MathCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reset, setReset] = useState(false);
  const [dictionaryOfVars, setDictionaryOfVars] = useState({});
  const [result, setResult] = useState<GeneratedResult[]>([]);
  const [position] = useState({ x: 100, y: 200 });
  const [isErasing, setIsErasing] = useState(false);
  const { theme } = useTheme();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setResult([]);
      setDictionaryOfVars({});
      setReset(false);
    }
  }, [reset]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const drawingStart = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const drawingStop = () => {
    setIsDrawing(false);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (isErasing) {
          ctx.clearRect(
            event.nativeEvent.offsetX - 10,
            event.nativeEvent.offsetY - 10,
            15,
            15
          );
        } else {
          ctx.strokeStyle = theme === "dark" ? "white" : "black";
          ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
          ctx.stroke();
        }
      }
    }
  };

  const sendData = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const base64Image = canvas.toDataURL("image/png");
      setResult([]);
      const response = await callGeminiApi(base64Image, dictionaryOfVars);

      const parsedResponse: Response[] = JSON.parse(response);

      parsedResponse.forEach((data) => {
        if (data.assign) {
          setDictionaryOfVars((prev) => ({
            ...prev,
            [data.expr]: data.result,
          }));
        }

        setResult((prevResults) => [
          ...prevResults,
          { expression: data.expr, answer: data.result },
        ]);
      });
    }
  };

  return (
    <>
      <h1 className="absolute top-5 left-5 text-4xl font-bold text-black dark:text-white">
        Maths Notes
      </h1>

      <div className="absolute right-5 top-5 flex gap-2">
        <Button
          onClick={() => setIsErasing(!isErasing)}
          className="text-black dark:text-white"
          variant="outline"
        >
          {isErasing ? <Eraser /> : <PencilLine />}
        </Button>
        <Button
          onClick={() => setReset(true)}
          variant="outline"
          className=" text-black dark:text-white"
        >
          Reset
        </Button>
        <Button
          onClick={sendData}
          className="text-black dark:text-white"
          variant="outline"
        >
          Calculate
        </Button>
        <ThemeToggle />
      </div>

      <canvas
        ref={canvasRef}
        id="canvas"
        className=" top-0 bg-white dark:bg-black"
        onMouseDown={drawingStart}
        onMouseOut={drawingStop}
        onMouseUp={drawingStop}
        onMouseMove={draw}
        style={{
          cursor: isErasing
            ? `url('../src/assets/eraser-${theme}.svg') 5 22, auto`
            : `url('../src/assets/pencil-${theme}.svg') 5 22, auto`,
        }}
      />

      {result &&
        result.map((result, index) => (
          <div
            key={index}
            className="absolute p-2 text-white rounded shadow-md"
            style={{ left: 30, top: position.y + index * 30 }}
          >
            <div>{` ${result.expression} = ${result.answer} `}</div>
          </div>
        ))}
    </>
  );
};

export default MathCanvas;
