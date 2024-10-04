import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { callGeminiApi } from "../api";

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
  const [position, setPosition] = useState({ x: 100, y: 200 });
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // canvas.width = window.innerWidth;
        // canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
      setResult([]);
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
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = theme === "dark" ? "white" : "black";
        ctx.lineTo(event.clientX, event.clientY);
        ctx.stroke();
      }
    }
  };

  const sendData = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const base64Image = canvas.toDataURL("image/png");

      const response = await callGeminiApi(base64Image, dictionaryOfVars);
      console.log("Response: ", response);
      const parsedResponse: Response[] = JSON.parse(response);
      console.log({ parsedResponse });
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
      <div className="absolute top-50 right-5 z-10 flex gap-2">
        <Button
          onClick={() => setReset(true)}
          variant="outline"
          className="bg-black text-white dark:bg-white dark:text-black"
        >
          Reset
        </Button>
        <Button
          onClick={sendData}
          className="z-20 bg-black text-white  dark:bg-white dark:text-black"
          variant="default"
          color="white"
        >
          Calculate
        </Button>
      </div>
      <canvas
        width="100%"
        height="100%"
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 bg-white dark:bg-black"
        onMouseDown={drawingStart}
        onMouseOut={drawingStop}
        onMouseUp={drawingStop}
        onMouseMove={draw}
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
