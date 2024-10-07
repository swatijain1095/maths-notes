import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { callGeminiApi } from "../api";
import { ThemeToggle } from "./ThemeToggle";
import { Eraser, PencilLine } from "lucide-react";
import Draggable from "react-draggable";
import { Slider } from "./ui/slider";
import html2canvas from "html2canvas";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
}

const MathCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult[]>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserSize, setEraserSize] = useState(25);
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
  }, []);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setResult([]);
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
    const canvasContainer = canvasContainerRef.current;

    if (canvasContainer) {
      const canvas = await html2canvas(canvasContainer);
      const base64Image = canvas.toDataURL("image/png");
      const response = await callGeminiApi(base64Image);
      resetCanvas();
      const parsedResponse: Response[] = JSON.parse(response);
      const formattedResponse = parsedResponse.map(({ expr, result }) => ({
        expression: expr,
        answer: result,
      }));
      const uniqueResult = formattedResponse.filter(
        ({ expression, answer }) => {
          return !result.some(
            (item) => item.expression === expression && item.answer === answer
          );
        }
      );
      setResult([...result, ...uniqueResult]);
    }
  };

  return (
    <>
      <div className="absolute top-2 left-2 right-2 flex flex-col md:flex-row justify-between items-center md:items-start md:p-4 z-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl  font-bold text-black dark:text-white">
          Maths Notes
        </h1>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
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
      </div>
      <div className="absolute flex gap-3 bottom-5 left-[50%] right-[50%] w-[50%] md:w-[280px] translate-x-[-50%] z-10">
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
      <div ref={canvasContainerRef} className="w-full h-full relative">
        <canvas
          ref={canvasRef}
          id="canvas"
          className="bg-white dark:bg-black w-full h-full"
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
              defaultPosition={{ x: 100, y: 200 + index * 30 }}
            >
              <div
                className="absolute p-2 z-10 text-black dark:text-white cursor-pointer text-xl sm:text-2xl"
                style={{ top: 0 }}
              >
                {` ${result.expression} = ${result.answer} `}
              </div>
            </Draggable>
          ))}
      </div>
    </>
  );
};

export default MathCanvas;
