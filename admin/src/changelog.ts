import { useSyncExternalStore } from 'react';

/**
 * The admin app has no backend (see README): it reads places.json/countries.json bundled at
 * build time and never writes them. Every edit instead appends a line here describing the
 * change — the person using the app copies this log and pastes it to Claude, who reads it and
 * applies the actual edits to the data files. A tiny external store (not React state) so it
 * survives switching between the Places/Countries tabs.
 */
let lines: string[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export const logChange = (line: string): void => {
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lines = [...lines, `${time} — ${line}`];
  notify();
};

export const clearChangelog = (): void => {
  lines = [];
  notify();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): string[] => lines;

export const useChangelog = (): string[] => useSyncExternalStore(subscribe, getSnapshot);
