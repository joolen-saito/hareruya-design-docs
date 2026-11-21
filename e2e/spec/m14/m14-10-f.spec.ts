/**
 * M14-10 フォーマット詳細(登録・編集・削除)の続き（設定が公開側へ反映される連携確認）。正本: cases/M14-10_test_cases.tsv のうち IT-M14-10-030
 * 補い: 名前は実行の印つきの値で読んだ。ARENA対応のカードセットは、この実行で登録した印つきのカードセットを DB で対応にした（seeds/m14-10-f.ts）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { デッキ名のデッキID } from "../../db/m14_10_format";
import { 編集画面を開く, 入力する, 登録を押す } from "../../pages/admin/m14_10_format";
import { 前面 } from "../../pages/front/m14_10_deck_front";
import { M1410_ADMIN } from "../../seeds/m14-10";
import "../../seeds/m14-10-f";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M14-10-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-030〕"), デッキ名 = rc("連携確認デッキ-030"), 英名 = rc("Bilingual Card-030");
  let 保存 = { sent: false, saved: false };
  let 応答 = 0; let ダウンロード = false; let 一覧 = ""; let クリップボード = "";
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => {
    await 入力する(page, { チェック: { ArenaLegalFlg: true } });
    const r = await 登録を押す(page);
    保存 = { sent: r.sent, saved: r.sent && (await page.locator(".alert-success").count()) > 0 };
    expect.soft(保存.saved, "フォーマットの変更が保存された（成功メッセージが表示された）").toBe(true);
  });
  await step(3, async () => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin }).catch(() => undefined);
    const デッキID = デッキ名のデッキID(デッキ名);
    if (!デッキID) throw new Error("シードのデッキが見つからない");
    const res = await page.goto(前面(`/deck/${デッキID}/show/`), { timeout: 60_000 });
    await page.waitForLoadState("load");
    応答 = res?.status() ?? 0;
  });
  await step(4, async () => {
    const respP = page.waitForResponse((r) => /\/deck\/arena\/\d+/.test(r.url()), { timeout: 20_000 }).catch(() => null);
    page.once("download", () => { ダウンロード = true; });
    await page.locator("a.deckSearch-deckList__export__button--arena", { hasText: "アリーナ用インポートテキスト" }).first().click({ timeout: 30_000 });
    const r = await respP;
    if (r) { try { 一覧 = String(((await r.json()) as { list?: string }).list ?? ""); } catch { 一覧 = ""; } }
  });
  await step(5, async () => {
    クリップボード = await page.evaluate(() => navigator.clipboard.readText().catch(() => "")).catch(() => "");
    if (!ダウンロード) note("アリーナ用インポートテキストのボタンはファイルをダウンロードせず、取得した一覧をクリップボードへコピーする作りだった。コピーされた文（無ければ取得した一覧）を確かめた");
  });
  await expected(async () => {
    expect.soft(応答, "デッキ詳細画面の応答").toBe(200);
    const 文 = クリップボード || 一覧;
    expect.soft(文.includes(英名), `英語のカード名「${英名}」を含むテキストが得られた（得られた文: ${文.slice(0, 80) || "なし"}）`).toBe(true);
  });
});
