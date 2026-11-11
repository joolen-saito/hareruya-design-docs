/**
 * M14-07 画像ダウンロードの ZIP を受け取って展開し、中のファイルを調べる部品。
 * ZIP の展開は、手元の OS の unzip で行う（試験用の一時フォルダの中だけ）。
 */
import { Download } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type 展開結果 = {
  /** 展開先の下のファイル（「download/…」の形の相対パス。フォルダは含まない） */
  ファイル: string[];
  /** 展開先 */
  dir: string;
};

function 再帰(dir: string, rel: string): string[] {
  return readdirSync(join(dir, rel)).flatMap((n) => {
    const r = rel ? `${rel}/${n}` : n;
    return statSync(join(dir, r)).isDirectory() ? 再帰(dir, r) : [r];
  });
}

/** ダウンロードした card_image.zip を保存して展開する */
export async function ZIPを展開する(d: Download): Promise<展開結果> {
  const dir = mkdtempSync(join(tmpdir(), "m1407-zip-"));
  const zip = join(dir, "card_image.zip");
  await d.saveAs(zip);
  const out = join(dir, "x");
  execFileSync("unzip", ["-o", "-q", zip, "-d", out]);
  return { ファイル: 再帰(out, "").sort(), dir: out };
}

/** 展開結果のうち、download/ の直下のフォルダに入っているファイル名の一覧 */
export function フォルダのファイル(r: 展開結果, フォルダ: string): string[] {
  const p = `download/${フォルダ}/`;
  return r.ファイル.filter((f) => f.startsWith(p)).map((f) => f.slice(p.length));
}
