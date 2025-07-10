import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Brush, Eraser, Undo, Trash2, Palette } from 'lucide-react';

interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  timestamp: Date;
}

interface DrawingCanvasProps {
  width: number;
  height: number;
  strokes: DrawingStroke[];
  canDraw: boolean;
  onStrokeAdded: (stroke: DrawingStroke) => void;
  onClearCanvas: () => void;
  onUndoStroke: () => void;
  className?: string;
}

const COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
];

const BRUSH_SIZES = [2, 4, 6, 8, 12, 16];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height,
  strokes,
  canDraw,
  onStrokeAdded,
  onClearCanvas,
  onUndoStroke,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}

    const ctx = canvas.getContext('2d');
    if (!ctx) {return;}

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw current stroke if drawing
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) {return;}

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Move to first point
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Draw smooth lines between points
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      const prevPoint = stroke.points[i - 1];

      // Use quadratic curves for smoother lines
      const cpx = (prevPoint.x + point.x) / 2;
      const cpy = (prevPoint.y + point.y) / 2;

      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, cpy);
    }

    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {return { x: 0, y: 0 };}

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) {return;}

    const coords = getCanvasCoordinates(e);
    const strokeColor = tool === 'eraser' ? '#ffffff' : selectedColor;
    const strokeWidth = tool === 'eraser' ? brushSize * 2 : brushSize;

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [coords],
      color: strokeColor,
      width: strokeWidth,
      timestamp: new Date(),
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
  };

  const continueDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || !canDraw) {return;}

    const coords = getCanvasCoordinates(e);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, coords],
    };

    setCurrentStroke(updatedStroke);
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) {return;}

    // Only add stroke if it has at least 2 points
    if (currentStroke.points.length >= 2) {
      onStrokeAdded(currentStroke);
    }

    setCurrentStroke(null);
    setIsDrawing(false);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    startDrawing(mouseEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    continueDrawing(mouseEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Drawing Tools */}
      {canDraw && (
        <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
          <div className='flex flex-wrap items-center gap-4'>
            {/* Tool Selection */}
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => setTool('brush')}
                className={`p-2 rounded-lg ${
                  tool === 'brush'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title='Brush'
              >
                <Brush className='w-4 h-4' />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg ${
                  tool === 'eraser'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title='Eraser'
              >
                <Eraser className='w-4 h-4' />
              </button>
            </div>

            {/* Color Palette */}
            {tool === 'brush' && (
              <div className='flex items-center space-x-1'>
                <Palette className='w-4 h-4 text-gray-600' />
                <div className='flex space-x-1'>
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded border-2 ${
                        selectedColor === color
                          ? 'border-gray-800'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Brush Size */}
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-600'>Size:</span>
              <select
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className='px-2 py-1 border border-gray-300 rounded text-sm'
              >
                {BRUSH_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center space-x-2'>
              <button
                onClick={onUndoStroke}
                className='p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200'
                title='Undo last stroke'
              >
                <Undo className='w-4 h-4' />
              </button>
              <button
                onClick={onClearCanvas}
                className='p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200'
                title='Clear canvas'
              >
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className='relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`block max-w-full h-auto ${
            canDraw ? 'cursor-crosshair' : 'cursor-not-allowed'
          }`}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'none', // Prevent scrolling on touch devices
          }}
        />

        {!canDraw && (
          <div className='absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center'>
            <span className='text-gray-600 font-medium'>Drawing disabled</span>
          </div>
        )}
      </div>

      {/* Canvas Info */}
      <div className='text-xs text-gray-500 text-center'>
        Canvas: {width} × {height} | Strokes: {strokes.length}
        {tool === 'brush' &&
          ` | Color: ${selectedColor} | Size: ${brushSize}px`}
        {tool === 'eraser' && ` | Eraser Size: ${brushSize * 2}px`}
      </div>
    </div>
  );
};

export default DrawingCanvas;
