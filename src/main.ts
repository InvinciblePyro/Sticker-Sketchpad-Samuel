import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketch";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d");

// Drawable Interface
interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
}

// ---------------- Marker Line ----------------

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

  display(ctx: CanvasRenderingContext2D) {
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

// Tool preview circle (for marker)
class ToolPreview implements Drawable {
  constructor(public x: number, public y: number, public thickness: number) {}

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
  }
}

// ---------------- Sticker Commands ----------------

class StickerPreview implements Drawable {
  constructor(public x: number, public y: number, public emoji: string) {}
  display(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.4;
    ctx.font = "32px serif";
    ctx.fillText(this.emoji, this.x - 16, this.y + 16);
    ctx.globalAlpha = 1.0;
  }
}

class StickerCommand implements Drawable {
  constructor(public x: number, public y: number, public emoji: string) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px serif";
    ctx.fillText(this.emoji, this.x - 16, this.y + 16);
  }
}

// ---------------- State ----------------

enum ToolType {
  Marker,
  Sticker,
}

let activeTool: ToolType = ToolType.Marker;
let activeEmoji: string = "⭐";

const commands: Drawable[] = [];
const redoStack: Drawable[] = [];

let currentCommand: MarkerLine | StickerCommand | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;

const cursor = { active: false, x: 0, y: 0 };
let currentThickness = 2;

// ---------------- Canvas Input Events ----------------

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  redoStack.length = 0; // clear redo list

  if (activeTool === ToolType.Marker) {
    currentCommand = new MarkerLine(cursor.x, cursor.y, currentThickness);
  } else {
    currentCommand = new StickerCommand(cursor.x, cursor.y, activeEmoji);
  }

  commands.push(currentCommand);
  toolPreview = null;
  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && currentCommand) {
    if (activeTool === ToolType.Marker) {
      (currentCommand as MarkerLine).drag(cursor.x, cursor.y);
    } else {
      (currentCommand as StickerCommand).drag(cursor.x, cursor.y);
    }
  } else {
    if (activeTool === ToolType.Marker) {
      toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
    } else {
      toolPreview = new StickerPreview(cursor.x, cursor.y, activeEmoji);
    }
  }
  redraw();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentCommand = null;
  redraw();
});

// ---------------- Redraw ----------------

function redraw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const c of commands) {
    c.display(ctx);
  }
  if (!cursor.active && toolPreview) {
    toolPreview.display(ctx);
  }
}

// ---------------- UI ----------------

document.body.append(document.createElement("br"));

// Marker tool buttons
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
document.body.append(thickButton);

function selectTool(button: HTMLButtonElement) {
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  starButton.classList.remove("selectedTool");
  heartButton.classList.remove("selectedTool");
  fireButton.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Marker buttons
thinButton.addEventListener("click", () => {
  currentThickness = 2;
  activeTool = ToolType.Marker;
  selectTool(thinButton);
});
thickButton.addEventListener("click", () => {
  currentThickness = 6;
  activeTool = ToolType.Marker;
  selectTool(thickButton);
});

// Sticker buttons
const starButton = document.createElement("button");
starButton.textContent = "⭐";
document.body.append(starButton);

const heartButton = document.createElement("button");
heartButton.textContent = "❤️";
document.body.append(heartButton);

const fireButton = document.createElement("button");
fireButton.textContent = "🔥";
document.body.append(fireButton);

// Sticker selection behavior
function chooseSticker(btn: HTMLButtonElement, emoji: string) {
  activeEmoji = emoji;
  activeTool = ToolType.Sticker;
  selectTool(btn);
  // fire tool-moved preview update
  toolPreview = new StickerPreview(cursor.x, cursor.y, activeEmoji);
  redraw();
}

starButton.addEventListener("click", () => chooseSticker(starButton, "⭐"));
heartButton.addEventListener("click", () => chooseSticker(heartButton, "❤️"));
fireButton.addEventListener("click", () => chooseSticker(fireButton, "🔥"));

// Clear
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);
clearButton.addEventListener("click", () => {
  commands.length = 0;
  redraw();
});

// Undo
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);
undoButton.addEventListener("click", () => {
  const cmd = commands.pop();
  if (cmd) redoStack.push(cmd);
  redraw();
});

// Redo
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);
redoButton.addEventListener("click", () => {
  const cmd = redoStack.pop();
  if (cmd) commands.push(cmd);
  redraw();
});
