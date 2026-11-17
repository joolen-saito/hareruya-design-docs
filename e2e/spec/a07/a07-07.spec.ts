/**
 * A07-07 複数ネット買取IDから個別入力商品の一覧を取得（MTGバイヤーの API の POST /api/admin/buyOrderIndivisualInputProduct.json）。
 * 正本: cases/A07-07_test_cases.tsv。記録 review/A07-07_progress_2026-11-17_dev.md。
 *
 * 開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送る（pages/admin/a07_api.ts。経路の読み替え・認証トークンの受け取りもそこ）。
 * 正本は「クエリ ids=… を付けて POST」（設計書のリクエスト書式も「クエリ」）。そのとおり、アドレスのクエリに ids を付けて送る。
 * 応答が空の配列なのに DB では個別入力商品がぶら下がっているときだけ、比べるために同じ ids をフォームの本文で送った結果も注記に残す（判定には使わない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 署名の先頭を置き換える } from "../../pages/admin/a07_api";
import { A0707管理者, A0707控え } from "../../seeds/a07-07";
import { 個別入力商品を読む, 買取状況の名前 } from "../../db/a07_07";
import "../../seeds/a07-07";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 経路 = "/api/admin/buyOrderIndivisualInputProduct.json";
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータス・Content-Type・本文を読んだ（エビデンスの画面には応答を表で出した）";
const 受注 = (ctx: CaseCtx, l: string) => ctx.notes.get(`〔ネット買取受注ID-A0707-${l}〕`);
type 要素 = Record<string, unknown>;
const 配列 = (r: 応答): 要素[] => (Array.isArray(r.json) ? (r.json as 要素[]) : []);
const 個別 = (r: 応答, id: string) => 配列(r).filter((e) => String(e.buyOrderIndivisualInputProductId) === id);

async function 管理者トークン(): Promise<string> {
  supplement("試験管理者の有効な認証トークンは、試験管理者のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「試験用秘密値で署名したトークン」の読み替え。値は記録しない）");
  return 管理者のトークン(A0707管理者.account.loginId, A0707管理者.account.password);
}

/** 正本どおりクエリに ids を付けて POST する。空の配列で、DB には個別入力商品がある買取を指定していたら、フォームの本文で送った結果も注記に残す */
async function 個別入力を取る(ctx: CaseCtx, 呼び名: string[], トークン?: string): Promise<応答> {
  const ids = 呼び名.map((l) => 受注(ctx, l));
  const r = await 送る(ctx.page, "POST", `${経路}?ids=${ids.join(",")}`, トークン === undefined ? {} : { トークン });
  const DBの件数 = ids.reduce((n, id) => n + 個別入力商品を読む(id).length, 0);
  if (r.ステータス === 200 && 配列(r).length === 0 && DBの件数 > 0) {
    const f = await 送る(ctx.page, "POST", 経路, { ...(トークン === undefined ? {} : { トークン }), フォーム: { ids: ids.join(",") } });
    note(`比べのため（判定には使わない）: クエリで送った応答は空の配列だったが、DB では指定の買取に個別入力商品が ${DBの件数} 件ある。同じ値を要求の本文（フォーム）で送ると HTTP ${f.ステータス}・${配列(f).length} 件だった`);
  }
  return r;
}

/** 001〜008・012 の形: トップ → 送る → 応答を見る */
function 取って見る(呼び名: string[], 見る番号: string[], check: (r: 応答, ctx: CaseCtx) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    await ctx.step(2, async () => { r = await 個別入力を取る(ctx, 呼び名, await 管理者トークン()); });
    await ctx.step(3, async () => {
      note(`応答 HTTP ${r.ステータス}・Content-Type ${r.種類}・本文 ${r.本文.slice(0, 400)}`);
      await 応答を画面に出す(ctx.page, "個別入力商品の一覧の取得", r, 見る番号.length ? 見る番号.map((id) => 個別(r, id)) : r.json);
    });
    await ctx.expected(async () => { expect(r, "API の応答を受け取った（以下の確かめの前提）").toBeTruthy(); check(r, ctx); });
  };
}

caseTest("IT-A07-07-001", 取って見る(["001"], ["940707001"], (r) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(r.種類.split(";")[0].trim(), "応答ヘッダの Content-Type").toBe("application/json");
  expect.soft(Array.isArray(r.json), "応答本文が JSON 配列").toBe(true);
}));

caseTest("IT-A07-07-002", async (ctx) => {
  let r!: 応答;
  const ids = ["940707002", "930707002", "920707002"];
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    const db = ["002A", "002B", "002C"].map((l) => `買取 ${受注(ctx, l)}: ${個別入力商品を読む(受注(ctx, l)).map((x) => x.ID).join("・") || "なし"}`);
    note(`事前準備の確かめ（DB）: ${db.join(" / ")}`);
    await トップページを開く(ctx.page);
  });
  await ctx.step(2, async () => { r = await 個別入力を取る(ctx, ["002A", "002B"], await 管理者トークン()); });
  await ctx.step(3, async () => {
    note(`応答 HTTP ${r.ステータス}・個別入力商品ID ${配列(r).map((e) => e.buyOrderIndivisualInputProductId).join("・") || "なし"}`);
    await 応答を画面に出す(ctx.page, "個別入力商品の一覧の取得", r, r.json);
  });
  await ctx.expected(async () => {
    for (const id of ids) expect.soft(個別(r, id).length, `個別入力商品ID ${id} が1回だけ返る（重複・欠落なし）`).toBe(1);
    expect.soft(個別(r, "910707002").length, "指定していない買取の個別入力商品ID 910707002 が返らない").toBe(0);
  });
});

caseTest("IT-A07-07-003", 取って見る(["003"], ["940707003"], (r, ctx) => {
  const e = 個別(r, "940707003");
  expect(e.length, "個別入力商品ID 940707003 の要素が1件").toBe(1);
  const x = e[0];
  expect.soft(x.buyOrderIndivisualInputProductId, "buyOrderIndivisualInputProductId（整数）").toBe(940707003);
  expect.soft(x.buyOrderId, "buyOrderId（整数）").toBe(Number(受注(ctx, "003")));
  expect.soft(x.name, "name（文字列）").toBe("個別A0707-003-A");
  expect.soft(x.price, "price（整数）").toBe(1234);
  expect.soft(x.count, "count（整数）").toBe(2);
  expect.soft(x.saleFlg, "saleFlg").toBe(true);
}));

caseTest("IT-A07-07-004", 取って見る(["004"], ["940707004"], (r) => {
  const e = 個別(r, "940707004");
  expect(e.length, "個別入力商品ID 940707004 の要素が1件").toBe(1);
  expect.soft(e[0].price, "price（再計算・丸めなし）").toBe(1234);
  expect.soft(e[0].count, "count").toBe(3);
  expect.soft(e[0].name, "name").toBe("個別A0707-004-A");
  expect.soft(e[0].saleFlg, "saleFlg").toBe(false);
}));

caseTest("IT-A07-07-005", 取って見る(["005"], ["940707005"], (r, ctx) => {
  const e = 個別(r, "940707005");
  expect(e.length, "個別入力商品ID 940707005 の要素が1件").toBe(1);
  const x = e[0];
  for (const k of ["price", "count", "saleFlg"]) {
    expect.soft(k in x, `${k} の項目がある`).toBe(true);
    expect.soft(x[k], `${k} が null`).toBeNull();
  }
  expect.soft(x.buyOrderIndivisualInputProductId, "buyOrderIndivisualInputProductId").toBe(940707005);
  expect.soft(x.buyOrderId, "buyOrderId").toBe(Number(受注(ctx, "005")));
  expect.soft(x.name, "name").toBe("個別A0707-005-A");
}));

caseTest("IT-A07-07-006", 取って見る(["006A", "006B"], [], (r, ctx) => {
  expect.soft(配列(r).length, "一覧の件数（個別入力商品ID 940707006 の1件だけ）").toBe(1);
  expect.soft(個別(r, "940707006").length, "個別入力商品ID 940707006 が含まれる").toBe(1);
  expect.soft(配列(r).filter((e) => String(e.buyOrderId) === 受注(ctx, "006B")).length, "買取 006B の要素は含まれない").toBe(0);
}));

caseTest("IT-A07-07-007", 取って見る(["007"], [], (r) => {
  expect.soft(r.ステータス, "HTTP ステータス（401・500 などのエラー応答でない）").toBe(200);
}));

caseTest("IT-A07-07-008", 取って見る(["008"], [], (r) => {
  expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  expect.soft(r.本文.trim(), "応答本文が要素0件の空の JSON 配列").toBe("[]");
}));

/** 401 の形（009〜011） */
function 拒否(呼び名: string, 個別ID: string, 種類: "なし" | "署名" | "GHOST") {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答; let token: string | undefined;
    const n = 種類 === "署名" ? 1 : 0;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    if (種類 === "署名") {
      await ctx.step(2, async () => {
        const t = await 管理者トークン();
        token = 署名の先頭を置き換える(t);
        note("認証トークンの署名部分（2つ目のピリオドより後ろ）の先頭1文字を、正本の決まり（A なら B、それ以外なら A）で置き換えた（値は記録しない）");
      });
    }
    if (種類 === "GHOST") {
      token = A0707控え.get("GHOST");
      if (!token) throw new Error("S-A07-07-GHOST の認証トークンを控えていない");
      supplement("管理者の居ない利用者の認証トークンは、実行の印つきの管理者を登録してトークンを受け取ってから、その管理者を削除したもの（シード。利用者IDはシード表の 970707999 でなく、その管理者の番号）");
    }
    await ctx.step(2 + n, async () => { r = await 個別入力を取る(ctx, [呼び名], token); });
    await ctx.step(3 + n, async () => {
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 200)}`);
      await 応答を画面に出す(ctx.page, "個別入力商品の一覧の取得", r, r.json ?? r.本文.slice(0, 300));
    });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
      expect.soft(r.本文.includes(個別ID), `応答本文に個別入力商品ID ${個別ID} が含まれない`).toBe(false);
      expect.soft(r.本文.includes(`個別A0707-${呼び名}-A`), `応答本文に商品名「個別A0707-${呼び名}-A」が含まれない`).toBe(false);
    });
  };
}
caseTest("IT-A07-07-009", 拒否("009", "940707009", "なし"));
caseTest("IT-A07-07-010", 拒否("010", "940707010", "署名"));
caseTest("IT-A07-07-011", 拒否("011", "940707011", "GHOST"));

caseTest("IT-A07-07-012", async (ctx) => {
  let r!: 応答;
  const id = 受注(ctx, "012");
  const 読む = () => ({ 状況: 買取状況の名前(id), 個別: 個別入力商品を読む(id) });
  let 前!: ReturnType<typeof 読む>; let 後!: ReturnType<typeof 読む>;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { 前 = 読む(); note(`DB（送る前）: 買取状況 ${前.状況}・個別入力商品 ${JSON.stringify(前.個別)}`); });
  await ctx.step(3, async () => { r = await 個別入力を取る(ctx, ["012"], await 管理者トークン()); note(`応答 HTTP ${r.ステータス}・${配列(r).length} 件`); });
  await ctx.step(4, async () => {
    後 = 読む();
    note(`DB（送った後）: 買取状況 ${後.状況}・個別入力商品 ${JSON.stringify(後.個別)}`);
    await 応答を画面に出す(ctx.page, "DB の値（送る前・送った後）", r, { 送る前: 前, 送った後: 後 });
  });
  await ctx.expected(async () => {
    expect.soft(後.状況, "買取状況が査定中のまま").toBe("査定中");
    const 期待 = [
      { ID: "930707012", 名前: "個別A0707-012-B", 金額: "800", 枚数: "1", 売却: "false" },
      { ID: "940707012", 名前: "個別A0707-012-A", 金額: "1500", 枚数: "2", 売却: "true" },
    ];
    expect.soft(後.個別.map(({ ID, 金額, 枚数, 売却 }) => ({ ID, 金額, 枚数, 売却 })), "個別入力商品が 940707012・930707012 の2件のまま（値も変わらない）").toEqual(期待.map(({ ID, 金額, 枚数, 売却 }) => ({ ID, 金額, 枚数, 売却 })));
    expect.soft(後, "手順2と手順4で値が変わらない").toEqual(前);
  });
});
