import { useRef, useState } from 'react';
import { useTour } from '../tour.js';
import { Avatar, WordmarkChip } from '../components/brand.jsx';
import { ContinueButton, SoundControls } from '../components/controls.jsx';
import { CANVAS } from '../canvas.js';

const MIN_LOOP_SIZE = 90;
const MAX_GAP = 90;

function isClosedLoop(points) {
  if (points.length < 12) return false;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const [startX, startY] = points[0];
  const [endX, endY] = points.at(-1);
  const gap = Math.hypot(endX - startX, endY - startY);
  return width > MIN_LOOP_SIZE && height > MIN_LOOP_SIZE && gap < MAX_GAP;
}

const toPath = (points) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

export default function DrawToEnter() {
  const { next } = useTour();
  const surface = useRef(null);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);

  const toCanvas = (event) => {
    const box = surface.current.getBoundingClientRect();
    return [
      ((event.clientX - box.left) * CANVAS.width) / box.width,
      ((event.clientY - box.top) * CANVAS.height) / box.height,
    ];
  };

  const start = (event) => {
    if (done) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing(true);
    setPoints([toCanvas(event)]);
  };

  const move = (event) => {
    if (drawing) setPoints((current) => [...current, toCanvas(event)]);
  };

  const end = () => {
    if (!drawing) return;
    setDrawing(false);
    if (isClosedLoop(points)) {
      setDone(true);
      setTimeout(next, 600);
    } else {
      setPoints([]);
    }
  };

  return (
    <div className="absolute inset-0 cursor-crosshair touch-none bg-page">
      <WordmarkChip />
      <div className="absolute left-1/2 top-[238px] -translate-x-1/2">
        <Avatar size={64} />
      </div>
      <p className="pointer-events-none absolute inset-x-0 top-[398px] m-0 text-center text-[18px] font-medium leading-[1.4] text-tx-2">
        Draw a circle to enter
      </p>
      <svg
        ref={surface}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        className="absolute inset-0 h-full w-full"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        role="img"
        aria-label="Drawing surface"
      >
        <path
          d={toPath(points)}
          fill="none"
          stroke={done ? '#49BA61' : '#F4F4F3'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-[stroke] duration-300"
        />
      </svg>
      <ContinueButton label="Skip" onClick={next} />
      <SoundControls />
    </div>
  );
}
