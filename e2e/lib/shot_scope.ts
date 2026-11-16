/**
 * 撮り方の指定（足した部品）。横に極端に広い画面（採用枚数ランキングのように、1行に並べた表が数万 px になる画面）を、
 * ページ全体ではなく見えている範囲で撮る（確かめた要素が見えている範囲に入るように画面を動かして撮る。lib/annotate.ts の fit）。
 * 指定したページだけに効く。ほかの画面の撮り方は変えない。
 */
import type { Page } from "@playwright/test";

const 見えている範囲だけ = new WeakSet<Page>();

/** このページを、ページ全体ではなく見えている範囲で撮るように指定する（ケースの終わりまで有効） */
export function 見えている範囲で撮る(page: Page): void { 見えている範囲だけ.add(page); }

/** 見えている範囲で撮る指定があるか */
export function 見えている範囲で撮るか(page: Page): boolean { return 見えている範囲だけ.has(page); }
