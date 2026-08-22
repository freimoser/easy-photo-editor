import type { Layer } from "./types";

export class HistoryStack {
  private past: string[] = [];
  private future: string[] = [];
  private readonly limit = 80;

  push(layers: Layer[]): void {
    this.past.push(JSON.stringify(layers));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: Layer[]): Layer[] | null {
    const snapshot = this.past.pop();
    if (!snapshot) return null;
    this.future.push(JSON.stringify(current));
    return JSON.parse(snapshot) as Layer[];
  }

  redo(current: Layer[]): Layer[] | null {
    const snapshot = this.future.pop();
    if (!snapshot) return null;
    this.past.push(JSON.stringify(current));
    return JSON.parse(snapshot) as Layer[];
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  dump(): { past: string[]; future: string[] } {
    return { past: [...this.past], future: [...this.future] };
  }

  load(data: { past: string[]; future: string[] } | null | undefined): void {
    this.past = data?.past ? [...data.past] : [];
    this.future = data?.future ? [...data.future] : [];
  }
}
