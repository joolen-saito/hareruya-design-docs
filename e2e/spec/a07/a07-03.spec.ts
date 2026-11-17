/**
 * A07-03 ネット買取受注コメント更新（MTGバイヤーの API の PUT /api/admin/buyOrder/{受注ID}/freeComment.json）。
 * 正本: cases/A07-03_test_cases.tsv。記録 review/A07-03_progress_2026-11-17_dev.md。
 *
 * 開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送る（pages/admin/a07_api.ts。経路の読み替え・認証トークンの受け取りもそこ）。
 * 正本は「クエリに free_comment を設定して PUT」。そのとおり、アドレスのクエリに付けて送る。応答が 2xx でなかったときだけ、比べるために
 * 同じ値を要求の本文（フォーム）で送った結果も注記に残す（判定には使わない。DB を見るケースでは、2回目の送信で値が変わりうるので送らない）。
 * 実装しないケース: 003・004（MTGBuyer の「ネット買取査定」画面の操作が要る）、005（固定の商品ID・在庫IDを DB へ直接登録する定め）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 末尾を置き換える } from "../../pages/admin/a07_api";
import { A0703管理者, A0703AC管理者, A0703控え, AC商品名 } from "../../seeds/a07-03";
import { コメントと担当を読む } from "../../db/a07_03";
import "../../seeds/a07-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、要求メソッド・送った経路・HTTP ステータス・本文を読んだ（エビデンスの画面には応答を表で出した）";
const 受注 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔受注ID-A0703-${l}〕`);
const 経路 = (id: string) => `/api/admin/buyOrder/${id}/freeComment.json`;

async function トークン(a: { 名前: string; account: { loginId: string; password: string } }, 誰: string): Promise<string> {
  supplement(`${誰}の有効な認証トークンは、${誰}のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「認証トークン発行機能」の読み替え。値は記録しない）`);
  return 管理者のトークン(a.account.loginId, a.account.password);
}
const 利用者 = (n: string) => A0703管理者(`A0703-${n}利用者`, `a0703-${n}a`);

/** 正本どおりクエリに free_comment を付けて PUT する。2xx でなく、比べてよいときは、同じ値をフォームの本文で送った結果も注記に残す */
async function コメント更新(ctx: CaseCtx, id: string, o: { トークン?: string; コメント?: string; 比べる?: boolean }): Promise<応答> {
  const q = o.コメント === undefined ? "" : `?free_comment=${encodeURIComponent(o.コメント)}`;
  const t = o.トークン === undefined ? {} : { トークン: o.トークン };
  const r = await 送る(ctx.page, "PUT", `${経路(id)}${q}`, t);
  if (o.比べる && o.コメント !== undefined && (r.ステータス < 200 || r.ステータス >= 300)) {
    const f = await 送る(ctx.page, "PUT", 経路(id), { ...t, フォーム: { free_comment: o.コメント } });
    note(`比べのため（判定には使わない）: クエリで送った応答は HTTP ${r.ステータス}（${r.本文.slice(0, 150)}）。同じ値を要求の本文（フォーム）で送ると HTTP ${f.ステータス}（${f.本文.slice(0, 150)}）だった`);
  }
  return r;
}
async function 見る(ctx: CaseCtx, r: 応答, 見出し = "ネット買取受注コメント更新"): Promise<void> {
  note(`要求メソッド PUT・送った経路 ${r.送った経路}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`);
  await 応答を画面に出す(ctx.page, 見出し, r, r.json ?? r.本文.slice(0, 300));
}

caseTest("IT-A07-03-001", async (ctx) => {
  let r!: 応答; const id = 受注(ctx, "001");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await コメント更新(ctx, id, { トークン: await トークン(利用者("001"), "利用者"), コメント: "身分証明書なし", 比べる: true }); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.送った経路.split("?")[0].replace("/api/v1/admin/", "/api/admin/"), "PUT 要求の送り先（経路の頭の読み替えを除く）").toBe(経路(id));
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  });
});

caseTest("IT-A07-03-002", async (ctx) => {
  let r!: 応答; const id = 受注(ctx, "002");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await コメント更新(ctx, id, { トークン: await トークン(利用者("002"), "利用者"), コメント: "応答確認コメント", 比べる: true }); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && typeof r.json === "object", "応答が JSON 形式").toBe(true);
    const keys = r.json && typeof r.json === "object" ? Object.keys(r.json as object) : [];
    expect.soft(keys.filter((k) => k !== "code"), `応答に業務データ（処理結果コードのほかの項目）を含まない（キー ${keys.join("・") || "なし"}）`).toEqual([]);
  });
});

caseTest("IT-A07-03-006", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await コメント更新(ctx, "703999006", {}); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス（最初の認証判定）").toBe(401); });
});

caseTest("IT-A07-03-007", async (ctx) => {
  let r!: 応答; let token = ""; const id = 受注(ctx, "007");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => {
    const t = await トークン(利用者("007"), "利用者");
    token = 末尾を置き換える(t);
    note(`認証トークンの末尾1文字を、元が${t.endsWith("A") ? " A なので B" : " A でないので A"}へ置き換えた（値は記録しない）`);
  });
  await ctx.step(3, async () => { r = await コメント更新(ctx, id, { トークン: token, コメント: "署名確認コメント" }); });
  await ctx.step(4, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); });
});

caseTest("IT-A07-03-008", async (ctx) => {
  let r!: 応答; const id = 受注(ctx, "008");
  const token = A0703控え.get("GHOST-008");
  if (!token) throw new Error("S-A07-03-GHOST-008 の認証トークンを控えていない");
  supplement("管理者の居ない利用者の認証トークンは、実行の印つきの管理者を登録してトークンを受け取ってから、その管理者を削除したもの（シード。利用者IDはシード表の 7399008 でなく、その管理者の番号）");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await コメント更新(ctx, id, { トークン: token, コメント: "管理者確認コメント" }); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    const errors = (r.json as { errors?: unknown } | null)?.errors;
    expect.soft(Array.isArray(errors) && errors.includes("認証エラー"), `応答 JSON の errors 配列が「認証エラー」を含む（実際 ${JSON.stringify(errors)}）`).toBe(true);
  });
});

caseTest("IT-A07-03-009", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r = await コメント更新(ctx, "703999009", { トークン: await トークン(A0703管理者("A0703-009利用者", "a0703-009a"), "利用者") }); });
  await ctx.step(3, async () => { await 見る(ctx, r); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（コメント未指定の判定より先に受注不存在）").toBe(404);
    const errors = (r.json as { errors?: unknown } | null)?.errors;
    expect.soft(Array.isArray(errors) && errors.includes("買取情報が見つかりません"), `応答 JSON の errors 配列が「買取情報が見つかりません」を含む（実際 ${JSON.stringify(errors)}）`).toBe(true);
  });
});

caseTest("IT-A07-03-014", async (ctx) => {
  let r1!: 応答; let r2!: 応答; const id = 受注(ctx, "014");
  let 一回目 = コメントと担当を読む(id); let 二回目 = 一回目;
  const X = ctx.notes.get("〔管理者会員ID-A0703-014X〕"); const Y = ctx.notes.get("〔管理者会員ID-A0703-014Y〕");
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r1 = await コメント更新(ctx, id, { トークン: await トークン(A0703管理者("A0703-014利用者X", "a0703-014x"), "利用者X"), コメント: "1回目コメントA0703014" }); });
  await ctx.step(3, async () => { 一回目 = コメントと担当を読む(id); note(`1回目: HTTP ${r1.ステータス}・DB のフリーコメント「${一回目?.フリーコメント}」・更新担当者 ${一回目?.更新担当者ID}`); });
  await ctx.step(4, async () => { r2 = await コメント更新(ctx, id, { トークン: await トークン(A0703管理者("A0703-014利用者Y", "a0703-014y"), "利用者Y"), コメント: "2回目コメントA0703014" }); });
  await ctx.step(5, async () => { note(`2回目: HTTP ${r2.ステータス}・本文 ${r2.本文.slice(0, 200)}`); });
  await ctx.step(6, async () => {
    二回目 = コメントと担当を読む(id);
    note(`DB のフリーコメント「${二回目?.フリーコメント}」・更新担当者 ${二回目?.更新担当者ID}`);
    await 応答を画面に出す(ctx.page, "1回目と2回目の結果（DB）", r2, { 一回目: { HTTP: r1.ステータス, ...一回目 }, 二回目: { HTTP: r2.ステータス, ...二回目 }, 利用者X: X, 利用者Y: Y });
  });
  await ctx.expected(async () => {
    expect.soft(r1.ステータス, "1回目の HTTP ステータス").toBe(200);
    expect.soft(一回目?.フリーコメント, "1回目のあとのフリーコメント").toBe("1回目コメントA0703014");
    expect.soft(一回目?.更新担当者ID, "1回目のあとの更新担当者（利用者X）").toBe(X);
    expect.soft(r2.ステータス, "2回目の HTTP ステータス").toBe(200);
    expect.soft(二回目?.フリーコメント, "2回目のあとのフリーコメント").toBe("2回目コメントA0703014");
    expect.soft(二回目?.更新担当者ID, "2回目のあとの更新担当者（利用者Y）").toBe(Y);
  });
});

caseTest("IT-A07-03-015", async (ctx) => {
  let r!: 応答; let 前 = ""; let 後 = "";
  const id = 受注(ctx, "AC001");
  const メモの欄 = () => ctx.page.locator('[name="admin_purchase_detail[memo]"]');
  const 編集を開く = async () => {
    const l = new BuyListPage(ctx.page);
    await l.open();
    await l.買取番号を入れる(id);
    await l.検索する();
  };
  supplement(`申込みの商品は、実行の印を付けた「${AC商品名()}」で作った。手順3の管理者用メモは、その商品名に「x1」が付いた値と比べる`);
  await ctx.step(1, async () => { await loginAdmin(ctx.page, A0703AC管理者.account); await 編集を開く(); });
  await ctx.step(2, async () => { await new BuyListPage(ctx.page).編集画面を開く(id); });
  await ctx.step(3, async () => { 前 = await メモの欄().inputValue(); note(`管理者用メモ欄「${前}」`); });
  await ctx.step(4, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(5, async () => { r = await コメント更新(ctx, id, { トークン: await トークン(A0703AC管理者, "査定担当者AC03"), コメント: "AC連携メモA0703001" }); });
  await ctx.step(6, async () => { await 見る(ctx, r); expect.soft(r.ステータス, "HTTP ステータスが 200").toBe(200); });
  await ctx.step(7, async () => { await 編集を開く(); await new BuyListPage(ctx.page).編集画面を開く(id); });
  await ctx.step(8, async () => { 後 = await メモの欄().inputValue(); note(`管理者用メモ欄「${後}」`); });
  await ctx.expected(async () => {
    expect.soft(前, "手順3の管理者用メモ欄").toBe(`${AC商品名()}x1`);
    expect.soft(後, "手順8の管理者用メモ欄").toBe("AC連携メモA0703001");
  });
});
