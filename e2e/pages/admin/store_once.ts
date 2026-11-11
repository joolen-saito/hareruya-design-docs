/**
 * 試験用の店舗は「決まった名前で1度だけ作り、以後は使い回す」（依頼者決定 2026-11-11）。
 *
 * 開発環境では、店舗を1つ作ると店舗別の在庫の行が約36万行でき、店舗は消せない。実行ごと・ケースごとに店舗を作ると
 * 店舗と在庫の行が増え続ける（2026-11-11 に支店が182件増えていた）。そこで、店舗を登録する部品はどれも、登録の直前にここを通す。
 * - 店名に実行の印（lib/run_marker.ts の RUN_MARK）が入っていれば止める（実行ごとに作ることになる）。
 * - 同じ店名・会社名の店舗が、開店・閉店を問わず、すでにあれば止める（作らずに、その店舗を使い回す）。
 * - 作った店舗は .runs/store_creates.log に残す（日時・環境・店名・会社名・呼び出し元）。
 * ケースが店舗の登録そのものを確かめる機能（M10-15 店舗登録）の画面の部品は、ここを通さない（その扱いは別に決める）。
 */
import { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { adminUrl } from "../../lib/session";
import { RUN_MARK } from "../../lib/run_marker";
import { ENV_NAME } from "../../config/env";

const LOG = path.resolve(__dirname, "..", "..", ".runs", "store_creates.log");

/** 店舗一覧の全行（開店・閉店を問わない） */
async function allStores(page: Page): Promise<{ id: string; 店名: string; 会社名: string; 開店: string }[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"), { timeout: 120_000 });
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 会社名: td(3), 開店: td(5) };
  }));
}

/**
 * 店舗を登録してよいかを確かめ、よければ記録して戻る。だめなら投げる（登録しない）。
 * @param 会社名 部品が入れる会社名（店名と会社名の組で同じ店舗とみなす）
 * @param 呼び出し元 部品の名前（記録に残す）
 */
export async function guardStoreCreate(page: Page, 店名: string, 会社名: string, 呼び出し元: string): Promise<void> {
  if (店名.includes(RUN_MARK)) {
    throw new Error(`店舗「${店名}」は登録しない: 店名に実行の印（${RUN_MARK}）が入っていて、流すたびに店舗が増える。試験用の店舗は決まった名前で1度だけ作り使い回す（依頼者決定 2026-11-11）`);
  }
  const same = (await allStores(page)).filter((s) => s.店名 === 店名 && s.会社名 === 会社名);
  if (same.length > 0) {
    throw new Error(`店舗「${店名}」（会社名「${会社名}」）は登録しない: すでにある（店舗ID ${same.map((s) => `${s.id}・${s.開店}`).join("、")}）。作らずに使い回す（依頼者決定 2026-11-11）`);
  }
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, [new Date().toISOString(), ENV_NAME, 店名, 会社名, 呼び出し元].join("\t") + "\n");
}
