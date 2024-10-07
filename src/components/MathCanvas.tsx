import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { callGeminiApi } from "../api";
import { ThemeToggle } from "./ThemeToggle";
import { Eraser, PencilLine } from "lucide-react";
import Draggable from "react-draggable";
import { Slider } from "./ui/slider";

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
  const [isErasing, setIsErasing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserSize, setEraserSize] = useState(15);
  const { theme } = useTheme();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const rootContainer = document.getElementById("root");
    if (canvas && rootContainer) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = rootContainer.clientWidth;
        canvas.height = rootContainer.clientHeight;
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;
      }
    }
  }, [lineWidth]);

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
            event.nativeEvent.offsetX - eraserSize / 2,
            event.nativeEvent.offsetY - eraserSize / 2,
            eraserSize,
            eraserSize
          );
        } else {
          ctx.strokeStyle = theme === "dark" ? "white" : "black";
          ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
          ctx.lineWidth = lineWidth;
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
          {isErasing ? <PencilLine /> : <Eraser />}
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
      <div className=" absolute flex gap-3 bottom-5 left-[50%] right-[50%] w-[280px] translate-x-[-50%]">
        <Slider
          defaultValue={isErasing ? [eraserSize] : [lineWidth]}
          max={isErasing ? 50 : 10}
          value={isErasing ? [eraserSize] : [lineWidth]}
          onValueChange={(value) =>
            isErasing ? setEraserSize(value[0]) : setLineWidth(value[0])
          }
          className="w-[100%]"
        />
        {isErasing ? <Eraser /> : <PencilLine />}
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="bg-white dark:bg-black"
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
          <Draggable
            key={index}
            defaultPosition={{ x: position.x, y: position.y + index * 30 }}
            onStop={(_, data) =>
              setPosition({ x: data.deltaX, y: data.deltaX })
            }
          >
            <div
              className="absolute p-2 text-black dark:text-white cursor-pointer"
              style={{ top: 0 }}
            >
              {` ${result.expression} = ${result.answer} `}
            </div>
          </Draggable>
        ))}
    </>
  );
};

export default MathCanvas;
