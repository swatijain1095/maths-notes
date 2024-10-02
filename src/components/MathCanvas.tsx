import React, { useRef } from "react";

const MathCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className="absolute top-0 w-full h-full bg-black"
    />
  );
};

export default MathCanvas;
