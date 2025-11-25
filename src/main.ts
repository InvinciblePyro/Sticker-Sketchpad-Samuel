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

// Marker line command with thickness
class MarkerLine implements Drawable {
  private points: { x: number; y: number }[] = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number = 1) {
    this.points.push({ x: startX, y: startY });
    this.thickness = thickness;
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

    ctx.lineWidth = this.thickness;
    ctx.stroke();
  }
}

const commands: Drawable[] = [];
const redoStack: Drawable[] = [];

let currentCommand: MarkerLine | null = null;
const cursor = { active: false, x: 0, y: 0 };

// Current selected marker thickness
let currentThickness = 2; // default thin

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand = new MarkerLine(cursor.x, cursor.y, currentThickness);
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

// Marker selection buttons
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
document.body.append(thickButton);

// Helper to update selected tool styling
function selectTool(button: HTMLButtonElement) {
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Button click events
thinButton.addEventListener("click", () => {
  currentThickness = 2;
  selectTool(thinButton);
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  selectTool(thickButton);
});

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
