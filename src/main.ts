import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketch";
document.body.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d");

const lines: { x: number; y: number }[][] = [];
const redoLines: { x: number; y: number }[][] = [];

let currentLine: { x: number; y: number }[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(0, redoLines.length);
  currentLine.push({ x: cursor.x, y: cursor.y });

  redraw();
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    if (currentLine) currentLine.push({ x: cursor.x, y: cursor.y });

    redraw();
  }
});

canvas.addEventListener("mouseup", (_e) => {
  cursor.active = false;
  currentLine = null;

  redraw();
});

function redraw() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length === 0) continue;
      ctx.beginPath();
      const start = line[0]!;
      ctx.moveTo(start.x, start.y);
      for (const point of line) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
}

document.body.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(0, lines.length);
  redraw();
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  const line = lines.pop();
  if (line) {
    redoLines.push(line);
    redraw();
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  const line = redoLines.pop();
  if (line) {
    lines.push(line);
    redraw();
  }
});
