/**
 * A07-04 ネット買取受注ステータス更新（MTGバイヤーの API の PUT /api/admin/buyOrder/{受注ID}/status.json）。
 * 正本: cases/A07-04_test_cases.tsv。記録 review/A07-04_progress_2026-11-17_dev.md。
 *
 * 「ブラウザから送信する」は、テストのブラウザから API サーバーへ要求を送って応答を読む（pages/admin/a07_api.ts）。
 * status は正本どおりアドレスのクエリに付ける（022 以降は正本が「クエリ文字列だけ」と明記。001〜013 は渡し方の定めが無く、設計書のリクエスト書式「クエリ」に合わせた）。
 * アプリは要求の本文から読む作り。2xx を期待するケースで 2xx でなかったときだけ、比べるために同じ値を本文で送った結果を注記に残す（判定には使わない。
 * DB や画面で「変わらない」を見るケースでは送らない）。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyListPage } from "../../pages/admin/m07_buy";
import { PurchaseHistoryListPage } from "../../pages/front/f06_11_purchase_history";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る } from "../../pages/admin/a07_api";
import { A0704管理者, A0704AC管理者, A0704控え } from "../../seeds/a07-04";
import { 会員のパスワード } from "../../seeds/a07-common";
import { 状況ID, 履歴の件数 } from "../../db/a07_04";
import "../../seeds/a07-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 受注 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔受注ID-A0704-${l}〕`);
const 経路 = (id: string) => `/api/admin/buyOrder/${id}/status.json`;
const 送り方 = "テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（status はアドレスのクエリに付けた）";
type 誰 = "A" | "AC";
async function トークン(w: 誰): Promise<string> {
  const a = w === "A" ? A0704管理者 : A0704AC管理者;
  supplement(`${a.名前}の有効な認証トークンは、ログインIDとパスワードで管理者ログインの API を呼んで受け取った（値は記録しない）`);
  return 管理者のトークン(a.account.loginId, a.account.password);
}
async function ステータス更新(ctx: CaseCtx, id: string, o: { status?: string; トークン?: string; 比べる?: boolean }): Promise<応答> {
  const q = o.status === undefined ? "" : `?status=${encodeURIComponent(o.status)}`;
  const t = o.トークン === undefined ? {} : { トークン: o.トークン };
  const r = await 送る(ctx.page, "PUT", `${経路(id)}${q}`, t);
  if (o.比べる && o.status !== undefined && (r.ステータス < 200 || r.ステータス >= 300)) {
    const f = await 送る(ctx.page, "PUT", 経路(id), { ...t, フォーム: { status: o.status } });
    note(`比べのため（判定には使わない）: クエリで送った応答は HTTP ${r.ステータス}（${r.本文.slice(0, 150)}）。同じ値を要求の本文（フォーム）で送ると HTTP ${f.ステータス}（${f.本文.slice(0, 150)}）だった`);
  }
  return r;
}
const errors = (r: 応答): unknown[] => { const e = (r.json as { errors?: unknown } | null)?.errors; return Array.isArray(e) ? e : []; };
const code = (r: 応答) => (r.json as { code?: unknown } | null)?.code;

/** 2手順の形（1. 送る ／ 2. 応答を見る） */
function 送って見る(呼び名: string | null, 固定番号: string | null, o: { status: string; トークン?: 誰 | "invalid" | "NOADMIN" }, check: (r: 応答) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    const id = 呼び名 ? 受注(ctx, 呼び名) : 固定番号!;
    await ctx.step(1, async () => {
      note(送り方);
      let token: string | undefined;
      if (o.トークン === "A" || o.トークン === "AC") token = await トークン(o.トークン);
      if (o.トークン === "invalid") token = "invalid-token";
      if (o.トークン === "NOADMIN") {
        token = A0704控え.get("NOADMIN-003");
        if (!token) throw new Error("S-A07-04-NOADMIN-003 の認証トークンを控えていない");
        supplement("管理者会員に対応しない利用者の認証トークンは、登録した E2E の管理者で受け取ってから、その管理者を削除したもの（シード。利用者IDはシード表の 7999003 でなく、その管理者の番号）");
      }
      r = await ステータス更新(ctx, id, { status: o.status, トークン: token });
    });
    await ctx.step(2, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`); await 応答を画面に出す(ctx.page, "ネット買取受注ステータス更新", r, r.json ?? r.本文.slice(0, 300)); });
    await ctx.expected(async () => { expect(r, "API の応答を受け取った（以下の確かめの前提）").toBeTruthy(); check(r); });
  };
}
const 本文なしの401 = (r: 応答) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); expect.soft(r.本文, "応答本文が返らない").toBe(""); };
const エラー = (st: number, msg: string, 無い?: string) => (r: 応答) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(st);
  expect.soft(code(r), "応答 JSON の処理結果コード").toBe(st);
  expect.soft(errors(r).includes(msg), `errors 配列が「${msg}」を含む（実際 ${JSON.stringify(errors(r))}）`).toBe(true);
  if (無い) expect.soft(errors(r).includes(無い), `errors 配列が「${無い}」を含まない`).toBe(false);
};
const 完了済み = "この査定はすでに終了しているためステータスの更新に失敗しました。";
const 不正なID = "正しい店頭買取ステータスIDを入力してください";

caseTest("IT-A07-04-001", 送って見る("001", null, { status: "1" }, 本文なしの401));
caseTest("IT-A07-04-002", 送って見る("002", null, { status: "1", トークン: "invalid" }, 本文なしの401));
caseTest("IT-A07-04-003", 送って見る("003", null, { status: "1", トークン: "NOADMIN" }, エラー(401, "認証エラー")));
caseTest("IT-A07-04-004", 送って見る(null, "704999004", { status: "999" }, 本文なしの401));
caseTest("IT-A07-04-005", 送って見る(null, "704999005", { status: "999", トークン: "A" }, エラー(404, "買取情報が見つかりません")));
caseTest("IT-A07-04-010", 送って見る("010", null, { status: "999", トークン: "A" }, エラー(400, 不正なID)));
caseTest("IT-A07-04-012", 送って見る("012", null, { status: "1", トークン: "A" }, エラー(400, 完了済み)));
caseTest("IT-A07-04-023", 送って見る("023", null, { status: "999", トークン: "A" }, エラー(400, 不正なID, 完了済み)));
caseTest("IT-A07-04-037", 送って見る("037", null, { status: "12", トークン: "A" }, エラー(400, "この受注は「査定担当者A0704CB037-E2E」が査定中です。")));
caseTest("IT-A07-04-043", 送って見る("043", null, { status: "10", トークン: "A" }, エラー(400, "この受注は「査定担当者A0704CB043-E2E」が査定中です。")));
caseTest("IT-A07-04-048", 送って見る("048", null, { status: "10", トークン: "A" }, エラー(400, "この査定はすでに終了しているため開くことができません。")));
caseTest("IT-A07-04-049", 送って見る("049", null, { status: "11", トークン: "A" }, エラー(400, 完了済み)));
caseTest("IT-A07-04-050", 送って見る("050", null, { status: "12", トークン: "A" }, エラー(400, "この査定はすでに終了しているため開くことができません。")));

caseTest("IT-A07-04-022", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(送り方); r = await ステータス更新(ctx, 受注(ctx, "022"), { status: "10", トークン: await トークン("A"), 比べる: true }); });
  await ctx.step(2, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`); await 応答を画面に出す(ctx.page, "ネット買取受注ステータス更新", r, r.json ?? r.本文); });
  await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス（400 のステータスID未指定扱いにならない）").toBe(200); });
});

/** DB で「変わらない」を見る形（009・011・013） */
function 変わらない(送るもの: [string, string | undefined][], 期待の状況: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const rs: string[] = [];
    await ctx.step(1, async () => {
      note(送り方);
      const t = await トークン("A");
      for (const [l, st] of 送るもの) { const r = await ステータス更新(ctx, 受注(ctx, l), { status: st, トークン: t }); rs.push(`受注 ${l}・status ${st === undefined ? "なし" : JSON.stringify(st)} → HTTP ${r.ステータス}`); }
      note(rs.join(" ／ "));
    });
    let 結果: { 呼び名: string; 状況: string | null; 履歴: number }[] = [];
    await ctx.step(2, async () => {
      結果 = [...new Set(送るもの.map(([l]) => l))].map((l) => ({ 呼び名: l, 状況: 状況ID(受注(ctx, l)), 履歴: 履歴の件数(受注(ctx, l)) }));
      note(`DB: ${結果.map((x) => `受注 ${x.呼び名} の状況ID ${x.状況}・履歴 ${x.履歴} 件`).join(" ／ ")}`);
      await ctx.page.setContent(`<pre>${JSON.stringify({ 送った: rs, DB: 結果 }, null, 2)}</pre>`);
    });
    await ctx.expected(async () => {
      for (const x of 結果) {
        expect.soft(x.状況, `受注 ${x.呼び名} の状況ID が ${期待の状況} のまま`).toBe(期待の状況);
        expect.soft(x.履歴, `受注 ${x.呼び名} のステータス変更履歴が0件のまま`).toBe(0);
      }
    });
  };
}
caseTest("IT-A07-04-009", 変わらない([["009", undefined], ["009", ""], ["009", "abc"], ["009", "999"]], "2"));
caseTest("IT-A07-04-011", 変わらない([["011A", "1"], ["011B", "3"], ["011C", "4"], ["011D", "5"], ["011E", "7"], ["011F", "13"], ["011G", "14"], ["011H", "15"], ["011I", "16"]], "2"));
caseTest("IT-A07-04-013", 変わらない([["013", "1"]], "3"));

/** 管理画面: 買取一覧を買取番号で検索する／編集画面を開いて買取状況と履歴を読む */
async function 一覧で探す(page: Page, id: string): Promise<string> {
  const l = new BuyListPage(page);
  await l.open(); await l.買取番号を入れる(id); await l.検索する();
  const row = (await l.行()).find((x) => x.番号 === String(Number(id)));
  if (!row) throw new Error(`買取一覧に買取番号 ${id} の行が無い`);
  return row.買取状況;
}
async function 編集画面を読む(page: Page, id: string): Promise<{ 状況: string; 履歴: { 日時: string; ステータス: string; 変更者: string }[] }> {
  await 一覧で探す(page, id);
  await new BuyListPage(page).編集画面を開く(id);
  const 状況 = ((await page.locator("#admin_purchase_detail_BuyOrderStatus option:checked").textContent()) ?? "").trim();
  await page.locator('a[href="#statusHistoryCollapse"]').click();
  await page.locator("#statusHistoryCollapse").waitFor({ state: "visible" });
  const 履歴 = await page.locator('#statusHistoryCollapse tr[id^="detail__item--"]').evaluateAll((trs) => trs.map((tr) => {
    const td = Array.from(tr.querySelectorAll("td")).map((x) => (x.textContent ?? "").trim());
    return { 日時: td[0] ?? "", ステータス: td[1] ?? "", 変更者: td[2] ?? "" };
  }));
  return { 状況, 履歴 };
}

caseTest("IT-A07-04-024", async (ctx) => {
  let 前 = ""; let 後 = ""; let r!: 応答; const id = 受注(ctx, "AC001");
  await ctx.step(1, async () => { await loginAdmin(ctx.page, A0704AC管理者.account); 前 = await 一覧で探す(ctx.page, id); });
  await ctx.step(2, async () => { note(`手順2の買取状況「${前}」`); });
  await ctx.step(3, async () => { note(送り方); r = await ステータス更新(ctx, id, { status: "10", トークン: await トークン("AC"), 比べる: true }); });
  await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}`); expect.soft(r.ステータス, "HTTP 200").toBe(200); });
  await ctx.step(5, async () => { 後 = await 一覧で探す(ctx.page, id); });
  await ctx.step(6, async () => { note(`手順6の買取状況「${後}」`); });
  await ctx.expected(async () => {
    expect.soft(前, "手順2の買取状況").toBe("商品到着");
    expect.soft(後, "手順6の買取状況").toBe("査定中");
  });
});

caseTest("IT-A07-04-025", async (ctx) => {
  let 前!: Awaited<ReturnType<typeof 編集画面を読む>>; let 後!: typeof 前; let r!: 応答; const id = 受注(ctx, "AC002");
  await ctx.step(1, async () => { await loginAdmin(ctx.page, A0704AC管理者.account); await 一覧で探す(ctx.page, id); });
  await ctx.step(2, async () => { await new BuyListPage(ctx.page).編集画面を開く(id); });
  await ctx.step(3, async () => { 前 = await 編集画面を読む(ctx.page, id); note(`手順3: 買取状況「${前.状況}」・履歴 ${JSON.stringify(前.履歴)}`); });
  await ctx.step(4, async () => { note(送り方); r = await ステータス更新(ctx, id, { status: "10", トークン: await トークン("AC"), 比べる: true }); });
  await ctx.step(5, async () => { note(`応答 HTTP ${r.ステータス}`); expect.soft(r.ステータス, "HTTP 200").toBe(200); });
  await ctx.step(6, async () => { await 一覧で探す(ctx.page, id); await new BuyListPage(ctx.page).編集画面を開く(id); });
  await ctx.step(7, async () => { 後 = await 編集画面を読む(ctx.page, id); note(`手順7: 買取状況「${後.状況}」・履歴 ${JSON.stringify(後.履歴)}`); });
  await ctx.expected(async () => {
    expect.soft(前.状況, "手順3の買取状況").toBe("商品到着");
    expect.soft(後.状況, "手順7の買取状況").toBe("査定中");
    expect.soft(後.履歴.length, "ステータス変更履歴が1件増える").toBe(前.履歴.length + 1);
    expect.soft(後.履歴[0]?.ステータス, "増えた行が先頭で、ステータスが査定中").toBe("査定中");
    expect.soft(前.履歴.some((h) => h.ステータス === "査定中"), "手順3には査定中の行が無い").toBe(false);
    expect.soft(後.履歴[0]?.変更者, "増えた行の変更者が API で認証した管理者").toBe(A0704AC管理者.名前);
  });
});

caseTest("IT-A07-04-026", async (ctx) => {
  let 前 = ""; let 後 = ""; let r!: 応答; const id = 受注(ctx, "AC003");
  const メール = A0704控え.get("会員メール-AC003");
  if (!メール) throw new Error("AC003 の会員のメールアドレスを控えていない");
  const h = new PurchaseHistoryListPage(ctx.page);
  const 処理状態 = async () => {
    const 番号 = (await h.番号の並び()).find((n) => n.replace(/\D/g, "").endsWith(String(Number(id)).padStart(10, "0")));
    if (!番号) throw new Error(`買取履歴一覧に買取番号 ${id} の行が無い`);
    return (await h.行を読む(番号)).処理状態;
  };
  await ctx.step(1, async () => { await h.ログインする(メール, 会員のパスワード); await h.マイページを開く(); await h.履歴一覧を開く(); });
  await ctx.step(2, async () => { 前 = await 処理状態(); note(`手順2の処理状態「${前}」`); });
  await ctx.step(3, async () => { note(送り方); r = await ステータス更新(ctx, id, { status: "10", トークン: await トークン("AC"), 比べる: true }); });
  await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}`); expect.soft(r.ステータス, "HTTP 200").toBe(200); });
  await ctx.step(5, async () => { await h.マイページを開く(); await h.履歴一覧を開く(); });
  await ctx.step(6, async () => { 後 = await 処理状態(); note(`手順6の処理状態「${後}」`); });
  await ctx.expected(async () => {
    expect.soft(前, "手順2の処理状態").toBe("受付完了");
    expect.soft(後, "手順6の処理状態").toBe("査定中");
  });
});

/** 033・046・047: 査定担当者Aで画面を見て、API を送り、画面が変わらないことを見る */
function 画面が変わらない(l: string, status: string, 期待: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let 前!: Awaited<ReturnType<typeof 編集画面を読む>>; let 後!: typeof 前; let r!: 応答; const id = 受注(ctx, l);
    await ctx.step(1, async () => { await loginAdmin(ctx.page, A0704管理者.account); await 一覧で探す(ctx.page, id); });
    await ctx.step(2, async () => { 前 = await 編集画面を読む(ctx.page, id); note(`手順2: 買取状況「${前.状況}」・履歴 ${前.履歴.length} 件`); });
    await ctx.step(3, async () => { note(送り方); r = await ステータス更新(ctx, id, { status, トークン: await トークン("A") }); });
    await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 200)}`); expect.soft(r.ステータス, "HTTP 200").toBe(200); });
    await ctx.step(5, async () => { await 一覧で探す(ctx.page, id); });
    await ctx.step(6, async () => { 後 = await 編集画面を読む(ctx.page, id); note(`手順6: 買取状況「${後.状況}」・履歴 ${後.履歴.length} 件`); });
    await ctx.expected(async () => {
      expect.soft(後.状況, `買取状況が${期待}のまま`).toBe(期待);
      expect.soft(後.履歴.length, "ステータス変更履歴が0件のまま").toBe(0);
    });
  };
}
caseTest("IT-A07-04-033", 画面が変わらない("033", "10", "査定中"));
caseTest("IT-A07-04-046", 画面が変わらない("046", "12", "査定再開"));
caseTest("IT-A07-04-047", 画面が変わらない("047", "11", "査定中断"));
