import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
const MathCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reset, setReset] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  useEffect(() => {
    if (reset) {
      resetCanvas();
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
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = theme === "dark" ? "white" : "black";
        ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        ctx.stroke();
      }
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
          // onClick={runRoute}
          className="z-20 bg-black text-white  dark:bg-white dark:text-black"
          variant="default"
          color="white"
        >
          Calculate
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full bg-white dark:bg-black"
        onMouseDown={drawingStart}
        onMouseOut={drawingStop}
        onMouseUp={drawingStop}
        onMouseMove={draw}
      />
    </>
  );
};

export default MathCanvas;
