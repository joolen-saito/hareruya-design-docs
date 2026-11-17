/**
 * A07-06 複数ネット買取IDからネット買取受注の商品一覧（買取代表カード）を取得（MTGバイヤーの API の POST /api/admin/buyMainCard.json）。
 * 正本: cases/A07-06_test_cases.tsv。記録 review/A07-06_progress_2026-11-17_dev.md。
 *
 * 開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送る（pages/admin/a07_api.ts）。正本どおり ids はアドレスのクエリに付けて POST する
 * （設計書のリクエスト書式も「クエリ」。アプリは要求の本文から読む作り）。応答が空の配列なのに DB では明細があるときだけ、比べるために
 * 同じ値を本文で送った結果も注記に残す（判定には使わない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 末尾を置き換える } from "../../pages/admin/a07_api";
import { A0706管理者, A0706控え } from "../../seeds/a07-06";
import { 明細を読む } from "../../db/a07_06";
import "../../seeds/a07-06";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 経路 = "/api/admin/buyMainCard.json";
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（エビデンスの画面には応答を表で出した）";
const 受注 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔ネット買取受注ID-A0706-${l}〕`);
const 明細ID = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔買取商品ID-A0706-${l}〕`);
type 要素 = Record<string, unknown>;
const 配列 = (r: 応答): 要素[] => (Array.isArray(r.json) ? (r.json as 要素[]) : []);
const 要素 = (r: 応答, id: string) => 配列(r).filter((e) => String(e.buyMainCardId) === id);

async function 管理者トークン(): Promise<string> {
  supplement("試験管理者の有効な認証トークンは、試験管理者のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「試験用秘密値で署名したトークン」の読み替え。値は記録しない）");
  return 管理者のトークン(A0706管理者.account.loginId, A0706管理者.account.password);
}

async function 明細を取る(ctx: CaseCtx, 呼び名: string[], トークン?: string): Promise<応答> {
  const ids = 呼び名.map((l) => 受注(ctx, l));
  const t = トークン === undefined ? {} : { トークン };
  const r = await 送る(ctx.page, "POST", `${経路}?ids=${ids.join(",")}`, t);
  const DB = ids.reduce((n, id) => n + 明細を読む(id).length, 0);
  if (r.ステータス === 200 && 配列(r).length === 0 && DB > 0) {
    const f = await 送る(ctx.page, "POST", 経路, { ...t, フォーム: { ids: ids.join(",") } });
    note(`比べのため（判定には使わない）: クエリで送った応答は空の配列だったが、DB では指定の買取に明細が ${DB} 件ある。同じ値を要求の本文（フォーム）で送ると HTTP ${f.ステータス}・${配列(f).length} 件だった`);
  }
  return r;
}

function 取って見る(呼び名: string[], 見る明細: string[], check: (r: 応答, ctx: CaseCtx) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    await ctx.step(2, async () => { r = await 明細を取る(ctx, 呼び名, await 管理者トークン()); });
    await ctx.step(3, async () => {
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 400)}`);
      await 応答を画面に出す(ctx.page, "買取代表カードの取得", r, 見る明細.length ? 見る明細.map((l) => 要素(r, 明細ID(ctx, l))) : r.json);
    });
    await ctx.expected(async () => { expect(r, "API の応答を受け取った（以下の確かめの前提）").toBeTruthy(); check(r, ctx); });
  };
}
const 一件 = (r: 応答, ctx: CaseCtx, l: string): 要素 => {
  const e = 要素(r, 明細ID(ctx, l));
  expect(e.length, `買取商品ID ${明細ID(ctx, l)} の要素が1件`).toBe(1);
  return e[0];
};
const 整数 = (v: unknown) => typeof v === "number" && Number.isInteger(v);

caseTest("IT-A07-06-001", 取って見る(["共有A", "共有B"], [], (r) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(Array.isArray(r.json), "応答本文が JSON 配列").toBe(true);
}));

caseTest("IT-A07-06-002", 取って見る(["共有A", "共有B", "共有NONE"], ["共有A", "共有B", "共有C"], (r, ctx) => {
  for (const l of ["共有A", "共有B", "共有C"]) expect.soft(要素(r, 明細ID(ctx, l)).length, `買取商品ID ${明細ID(ctx, l)} が1回だけ返る（重複・欠落なし）`).toBe(1);
  expect.soft(要素(r, 明細ID(ctx, "共有D")).length, `指定していない受注の買取商品ID ${明細ID(ctx, "共有D")} が返らない`).toBe(0);
}));

caseTest("IT-A07-06-003", 取って見る(["共有A"], ["共有A"], (r, ctx) => {
  const x = 一件(r, ctx, "共有A");
  for (const k of ["buyMainCardId", "buyOrderId", "productId", "languageId", "foilFlg", "count", "price", "cardConditionId", "purchaseCategory"]) expect.soft(整数(x[k]), `${k} が整数（実際 ${JSON.stringify(x[k])}）`).toBe(true);
  expect.soft(typeof x.saleFlg, `saleFlg が文字列（実際 ${JSON.stringify(x.saleFlg)}）`).toBe("string");
  const ap = x.applicationPrice;
  expect.soft(ap !== null && typeof ap === "object" && !Array.isArray(ap), "applicationPrice がオブジェクト").toBe(true);
  for (const [k, v] of Object.entries((ap ?? {}) as Record<string, unknown>)) expect.soft(typeof v, `applicationPrice の ${k} の値が文字列（実際 ${JSON.stringify(v)}）`).toBe("string");
}));

caseTest("IT-A07-06-004", 取って見る(["共有A", "共有B"], ["共有A", "共有B", "共有C"], (r, ctx) => {
  const want: [string, number, string][] = [["共有A", 0, "なし"], ["共有B", 1, "通常"], ["共有C", 2, "特殊"]];
  const DBの明細 = [...明細を読む(受注(ctx, "共有A")), ...明細を読む(受注(ctx, "共有B"))];
  for (const [l, id, 名] of want) {
    const x = 一件(r, ctx, l);
    const d = DBの明細.find((m) => m.ID === 明細ID(ctx, l));
    note(`DB: 買取商品ID ${明細ID(ctx, l)} の Foil区分ID ${d?.フォイル ?? "なし"}（シード表の「${名}」= ${id}）`);
    expect.soft(d?.フォイル, `DB の買取商品ID ${明細ID(ctx, l)} の Foil区分ID が「${名}」の ID`).toBe(String(id));
    expect.soft(x.foilFlg, `買取商品ID ${明細ID(ctx, l)} の foilFlg が DB で確かめた「${名}」の ID ${id}（真偽値でない整数）`).toBe(id);
  }
}));

caseTest("IT-A07-06-005", 取って見る(["共有A"], ["共有A"], (r, ctx) => {
  const x = 一件(r, ctx, "共有A");
  expect.soft(x.price, "price（再計算・丸めなし）").toBe(1234);
  const ap = (x.applicationPrice ?? {}) as Record<string, unknown>;
  expect.soft(String(ap.NM), "applicationPrice の NM").toBe("1234");
  expect.soft(String(ap.SP), "applicationPrice の SP").toBe("987");
}));

caseTest("IT-A07-06-006", 取って見る(["共有A"], ["共有B"], (r, ctx) => {
  const x = 一件(r, ctx, "共有B");
  expect.soft("applicationPrice" in x, `applicationPrice の項目が含まれない（空のオブジェクトも含まない。実際 ${JSON.stringify(x.applicationPrice)}）`).toBe(false);
}));

caseTest("IT-A07-06-007", 取って見る(["共有NULL"], ["共有NULL"], (r, ctx) => {
  const x = 一件(r, ctx, "共有NULL");
  for (const k of ["languageId", "foilFlg", "count", "price", "cardConditionId", "saleFlg"]) expect.soft(x[k], `${k} が null`).toBeNull();
  for (const k of ["buyMainCardId", "buyOrderId", "productId", "purchaseCategory"]) expect.soft(x[k] !== null && x[k] !== undefined, `${k} に値がある`).toBe(true);
}));

caseTest("IT-A07-06-008", 取って見る(["共有NONE"], [], (r) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(r.本文.trim(), "空の JSON 配列").toBe("[]");
}));

function 拒否(種類: "なし" | "末尾" | "GHOST") {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答; let token: string | undefined;
    const n = 種類 === "末尾" ? 1 : 0;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    if (種類 === "末尾") {
      await ctx.step(2, async () => {
        const t = await 管理者トークン();
        token = 末尾を置き換える(t);
        note(`認証トークンの末尾1文字を、元が${t.endsWith("A") ? " A なので B" : " A でないので A"}へ置き換えた（値は記録しない）`);
      });
    }
    if (種類 === "GHOST") {
      token = A0706控え.get("GHOST");
      if (!token) throw new Error("S-A07-06-GHOST の認証トークンを控えていない");
      supplement("削除済みの管理者の認証トークンは、登録した管理者で受け取ってから、その管理者を削除したもの（シード）");
    }
    await ctx.step(2 + n, async () => { r = await 明細を取る(ctx, ["共有A"], token); });
    await ctx.step(3 + n, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 200)}`); await 応答を画面に出す(ctx.page, "買取代表カードの取得", r, r.本文.slice(0, 300)); });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
      expect.soft(r.本文, "レスポンス本文が空").toBe("");
    });
  };
}
caseTest("IT-A07-06-010", 拒否("なし"));
caseTest("IT-A07-06-011", 拒否("末尾"));
caseTest("IT-A07-06-012", 拒否("GHOST"));

caseTest("IT-A07-06-016", 取って見る(["016"], ["016"], (r, ctx) => { expect.soft(一件(r, ctx, "016").buyOrderId, "buyOrderId（整数）").toBe(Number(受注(ctx, "016"))); }));
caseTest("IT-A07-06-017", 取って見る(["017"], ["017"], (r, ctx) => { expect.soft(一件(r, ctx, "017").productId, "productId（整数）").toBe(Number(ctx.notes.get("〔商品ID-A0706-017〕"))); }));
caseTest("IT-A07-06-018", 取って見る(["018"], ["018"], (r, ctx) => { expect.soft(一件(r, ctx, "018").languageId, "languageId（整数）").toBe(2); }));
caseTest("IT-A07-06-019", 取って見る(["019"], ["019"], (r, ctx) => { expect.soft(一件(r, ctx, "019").count, "count（整数）").toBe(7); }));
caseTest("IT-A07-06-020", 取って見る(["020"], ["020"], (r, ctx) => { expect.soft(一件(r, ctx, "020").cardConditionId, "cardConditionId（整数）").toBe(2); }));
caseTest("IT-A07-06-021", 取って見る(["021"], ["021"], (r, ctx) => { expect.soft(一件(r, ctx, "021").saleFlg, "saleFlg（真偽値でない文字列）").toBe("true"); }));
caseTest("IT-A07-06-022", 取って見る(["022"], ["022"], (r, ctx) => { expect.soft(一件(r, ctx, "022").saleFlg, "saleFlg（真偽値でない文字列）").toBe("false"); }));
caseTest("IT-A07-06-023", 取って見る(["023"], ["023"], (r, ctx) => { expect.soft(一件(r, ctx, "023").purchaseCategory, "purchaseCategory（整数）").toBe(2); }));
