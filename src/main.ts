import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketch";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d");

// Interface for drawable commands
interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

// Marker line command
class MarkerLine implements Drawable {
  private points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length === 0) return;

    ctx.beginPath();
    const first = this.points[0]!;
    ctx.moveTo(first.x, first.y);

    for (const p of this.points) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

const commands: Drawable[] = [];
const redoStack: Drawable[] = [];

let currentCommand: MarkerLine | null = null;
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand = new MarkerLine(cursor.x, cursor.y);
  commands.push(currentCommand);
  redoStack.length = 0; // clear redo history

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentCommand) return;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand.drag(cursor.x, cursor.y);
  redraw();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentCommand = null;
  redraw();
});

function redraw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const c of commands) {
    c.display(ctx);
  }
}

document.body.append(document.createElement("br"));

// Clear
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);
clearButton.addEventListener("click", () => {
  commands.length = 0;
  redraw();
});

// Undo
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);
undoButton.addEventListener("click", () => {
  const cmd = commands.pop();
  if (cmd) redoStack.push(cmd);
  redraw();
});

// Redo
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);
redoButton.addEventListener("click", () => {
  const cmd = redoStack.pop();
  if (cmd) commands.push(cmd);
  redraw();
});
