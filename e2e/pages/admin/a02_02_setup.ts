/**
 * A02-02（カードIDからポップアップ用の商品情報を取得）のシードが使う、管理画面の操作。セレクタはここ（と流用する部品）だけに書く。
 *
 * ケースが見る並び順は、カードセットの特殊フラグ・リリース日、カード詳細のプロモ・Foilで決まる。
 * カード詳細(登録)画面にはプロモのフラグを決める欄が無い（プロモ種別を選んでもフラグは立たない）ので、
 * シード表どおりカードCSV登録で1商品につきカード詳細を1行ずつ取り込む。カードセットは条件ごとに決まった印で1度だけ作って使い回す。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { STATE_DIR } from "../../config/env";
import { rcFixed } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { Issue } from "./a17_05_setup";
import { 試験用のカードセットを用意する } from "./a02_setup";
import {
  カードCSVの行, カードCSVの見出し, カードCSVを組む, カードセットを英語名で探す, カード一覧で探す, シードのCSVを取り込む, マスターを用意する,
} from "./m14_05_card_csv_upload";

/** 並び順を決めるカードセットの条件。N=通常・S=特殊、数字は発売日の年（2026-01-01・2025-01-01） */
export type セット = "N26" | "S26" | "N25" | "S25";

const 条件: Record<セット, { 特殊: boolean; 日付: string }> = {
  N26: { 特殊: false, 日付: "2026-01-01" }, S26: { 特殊: true, 日付: "2026-01-01" },
  N25: { 特殊: false, 日付: "2025-01-01" }, S25: { 特殊: true, 日付: "2025-01-01" },
};
const 略称: Record<Exclude<セット, "N26">, string> = { S26: "A22b", N25: "A22c", S25: "A22d" };

const 用意した = new Map<セット, string>();

/** 条件に合う試験用のカードセットを、決まった印で1度だけ作って使い回す。カードセット名（英語）を返す */
export async function セットを用意する(page: Page, 種類: セット, what: string, issue: Issue): Promise<string> {
  const 済み = 用意した.get(種類);
  if (済み) return 済み;
  let 名: string;
  if (種類 === "N26") 名 = await 試験用のカードセットを用意する(page, what, issue);
  else {
    名 = rcFixed(`A02-02 Cardset ${種類}`);
    if ((await カードセットを英語名で探す(page, 名)).length) issue(`試験用のカードセット「${名}」（${条件[種類].特殊 ? "特殊" : "通常"}カードセット・リリース日${条件[種類].日付}）を使い回した`);
    else {
      await page.goto(adminUrl("/cardset/new"));
      await page.waitForLoadState("load");
      await page.locator("#admin_cardset_nameJp").fill(名);
      await page.locator("#admin_cardset_nameEn").fill(名);
      await page.locator("#admin_cardset_code").fill(rcFixed(略称[種類]));
      const date = page.locator('input[name="admin_cardset[releaseDate]"]');
      if (await date.count()) await date.fill(条件[種類].日付);
      else {
        const [y, m, d] = 条件[種類].日付.split("-").map(Number);
        await page.locator('[name="admin_cardset[releaseDate][year]"]').selectOption(String(y));
        await page.locator('[name="admin_cardset[releaseDate][month]"]').selectOption(String(m));
        await page.locator('[name="admin_cardset[releaseDate][day]"]').selectOption(String(d));
      }
      const flag = page.locator("#admin_cardset_specialFlg");
      if (条件[種類].特殊) await flag.check(); else if (await flag.isChecked()) await flag.uncheck();
      await page.getByRole("button", { name: "登録", exact: true }).click();
      await expectSaved(page, `${what}: カードセット「${名}」の登録`);
      issue(`試験用のカードセット「${名}」（${条件[種類].特殊 ? "特殊" : "通常"}カードセット・リリース日${条件[種類].日付}）を、カードセット詳細(登録)画面で1度だけ登録した`);
    }
  }
  用意した.set(種類, 名);
  return 名;
}

let 必須のマスター済み = false;
/** カードCSVが引く名称（レアリティ・レイアウト・プロモ種別）が無ければ足す（あれば何もしない） */
async function 必須のマスターを用意する(page: Page, what: string, issue: Issue): Promise<void> {
  if (必須のマスター済み) return;
  if (await マスターを用意する(page, "レアリティ", "Uncommon", what)) issue("レアリティ「Uncommon」が無かったので登録した");
  if (await マスターを用意する(page, "カードレイアウト", "Normal", what)) issue("カードレイアウト「Normal」が無かったので登録した");
  if (await マスターを用意する(page, "プロモーション", "Promotion", what)) issue("プロモーション「Promotion」が無かったので登録した");
  必須のマスター済み = true;
}

export type カード詳細の定め = { セット: セット; プロモ: boolean; Foil: boolean };

/**
 * カードCSV登録で、カード詳細を1件ずつ（カードNo 1,2,…）持つカードを1枚取り込み、カードIDとカード詳細ID（カードNoの順）を返す。
 * レアリティ・レイアウトは登録済みの名称（Uncommon・Normal）、画像URL(英語)は任意の画像URL。プロモ種別は、プロモなし以外の登録済みの名称（Promotion）か空欄（プロモなし）。
 */
export async function カードを取り込む(page: Page, seedId: string, v: { カード名日: string; カード名英: string; 詳細: カード詳細の定め[] }, issue: Issue):
  Promise<{ カードID: string; カード詳細IDs: string[] }> {
  await 必須のマスターを用意する(page, seedId, issue);
  const 行: カードCSVの行[] = [];
  for (const [i, d] of v.詳細.entries()) {
    const セット名 = await セットを用意する(page, d.セット, seedId, issue);
    行.push({
      "カード名(日本語)": v.カード名日, "カード名(英語)": v.カード名英, レアリティ: "Uncommon", レイアウト: "Normal", 点数で見たマナコスト: "0",
      "画像URL(英語)": "a02-02-test.jpg", カードセット: セット名, カードNo: String(i + 1), プロモ種別: d.プロモ ? "Promotion" : "", Foil: d.Foil ? "1" : "0",
    });
  }
  const dir = path.join(STATE_DIR, "a02-02");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${seedId.toLowerCase()}-${Date.now()}.csv`);
  fs.writeFileSync(file, カードCSVを組む(await カードCSVの見出し(page), 行));
  for (const w of await シードのCSVを取り込む(page, file, `${seedId}: カードCSV登録`)) issue(w);
  const ids = await カード一覧で探す(page, v.カード名英);
  if (ids.length !== 1) throw new Error(`${seedId}: 取り込んだカード「${v.カード名英}」がカード一覧に ${ids.length} 件ある（1件のはず）`);
  const カードID = ids[0];
  await page.goto(adminUrl(`/card/${カードID}/edit`));
  await page.waitForLoadState("load");
  const dets = page.locator("#card-details-container .detail-card");
  await expect(dets, `${seedId}: 取り込んだカードの詳細情報の数`).toHaveCount(v.詳細.length);
  const byNo = new Map<string, string>();
  for (let i = 0; i < v.詳細.length; i++) {
    const id = /カード詳細ID:\s*(\d+)/.exec(((await dets.nth(i).locator(".detail-header strong").innerText()) ?? "").trim())?.[1];
    const no = await dets.nth(i).locator('input[name$="[cardNo]"]').inputValue();
    if (!id) throw new Error(`${seedId}: カード詳細IDを読めない`);
    byNo.set(no.trim(), id);
  }
  const カード詳細IDs = v.詳細.map((_, i) => {
    const id = byNo.get(String(i + 1));
    if (!id) throw new Error(`${seedId}: カードNo ${i + 1} のカード詳細が無い`);
    return id;
  });
  return { カードID, カード詳細IDs };
}
