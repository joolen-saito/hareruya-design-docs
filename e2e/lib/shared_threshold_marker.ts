/**
 * ≪共有の設定≫ 店舗ID 1・13 の高額商品閾値を書き換えた印（.runs/shared_threshold_marker.json）。
 * - M04-33・M04-34 が閾値を書き換える前に置く。中身は、書き換えた起動（Playwright の本体のプロセス）の PID・開始時刻・戻す先の決まった値。
 * - 起動の終わり（lib/teardown_shared_thresholds.ts）が、印を見て決まった値へ戻し、DB で確かめてから印を消す。
 * - 2026-11-15: テストが時間切れで打ち切られるとブラウザが閉じ、ケースの finally の戻しが動かず、店舗ID 1 の閾値が残った。そのため、テストの外でも戻す。
 */
import fs from "node:fs";
import path from "node:path";

export const 印のファイル = path.join(__dirname, "..", ".runs", "shared_threshold_marker.json");
export const 戻しのログ = path.join(__dirname, "..", ".runs", "shared_restore.log");

export type 閾値の印 = {
  /** 書き換えた起動（Playwright の本体のプロセス）の PID。ワーカーから見ると親のプロセス */
  起動のPID: number;
  開始: string;
  店舗ID: string[];
  戻す先: [string, string, string];
};

export function 印を読む(): 閾値の印 | null {
  try { return JSON.parse(fs.readFileSync(印のファイル, "utf-8")) as 閾値の印; } catch { return null; }
}

/** ワーカーから呼ぶ。同じ起動の印があれば店舗IDを足す */
export function 印を置く(店舗ID: string, 戻す先: readonly [string, string, string]): void {
  const 起動のPID = process.ppid;
  const 今 = 印を読む();
  const 店舗 = new Set(今 && 今.起動のPID === 起動のPID ? 今.店舗ID : []);
  if (今 && 今.起動のPID !== 起動のPID && プロセスが生きている(今.起動のPID)) {
    // ほかの起動が書き換え中。上書きせずに店舗を足す（戻すのはその起動の終わり）
    for (const s of 今.店舗ID) 店舗.add(s);
  }
  店舗.add(店舗ID);
  const 中身: 閾値の印 = { 起動のPID, 開始: 今?.起動のPID === 起動のPID ? 今.開始 : new Date().toISOString(), 店舗ID: [...店舗], 戻す先: [戻す先[0], 戻す先[1], 戻す先[2]] };
  fs.mkdirSync(path.dirname(印のファイル), { recursive: true });
  fs.writeFileSync(印のファイル, JSON.stringify(中身));
}

export function 印を消す(): void { try { fs.unlinkSync(印のファイル); } catch { /* 無ければよい */ } }

export function プロセスが生きている(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === "EPERM"; }
}

export function 戻しを記録する(行: string): void {
  try { fs.mkdirSync(path.dirname(戻しのログ), { recursive: true }); fs.appendFileSync(戻しのログ, `${new Date().toISOString()}\tpid=${process.pid}\t${行}\n`); } catch { /* 記録できなくても止めない */ }
}
