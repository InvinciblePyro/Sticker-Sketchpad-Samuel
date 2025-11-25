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
let currentThickness = 3;

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
  document.querySelectorAll("button").forEach((btn) =>
    btn.classList.remove("selectedTool")
  );
  button.classList.add("selectedTool");
}

// Marker buttons
thinButton.addEventListener("click", () => {
  currentThickness = 3;
  activeTool = ToolType.Marker;
  selectTool(thinButton);
});
thickButton.addEventListener("click", () => {
  currentThickness = 8;
  activeTool = ToolType.Marker;
  selectTool(thickButton);
});

document.body.append(document.createElement("br"));

// -------- Data-Driven Stickers --------

const stickerButtons: HTMLButtonElement[] = [];

// initial stickers
const stickers: string[] = ["⭐", "❤️", "🔥", "💯", "💀", "🪨"];

// create buttons dynamically for all stickers
function refreshStickerButtons() {
  stickerButtons.forEach((b) => b.remove());
  stickerButtons.length = 0;

  for (const emoji of stickers) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    document.body.append(btn);

    btn.addEventListener("click", () => {
      activeEmoji = emoji;
      activeTool = ToolType.Sticker;
      selectTool(btn);
      toolPreview = new StickerPreview(cursor.x, cursor.y, activeEmoji);
      redraw();
    });

    stickerButtons.push(btn);
  }
}

refreshStickerButtons();

// -------- Custom Sticker Button --------

const addStickerBtn = document.createElement("button");
addStickerBtn.textContent = "➕ Custom Sticker";
document.body.append(addStickerBtn);

addStickerBtn.addEventListener("click", () => {
  const newEmoji = prompt("Enter your sticker:", "🌟");

  if (newEmoji && newEmoji.trim().length > 0) {
    stickers.push(newEmoji);
    refreshStickerButtons();
    activeEmoji = newEmoji;
    activeTool = ToolType.Sticker;
    redraw();
  }
});

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

// -------- Export High Resolution ( Step 10 ) --------

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
document.body.append(exportButton);

exportButton.addEventListener("click", () => {
  // Create a large temporary canvas
  const exportSize = 1024;
  const scale = exportSize / canvas.width; // If canvas is 256px → scale = 4

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const exportCtx = exportCanvas.getContext("2d")!;

  // Scale up drawing (so it doesn't just shrink into a corner)
  exportCtx.scale(scale, scale);

  // Redraw all commands on the new canvas (NO preview)
  for (const cmd of commands) {
    cmd.display(exportCtx);
  }

  // Turn into PNG and download
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});
