/**
 * 「決まった名前で1度だけ作る」もの（試験用の店舗など）を、同じ機械で並べて流している回どうしが同時に作らないための鍵。
 * 両方が「まだ無い」と見て同時に登録すると、同じ名前のものが2つでき、以後ずっと「どれを使うか決められない」で止まる。
 *
 * 鍵は .runs/locks/<名前> のディレクトリ（作れた回が持つ）。持ち主が落ちて残った鍵は、10分たてば古いものとして外す。
 * 鍵を取ったら、作る前に必ずもう一度「あるか」を確かめる（待つ間にほかの回が作っていることがある）。
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve(__dirname, "..", ".runs", "locks");
const STALE_MS = 10 * 60_000;

/** name の鍵を取って fn を実行し、終われば外す。最大 waitMs 待っても取れなければ投げる */
export async function withCreateOnceLock<T>(name: string, fn: () => Promise<T>, waitMs = 5 * 60_000): Promise<T> {
  const lock = path.join(DIR, name.replace(/[^0-9A-Za-z_\-぀-ヿ一-鿿]/g, "_"));
  fs.mkdirSync(DIR, { recursive: true });
  const until = Date.now() + waitMs;
  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch {
      const age = Date.now() - (fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > STALE_MS) { fs.rmSync(lock, { recursive: true, force: true }); continue; }
      if (Date.now() > until) throw new Error(`「${name}」を作る鍵（${lock}）が ${Math.round(waitMs / 1000)} 秒たっても空かない（ほかの回が作っている途中か、残った鍵）`);
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
  try {
    return await fn();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}
