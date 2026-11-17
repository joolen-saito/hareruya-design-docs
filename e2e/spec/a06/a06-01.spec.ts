/**
 * A06-01 ログイン（MTGBuyer の管理者のログイン API）。正本: cases/A06-01_test_cases.tsv
 * 実装したケースと解釈は記録 review/A06-01_progress_2026-11-17_dev.md。
 *
 * - 「ブラウザの開発者ツールから要求を送る」「Network で確かめる」は、ブラウザのページから API サーバーへ要求を送り、送った要求と応答をページに出して
 *   読む形にした（pages/admin/a06_mtgbuyer_api.ts）。各手順のあとの画面に、その表が写る。
 * - MTGBuyer の画面を操作するケース（001・010・014・015）は、試験端末のアプリの画面が要り Playwright で操作できないので書いていない。
 */
import { test } from "@playwright/test";
import { 管理者の, 店舗の } from "../../db/a06";
import { caseTest, expect } from "../../lib/case";
import { ペイロードを読む, ログインを送る, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { A0601_PASSWORD, A0601の管理者 } from "../../seeds/a06-01";
import "../../seeds/a06-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 印の補い = "管理者の名前・ログインIDは、実行をまたいで使い回す決まった印（-E2E。ログインIDは小文字）を付けた値で作り、ケースの値もその値として読んだ";
const 店舗の補い = (n: string, 店名: string) => `正本の店舗「A06-01店舗-${n}」（店舗住所「東京都千代田区晴海1-1」）は、試験店舗の使い回し（2026-11-13 依頼者決定）で試験支店「${店名}」に読み替え、店舗名・店舗住所は試験支店の値として確かめた`;

const json = (r: 応答) => (r.json ?? {}) as Record<string, unknown>;

caseTest("IT-A06-01-002", async ({ page, notes, step, expected }) => {
  const a = A0601の管理者("002");
  supplement(印の補い);
  let r!: 応答;
  const got: { 管理者?: ReturnType<typeof 管理者の>; 店舗?: ReturnType<typeof 店舗の> } = {};
  await step(1, async () => { r = await ログインを送る(page, "ログイン API への要求", a.loginId, A0601_PASSWORD); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}・応答本体の項目: ${Object.keys(json(r)).join("、") || "なし"}`); });
  await step(3, async () => {
    const 管理者 = got.管理者 = 管理者の(notes.get("〔管理者ID-A0601-002〕"));
    const 店舗 = got.店舗 = 店舗の(notes.get("〔店舗ID-A0601-002〕"));
    note(`DB: 管理者ID ${notes.get("〔管理者ID-A0601-002〕")} の名前「${管理者?.名前}」・所属店舗ID ${管理者?.所属店舗ID}／店舗ID ${notes.get("〔店舗ID-A0601-002〕")} の店名「${店舗?.店名}」・住所「${店舗?.住所1}」「${店舗?.住所2}」`);
  });
  supplement(店舗の補い("002", got.店舗?.店名 ?? ""));
  await expected(async () => {
    const j = json(r);
    const { 管理者, 店舗 } = got;
    expect.soft(r.ステータス, "ログイン API の HTTP ステータス").toBe(200);
    expect.soft(j.memberName, "応答の管理者名（ケースの A06-01管理者-002）").toBe(a.名前);
    expect.soft(j.memberName, "応答の管理者名が DB の管理者の名前と一致").toBe(管理者?.名前);
    expect.soft(j.memberId, "応答の管理者ID（文字列の〔管理者ID-A0601-002〕）").toBe(notes.get("〔管理者ID-A0601-002〕"));
    expect.soft(管理者?.所属店舗ID, "DB の管理者の所属店舗ID").toBe(notes.get("〔店舗ID-A0601-002〕"));
    expect.soft(j.shopName, "応答の店舗名が DB の店名と一致（試験支店で読み替え）").toBe(店舗?.店名);
    expect.soft(j.shopAddr, "応答の店舗住所が DB の住所1行目と2行目をつなげた値と一致（試験支店で読み替え）").toBe(`${店舗?.住所1 ?? ""}${店舗?.住所2 ?? ""}`);
    expect.soft(typeof j.jwtToken === "string" && (j.jwtToken as string).length > 0, "応答の認証トークンが空でない文字列").toBe(true);
  });
});

caseTest("IT-A06-01-006", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await ログインを送る(page, "ログイン API への要求（登録されていないログインID）", "a0601_missing-006", "Passw0rd!A0601M"); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => {
    const j = json(r);
    expect.soft(r.ステータス, "ログイン API の HTTP ステータス").toBe(401);
    expect.soft(Array.isArray(j.errors) ? (j.errors as unknown[]).map(String) : [], "応答のエラーの一覧").toContain("ログインIDまたはパスワードが正しくありません");
    expect.soft(typeof j.jwtToken === "string" && (j.jwtToken as string).length > 0, "認証トークンとして使える値が返った").toBe(false);
  });
});

caseTest("IT-A06-01-007", async ({ page, step, expected }) => {
  const a = A0601の管理者("007");
  supplement(印の補い);
  let r!: 応答;
  await step(1, async () => { r = await ログインを送る(page, "ログイン API への要求（誤ったパスワード）", a.loginId, "WrongPass!A0601"); });
  await step(2, async () => { note(`HTTP ステータス ${r.ステータス}`); });
  await expected(async () => {
    const j = json(r);
    expect.soft(r.ステータス, "ログイン API の HTTP ステータス").toBe(401);
    expect.soft(Array.isArray(j.errors) ? (j.errors as unknown[]).map(String) : [], "応答のエラーの一覧").toContain("ログインIDまたはパスワードが正しくありません");
    expect.soft(typeof j.jwtToken === "string" && (j.jwtToken as string).length > 0, "認証トークンとして使える値が返った").toBe(false);
  });
});

caseTest("IT-A06-01-008", async ({ page, notes, step, expected }) => {
  const a = A0601の管理者("008");
  supplement(印の補い);
  let r!: 応答;
  let トークン = "";
  let ペイロード: Record<string, unknown> | null = null;
  await step(1, async () => { r = await ログインを送る(page, "ログイン API への要求", a.loginId, A0601_PASSWORD); });
  await step(2, async () => {
    const t = json(r).jwtToken;
    トークン = typeof t === "string" ? t : "";
    note(`応答の認証トークン: ${トークン ? `${トークン.length}文字（値は記録しない）` : "無い"}`);
  });
  await step(3, async () => {
    ペイロード = トークン ? ペイロードを読む(トークン) : null;
    note(`トークンのペイロード（復号した値）: ${JSON.stringify(ペイロード)}`);
    await page.setContent(`<!doctype html><meta charset="utf-8"><h2>認証トークンのペイロード（開発者ツールでの復号の代わり）</h2><pre>${JSON.stringify(ペイロード, null, 2).replace(/</g, "&lt;")}</pre>`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "ログイン API の HTTP ステータス").toBe(200);
    expect.soft(typeof ペイロード?.iss === "string" && (ペイロード?.iss as string).length > 0, "ペイロードに発行者がある").toBe(true);
    expect.soft(ペイロード?.sub, "ペイロードの利用者ID（〔管理者ID-A0601-008〕）").toBe(notes.get("〔管理者ID-A0601-008〕"));
  });
});
