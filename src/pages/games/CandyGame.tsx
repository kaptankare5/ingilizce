import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LETTERS } from "@/data/letters";
import { playLetter } from "@/lib/audio";
import { cn } from "@/lib/utils";

const ROWS = 8;
const COLS = 6;
const POOL = LETTERS.slice(0, 6);

type Cell = { id: number; letter: string; pop: boolean };

let _id = 0;
function newCell(): Cell {
  return { id: _id++, letter: POOL[Math.floor(Math.random() * POOL.length)].letter, pop: false };
}

function buildBoard(): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) row.push(newCell());
    grid.push(row);
  }
  // Başlangıçta eşleşme olmasın
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      while (
        (c >= 2 && grid[r][c].letter === grid[r][c - 1].letter && grid[r][c].letter === grid[r][c - 2].letter) ||
        (r >= 2 && grid[r][c].letter === grid[r - 1][c].letter && grid[r][c].letter === grid[r - 2][c].letter)
      ) {
        grid[r][c] = newCell();
      }
    }
  }
  return grid;
}

function findMatches(grid: Cell[][]): Set<string> {
  const m = new Set<string>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      if (grid[r][c].letter === grid[r][c + 1].letter && grid[r][c].letter === grid[r][c + 2].letter) {
        m.add(`${r},${c}`); m.add(`${r},${c + 1}`); m.add(`${r},${c + 2}`);
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      if (grid[r][c].letter === grid[r + 1][c].letter && grid[r][c].letter === grid[r + 2][c].letter) {
        m.add(`${r},${c}`); m.add(`${r + 1},${c}`); m.add(`${r + 2},${c}`);
      }
    }
  }
  return m;
}

const CandyGame = () => {
  const [grid, setGrid] = useState<Cell[][]>(() => buildBoard());
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  function reset() {
    setGrid(buildBoard());
    setScore(0);
    setSelected(null);
  }

  function processMatches(g: Cell[][], depth = 0) {
    const matches = findMatches(g);
    if (matches.size === 0 || depth > 10) {
      setGrid(g.map((row) => [...row]));
      return;
    }
    setScore((s) => s + matches.size * 10);
    // Eşleşen harflerin seslerini çal (tekilleştir)
    const matchedLetters = new Set<string>();
    matches.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      matchedLetters.add(g[r][c].letter);
    });
    Array.from(matchedLetters).forEach((arabicChar, i) => {
      const lt = LETTERS.find((l) => l.letter === arabicChar);
      if (lt) setTimeout(() => playLetter(lt, null), i * 350);
    });
    const next = g.map((row) => [...row]);
    matches.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      next[r][c] = { ...next[r][c], pop: true };
    });
    setGrid(next);
    setTimeout(() => {
      const after = next.map((row) => [...row]);
      // sütunda boşa düşme
      for (let c = 0; c < COLS; c++) {
        const stack: Cell[] = [];
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!matches.has(`${r},${c}`)) stack.push(after[r][c]);
        }
        while (stack.length < ROWS) stack.push(newCell());
        for (let r = ROWS - 1, i = 0; r >= 0; r--, i++) after[r][c] = stack[i];
      }
      processMatches(after, depth + 1);
    }, 280);
  }

  function tap(r: number, c: number) {
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    const isAdj = Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!isAdj) {
      setSelected({ r, c });
      return;
    }
    const next = grid.map((row) => [...row]);
    [next[r][c], next[selected.r][selected.c]] = [next[selected.r][selected.c], next[r][c]];
    const matches = findMatches(next);
    setSelected(null);
    if (matches.size === 0) {
      // geçersiz hamle, geri al
      setGrid(next);
      setTimeout(() => {
        const undo = next.map((row) => [...row]);
        [undo[r][c], undo[selected.r][selected.c]] = [undo[selected.r][selected.c], undo[r][c]];
        setGrid(undo);
      }, 200);
      return;
    }
    processMatches(next);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-md px-4 pb-16">
        <PageHeader title="🍬 Harf Patlatma" backTo="/games" centered onReset={reset} />

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card border border-border/60">
          <div className="text-sm text-muted-foreground">İki harfi yer değiştir, 3 aynı yap!</div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Puan</div>
            <div className="text-2xl font-extrabold text-warning">{score}</div>
          </div>
        </div>

        <div
          className="grid gap-1 rounded-2xl bg-secondary p-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSel = selected?.r === r && selected?.c === c;
              return (
                <button
                  key={cell.id}
                  onClick={() => tap(r, c)}
                  className={cn(
                    "aspect-square rounded-lg bg-card text-2xl transition-all",
                    isSel && "ring-2 ring-primary scale-95",
                    cell.pop && "scale-50 opacity-0"
                  )}
                >
                  <span className="arabic font-arabic font-bold text-foreground">{cell.letter}</span>
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default CandyGame;
