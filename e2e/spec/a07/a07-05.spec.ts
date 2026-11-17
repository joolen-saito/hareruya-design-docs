/**
 * A07-05 ネット買取注文の査定終了処理（MTGバイヤーの API の PUT /api/admin/buyOrder/{受注ID}.json）。
 * 正本: cases/A07-05_test_cases.tsv。記録 review/A07-05_progress_2026-11-17_dev.md。
 * 1回目は 001・002・004・005・007・011・017〜020・049・051・052 だけ（ほかは書いていない）。
 *
 * 開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送る（pages/admin/a07_api.ts）。正本どおり、本文を付けず、
 * order_status と明細（order_details）はアドレスのクエリに付ける（PHP の配列の書き方 order_details[0][name]=… にした）。
 * アプリはこの API だけ JSON の本文から読む作り（コントローラの注記「JSON形式のリクエストが前提」）。001 だけ、2xx でなかったときに、
 * 比べるために同じ値を JSON の本文で送った結果を注記に残す（判定には使わない。DB を見るケースでは送らない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 末尾を置き換える } from "../../pages/admin/a07_api";
import { A0705管理者 } from "../../seeds/a07-05";
import { 個別入力商品を読む } from "../../db/a07_07";
import "../../seeds/a07-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（エビデンスの画面には応答を表で出した）";
const 受注 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔受注ID-A0705-${l}〕`);
const 規格 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔商品規格ID-A0705-${l}〕`);
const 経路 = (id: string) => `/api/admin/buyOrder/${id}.json`;
type 明細 = Record<string, string | number>;

/** order_status と order_details をクエリの文字列にする（order_details[0][name]=… の形。空の配列は order_details= とする） */
function クエリ(order_status: string | number, 明細: 明細[] | "空"): string {
  const p = new URLSearchParams();
  p.append("order_status", String(order_status));
  if (明細 === "空") p.append("order_details", "");
  else 明細.forEach((d, i) => { for (const [k, v] of Object.entries(d)) p.append(`order_details[${i}][${k}]`, String(v)); });
  return p.toString();
}
/** 注記に出すクエリ（長い値は長さだけ） */
const 見せるクエリ = (q: string) => decodeURIComponent(q).replace(/=([^&]{60,})/g, (_, v: string) => `=（${v.length} 文字）`);

async function 管理者トークン(): Promise<string> {
  supplement("試験管理者の有効な認証トークンは、試験管理者のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「HS256で署名したトークン」の読み替え。値は記録しない）");
  return 管理者のトークン(A0705管理者.account.loginId, A0705管理者.account.password);
}

/** 正本の受注の明細1件（受注に付けた商品規格・数量1・価格1000） */
const 一件の明細 = (ctx: CaseCtx, l: string): 明細 => ({ product_class_id: Number(規格(ctx, l)), name: `A07-05明細-${l}`, quantity: 1, price: 1000, language_id: 1, condition_id: 1, foil_flg: 0, purchase_category: 1 });

type 送る定め = { 受注ID: (ctx: CaseCtx) => string; order_status: string | number; 明細: (ctx: CaseCtx) => 明細[] | "空"; トークン: "有効" | "なし" | "末尾"; 比べる?: boolean };
type 見る = (r: 応答, ctx: CaseCtx) => void;

function 送って見る(d: 送る定め, 見る: 見る, 画面に出す: (r: 応答, ctx: CaseCtx) => unknown = (r) => r.本文.slice(0, 600)) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答; let token: string | undefined;
    let n = 0;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    if (d.トークン === "末尾") {
      n = 1;
      await ctx.step(2, async () => {
        const t = await 管理者トークン();
        token = 末尾を置き換える(t);
        note(`認証トークンの末尾1文字を、元が${t.endsWith("A") ? " A なので B" : " A でないので A"}へ置き換えた（値は記録しない）`);
      });
    } else if (d.トークン === "有効") token = await 管理者トークン();
    await ctx.step(2 + n, async () => {
      const id = d.受注ID(ctx);
      const 明細 = d.明細(ctx);
      const q = クエリ(d.order_status, 明細);
      note(`本文を付けず、クエリ ${見せるクエリ(q)} を付けて PUT した`);
      r = await 送る(ctx.page, "PUT", `${経路(id)}?${q}`, token === undefined ? {} : { トークン: token });
      if (d.比べる && (r.ステータス < 200 || r.ステータス >= 300) && 明細 !== "空") {
        const f = await 送る(ctx.page, "PUT", 経路(id), { トークン: token, 本文: { order_status: Number(d.order_status), order_details: 明細 } });
        note(`比べのため（判定には使わない）: クエリで送った応答は HTTP ${r.ステータス}。同じ値を JSON の本文で送ると HTTP ${f.ステータス}・本文 ${f.本文.slice(0, 200)}`);
      }
    });
    await ctx.step(3 + n, async () => {
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 400)}`);
      await 応答を画面に出す(ctx.page, "査定終了処理", r, 画面に出す(r, ctx));
    });
    await ctx.expected(async () => { expect(r, "API の応答を受け取った（以下の確かめの前提）").toBeTruthy(); 見る(r, ctx); });
  };
}
const ステータスが = (n: number): 見る => (r) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(n); };
const 拒否 = (r: 応答) => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); expect.soft(r.本文, "レスポンス本文が空").toBe(""); };

caseTest("IT-A07-05-001", 送って見る({ 受注ID: (c) => 受注(c, "001"), order_status: 1, 明細: (c) => [一件の明細(c, "001")], トークン: "有効", 比べる: true }, (r) => {
  expect.soft(r.送った経路.startsWith("/api/admin/buyOrder/"), `PUT 要求が正本の経路「/api/admin/buyOrder/{受注ID}.json」へ送られた（実際に応答した経路 ${r.送った経路}）`).toBe(true);
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
}));

caseTest("IT-A07-05-002", 送って見る({ 受注ID: (c) => 受注(c, "002"), order_status: 1, 明細: (c) => [一件の明細(c, "002")], トークン: "有効" }, (r) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  const 業務 = r.json && typeof r.json === "object" ? Object.keys(r.json as object).filter((k) => k !== "code") : [];
  expect.soft(業務, `レスポンス本文に業務データが含まれない（処理結果コードのほかの項目が無い。本文 ${r.本文.slice(0, 200)}）`).toEqual([]);
}));

caseTest("IT-A07-05-004", 送って見る({ 受注ID: (c) => 受注(c, "004"), order_status: 1, 明細: (c) => [一件の明細(c, "004")], トークン: "なし" }, 拒否));
caseTest("IT-A07-05-005", 送って見る({ 受注ID: (c) => 受注(c, "005"), order_status: 1, 明細: (c) => [一件の明細(c, "005")], トークン: "末尾" }, 拒否));
caseTest("IT-A07-05-007", 送って見る({ 受注ID: () => "799999", order_status: 1, 明細: (c) => [一件の明細(c, "007")], トークン: "有効" }, ステータスが(404)));
caseTest("IT-A07-05-011", 送って見る({ 受注ID: (c) => 受注(c, "011"), order_status: 999999, 明細: (c) => [一件の明細(c, "011")], トークン: "有効" }, ステータスが(400)));

/** 個別入力商品を DB で見るケース（017・018・019・049） */
function 個別入力を見る(l: string, 明細: 明細[], status: number | null, 期待: (rows: ReturnType<typeof 個別入力商品を読む>, r: 応答) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答; let rows: ReturnType<typeof 個別入力商品を読む> = [];
    const id = 受注(ctx, l);
    const 前 = 個別入力商品を読む(id).length;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    await ctx.step(2, async () => {
      const q = クエリ(1, 明細);
      note(`本文を付けず、クエリ ${見せるクエリ(q)}（クエリ全体 ${q.length} 文字）を付けて PUT した。送る前の個別入力商品 ${前} 件`);
      r = await 送る(ctx.page, "PUT", `${経路(id)}?${q}`, { トークン: await 管理者トークン() });
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`);
    });
    let n = 3;
    if (status !== null) {
      await ctx.step(3, async () => { await 応答を画面に出す(ctx.page, "査定終了処理", r, r.本文.slice(0, 400)); });
      n = 4;
    }
    await ctx.step(n, async () => {
      rows = 個別入力商品を読む(id);
      note(`DB: 受注 ${id} の個別入力商品 ${rows.length} 件（${rows.map((x) => `名称 ${x.名前.length > 40 ? `「${x.名前.slice(0, 10)}…」${x.名前.length} 文字` : `「${x.名前}」`}`).join("・") || "なし"}）`);
      await 応答を画面に出す(ctx.page, `受注 ${id} の個別入力商品（DB）`, r, rows.map((x) => ({ ...x, 名前: x.名前.length > 40 ? `${x.名前.slice(0, 10)}…（${x.名前.length} 文字）` : x.名前 })));
    });
    await ctx.expected(async () => {
      if (status !== null) expect.soft(r.ステータス, "HTTP ステータス").toBe(status);
      期待(rows, r);
    });
  };
}
const あ = (n: number) => "あ".repeat(n);
caseTest("IT-A07-05-017", 個別入力を見る("017", [{ name: あ(65535) }], null, (rows) => {
  expect.soft(rows.filter((x) => x.名前 === あ(65535)).length, "name が「あ」65535 文字の個別入力商品が1件登録された").toBe(1);
}));
caseTest("IT-A07-05-018", 個別入力を見る("018", [{ name: あ(65536) }], null, (rows) => {
  expect.soft(rows.filter((x) => x.名前.length >= 65536).length, "name が「あ」65536 文字の個別入力商品が登録されない").toBe(0);
}));
caseTest("IT-A07-05-019", 個別入力を見る("019", [{ name: "任意項目省略商品" }], null, (rows) => {
  expect.soft(rows.filter((x) => x.名前 === "任意項目省略商品").length, "名称「任意項目省略商品」の個別入力商品が1件登録された").toBe(1);
}));
caseTest("IT-A07-05-049", 個別入力を見る("049", [{ name: "A0705-049正常明細", quantity: 1, price: 500 }, { name: "" }], 400, (rows) => {
  expect.soft(rows.length, "個別入力商品が追加されず0件のまま").toBe(0);
}));

caseTest("IT-A07-05-020", 送って見る({ 受注ID: (c) => 受注(c, "020"), order_status: "abc", 明細: () => [{ product_class_id: "abc", quantity: "abc", price: "abc", language_id: "abc", condition_id: "abc", foil_flg: "abc", purchase_category: "abc" }], トークン: "有効" }, ステータスが(400)));
caseTest("IT-A07-05-051", 送って見る({ 受注ID: () => "795051", order_status: 1, 明細: () => [{ name: "A0705-051明細" }], トークン: "なし" }, 拒否));
caseTest("IT-A07-05-052", 送って見る({ 受注ID: () => "795052", order_status: 1, 明細: () => "空", トークン: "有効" }, ステータスが(404)));
