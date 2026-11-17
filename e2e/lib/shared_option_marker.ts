/**
 * ≪共有の設定≫ 追加システム設定（全員が使う1件だけの値）を書き換えた印（.runs/shared_option_marker.json）。
 * - 高額商品閾値の印（lib/shared_threshold_marker.ts）と同じ形。A06-12 が固定価格商品部門IDを書き換える前に置く。
 * - 中身は、書き換えた起動（Playwright の本体のプロセス）の PID・開始時刻・設定の名前と戻す先の決まった値。
 * - 起動の終わり（lib/teardown_shared_thresholds.ts）が、印を見て決まった値へ画面で戻し、DB で確かめてから印を消す。
 *   テストが時間切れで打ち切られてブラウザが閉じ、ケースの finally の戻しが動かなくても戻すため（2026-11-17、hareruya-design-docs-39 の指摘）。
 */
import fs from "node:fs";
import path from "node:path";
import { プロセスが生きている } from "./shared_threshold_marker";

export const 設定の印のファイル = path.join(__dirname, "..", ".runs", "shared_option_marker.json");

/** 印を付けて書き換えてよい設定と、その決まった値（流す前にこの値であることを確かめ、違えば止める） */
export const 決まった設定値 = { 固定価格商品部門ID: "29" } as const;
export type 設定の名前 = keyof typeof 決まった設定値;

export type 設定の印 = { 起動のPID: number; 開始: string; 設定: 設定の名前[] };

export function 設定の印を読む(): 設定の印 | null {
  try { return JSON.parse(fs.readFileSync(設定の印のファイル, "utf-8")) as 設定の印; } catch { return null; }
}

/**
 * ワーカーから、書き換える前に呼ぶ。印の起動は、いつも自分の起動にする（閾値の印と同じ。最後に書き換えた起動の終わりで戻す）。
 * ほかの生きている起動の印があれば、その設定も引き継ぐ（その起動の終わりは、印の起動が生きている自分なので見送る）。
 */
export function 設定の印を置く(名前: 設定の名前): void {
  const 起動のPID = process.ppid;
  const 今 = 設定の印を読む();
  const 引き継ぐ = 今 && (今.起動のPID === 起動のPID || プロセスが生きている(今.起動のPID));
  const 設定 = new Set<設定の名前>(引き継ぐ ? 今!.設定 : []);
  設定.add(名前);
  const 中身: 設定の印 = { 起動のPID, 開始: 引き継ぐ && 今!.起動のPID === 起動のPID ? 今!.開始 : new Date().toISOString(), 設定: [...設定] };
  fs.mkdirSync(path.dirname(設定の印のファイル), { recursive: true });
  fs.writeFileSync(設定の印のファイル, JSON.stringify(中身));
}

export function 設定の印を消す(): void { try { fs.unlinkSync(設定の印のファイル); } catch { /* 無ければよい */ } }
