/**
 * A06-13 本人確認証明書更新（MTGBuyer の API）の続き（006・007・012・013）。正本: cases/A06-13_test_cases.tsv
 * 要求の送り方・入口の読み替え・トークンの受け取り方は a06-13.spec.ts と同じ。001（MTGBuyer の画面）、010・011（環境の鍵で署名した管理者のいないトークン）は書いていない。
 */
import { Page, test } from "@playwright/test";
import { 店頭買取の受注 } from "../../db/a06";
import { caseTest, expect } from "../../lib/case";
import { トークンを受け取る, 証明書更新を送る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0613_ADM } from "../../seeds/a06-13";
import "../../seeds/a06-13";
import "../../seeds/a06-13-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const json = (r: 応答) => (r.json ?? {}) as Record<string, unknown>;

async function 有効なトークン(page: Page): Promise<string> {
  supplement("管理者の名前・ログインIDは、実行をまたいで使い回す決まった印（-E2E。ログインIDは小文字）を付けた値で作った。有効なトークンは、手順1の前に管理者のログイン API へログインID・パスワードを送って受け取った（値は記録しない）");
  return トークンを受け取る(page, A0613_ADM.loginId, A0613_ADM.password);
}

caseTest("IT-A06-13-006", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店頭買取ID-A0613-006〕");
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新（無い証明書ID）", id, "699999006", token); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答の項目 ${Object.keys(json(r)).join("、") || "なし"}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（刷新側の定義の400）").toBe(400);
    expect.soft("code" in json(r), "応答に処理結果コードがある").toBe(true);
    expect.soft(Array.isArray(json(r).errors), "応答にエラーの一覧（配列）がある").toBe(true);
  });
});

caseTest("IT-A06-13-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店頭買取ID-A0613-007〕");
  const token = await 有効なトークン(page);
  const 前 = 店頭買取の受注(id);
  supplement("「シード投入時の値」は、要求を送る直前に DB から読んだ値（シード投入の直後で、その間に誰も触らない E2E の行）として比べた");
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新（無い証明書ID）", id, "699999007", token); });
  let 後: ReturnType<typeof 店頭買取の受注> = null;
  await step(2, async () => {
    後 = 店頭買取の受注(id);
    note(`HTTP ${r.ステータス}／DB 前: 証明書ID ${前?.本人確認証明書ID}・更新担当者 ${前?.更新担当者ID}・更新日時 ${前?.更新日時}／後: ${後?.本人確認証明書ID}・${後?.更新担当者ID}・${後?.更新日時}`);
  });
  await expected(async () => {
    expect.soft(前 !== null && 後 !== null, "受注の行が読める").toBe(true);
    expect.soft(後?.本人確認証明書ID, "本人確認証明書IDが更新されない").toBe(前?.本人確認証明書ID);
    expect.soft(後?.更新担当者ID, "更新担当者IDが更新されない").toBe(前?.更新担当者ID);
    expect.soft(後?.更新日時, "更新日時が更新されない").toBe(前?.更新日時);
  });
});

caseTest("IT-A06-13-012", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新（トークン無し・無い受注・無い証明書）", "699999012", "699999012", undefined); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（認証が先に判定される）").toBe(401);
  });
});

caseTest("IT-A06-13-013", async ({ page, step, expected }) => {
  const token = await 有効なトークン(page);
  let r!: 応答;
  await step(1, async () => { r = await 証明書更新を送る(page, "本人確認証明書の更新（無い受注・無い証明書）", "699999013", "699999013", token); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（受注の存在が先に判定される）").toBe(404);
  });
});
