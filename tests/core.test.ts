// Tests de la lógica pura de progreso (src/lib/game/core.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyState, isComplete, isStarted, lessonXp, nextLesson, parseState, rankFor, totalXp, type CatalogLesson, type ProgressState } from "../src/lib/game/core.ts";

const L = (id: string, prerequisites: string[] = []): CatalogLesson => ({
  id, unit: "vm", title: id, href: `/${id}/`, duration: 30, piece: "p", prerequisites, xp: { concept: 10, build: 20, piece: 40 },
});
const cat = [L("m3-01"), L("m3-02", ["m3-01"]), L("m3-03", ["m3-01"])];
const state = (parts: Record<string, string[]>): ProgressState => ({
  version: 1,
  lessons: Object.fromEntries(Object.entries(parts).map(([id, ps]) => [id, { parts: Object.fromEntries(ps.map((p) => [p, "2026-01-01"])) }])),
});

test("la XP se calcula a partir de lo hecho y nunca baja", () => {
  assert.equal(lessonXp(cat[0], emptyState()), 0);
  assert.equal(lessonXp(cat[0], state({ "m3-01": ["concept"] })), 10);
  assert.equal(lessonXp(cat[0], state({ "m3-01": ["concept", "build", "piece"] })), 70);
  assert.equal(totalXp(cat, state({ "m3-01": ["piece"], "m3-02": ["concept"] })), 50);
});

test("completa = las tres partes; empezada = alguna", () => {
  const s = state({ "m3-01": ["concept", "build", "piece"], "m3-02": ["build"] });
  assert.ok(isComplete(cat[0], s));
  assert.ok(!isComplete(cat[1], s));
  assert.ok(isStarted(cat[1], s));
  assert.ok(!isStarted(cat[2], s));
});

test("rangos: el actual y el siguiente", () => {
  const ranks = [{ name: "A", min: 0 }, { name: "B", min: 100 }, { name: "C", min: 300 }];
  assert.equal(rankFor(0, ranks).current.name, "A");
  assert.equal(rankFor(100, ranks).current.name, "B");
  assert.equal(rankFor(999, ranks).current.name, "C");
  assert.equal(rankFor(999, ranks).next, undefined);
  assert.equal(rankFor(5, ranks).next?.name, "B");
});

test("siguiente lección: la empezada primero, luego la primera con requisitos hechos", () => {
  assert.equal(nextLesson(cat, emptyState())?.id, "m3-01");
  assert.equal(nextLesson(cat, state({ "m3-01": ["concept"] }))?.id, "m3-01");
  assert.equal(nextLesson(cat, state({ "m3-01": ["concept", "build", "piece"] }))?.id, "m3-02");
  assert.equal(nextLesson(cat, state({ "m3-01": ["concept", "build", "piece"], "m3-03": ["build"] }))?.id, "m3-03");
  const all = state(Object.fromEntries(cat.map((l) => [l.id, ["concept", "build", "piece"]])));
  assert.equal(nextLesson(cat, all), undefined);
});

test("parseState: lo corrupto o de otra versión empieza de cero", () => {
  assert.deepEqual(parseState(null), emptyState());
  assert.deepEqual(parseState("{no es json"), emptyState());
  assert.deepEqual(parseState(JSON.stringify({ version: 2, lessons: {} })), emptyState());
  assert.deepEqual(parseState(JSON.stringify({ version: 1, lessons: null })), emptyState());
  const ok = { version: 1, lessons: { "m3-01": { parts: { concept: "x" } } } };
  assert.deepEqual(parseState(JSON.stringify(ok)), ok);
});
