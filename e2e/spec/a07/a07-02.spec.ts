/**
 * A07-02 ネット買取受注一覧取得（MTGバイヤーの API の GET /api/admin/buyOrders.json）。正本: cases/A07-02_test_cases.tsv
 * 実装したケースと解釈は記録 review/A07-02_progress_2026-11-17_dev.md。
 *
 * 「開発者ツールの Console から送り、Network で確かめる」の代わりに、テストのブラウザから API サーバーへ要求を送り、応答を読む（pages/admin/a07_api.ts）。
 * 確かめた応答のうち、ケースが見る要素（控えた受注番号の要素）を画面に表で出してエビデンスに写す（一覧にはほかの方の試験データも入るため、全体は出さない）。
 * 認証トークンは、査定担当A・B（シード）のログインIDとパスワードで管理者ログインの API を呼んで受け取る（アプリの秘密の値は使わない。値は記録しない）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rcFixed } from "../../lib/run_marker";
import { 管理者のトークン, 応答, 応答を画面に出す, 送る, トップページを開く, 末尾を置き換える } from "../../pages/admin/a07_api";
import { 査定担当A, 査定担当B, 控えたトークン } from "../../seeds/a07-02";
import * as a0702db from "../../db/a07_02";
import "../../seeds/a07-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 経路 = "/api/admin/buyOrders.json";
const 開発者ツールの代わり = "開発者ツールの代わりに、テストのブラウザから API サーバーへ要求を送り、応答の HTTP ステータスと本文を読んだ（エビデンスの画面には、ケースが見る要素だけを表で出した）";
const トークンの注記 = (誰: string) => `${誰}の有効な認証トークンは、${誰}のログインIDとパスワードで管理者ログインの API を呼んで受け取った（正本の「HS256 の認証トークンを生成する」の読み替え。値は記録しない）`;

type 要素 = { netBuyOrderId?: unknown; applyDate?: unknown; freeComment?: unknown; memberName?: unknown; netOrderStatusId?: unknown; customerInfo?: Record<string, unknown> } & Record<string, unknown>;
const 配列 = (r: 応答): 要素[] => (Array.isArray(r.json) ? (r.json as 要素[]) : []);
const 番号 = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(`〔ネット買取受注ID-A0702-${呼び名}〕`);
const 要素を探す = (r: 応答, id: string) => 配列(r).filter((e) => e.netBuyOrderId === id);

async function トークン(誰: "A" | "B"): Promise<string> {
  const a = 誰 === "A" ? 査定担当A : 査定担当B;
  supplement(トークンの注記(`査定担当${誰}`));
  return 管理者のトークン(a.account.loginId, a.account.password);
}

/** 手順: トップを開く → 要求を送る → 応答を見る（001・004・011・016 の形） */
function 一覧を取る(呼び名: string[], check: (r: 応答, ctx: CaseCtx) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    await ctx.step(2, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: await トークン("A") }); });
    await ctx.step(3, async () => {
      const 見る = 呼び名.map((l) => ({ 呼び名: l, 番号: 番号(ctx, l), 要素: 要素を探す(r, 番号(ctx, l)) }));
      note(`応答 HTTP ${r.ステータス}・${見る.map((x) => `受注 ${x.番号} の要素 ${x.要素.length} 件`).join("・")}`);
      await 応答を画面に出す(ctx.page, "ネット買取受注一覧取得", r, 見る);
    });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
      expect.soft(Array.isArray(r.json), "応答本文が JSON 配列").toBe(true);
      check(r, ctx);
    });
  };
}

caseTest("IT-A07-02-001", 一覧を取る(["001"], () => { /* 期待結果は 200 と JSON 配列だけ */ }));

caseTest("IT-A07-02-002", async (ctx) => {
  let r!: 応答; let 到着ID: string | null = null;
  const id = 番号(ctx, "002");
  await ctx.step(1, async () => {
    const v = a0702db.買取の値を読む(id);
    到着ID = a0702db.買取状況のID("商品到着");
    note(`DB: ネット買取受注ID ${id} の行 ${v ? "あり" : "なし"}・買取状況ID ${v?.状況ID ?? "-"}・「商品到着」のステータスID ${到着ID ?? "なし"}`);
    expect(v, `ネット買取受注ID ${id} の行が DB にある`).not.toBeNull();
    expect(到着ID, "「商品到着」のステータスIDが DB にある").not.toBeNull();
  });
  await ctx.step(2, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(3, async () => { r = await 送る(ctx.page, "GET", 経路, { トークン: await トークン("A") }); });
  await ctx.step(4, async () => {
    const e = 要素を探す(r, id);
    note(`応答 HTTP ${r.ステータス}・受注 ${id} の要素 ${e.length} 件: ${JSON.stringify(e[0] ?? null)}`);
    await 応答を画面に出す(ctx.page, "ネット買取受注一覧取得（受注の要素）", r, e);
  });
  await ctx.expected(async () => {
    const e = 要素を探す(r, id);
    expect(e.length, `受注 ${id} の要素が1件`).toBe(1);
    const x = e[0];
    supplement(`査定担当者名は、シード表の「査定担当A」に決まった印を付けた「${rcFixed("査定担当A")}」で登録したので、その値と比べた`);
    expect.soft(x.netBuyOrderId, "netBuyOrderId").toBe(id);
    expect.soft(x.applyDate, "applyDate").toBe("2026-08-20T10:15:30+09:00");
    expect.soft(x.freeComment, "freeComment").toBe("確認済み");
    expect.soft(x.memberName, "memberName").toBe(rcFixed("査定担当A"));
    expect.soft(x.netOrderStatusId, "netOrderStatusId（DB の「商品到着」のステータスIDと同じ文字列）").toBe(到着ID);
    expect.soft(x.customerInfo?.firstName, "customerInfo.firstName").toBe("太郎");
    expect.soft(x.customerInfo?.lastName, "customerInfo.lastName").toBe("晴屋");
    expect.soft(x.customerInfo?.telNo, "customerInfo.telNo").toBe("090-1234-5678");
    expect.soft(x.customerInfo?.zipcode, "customerInfo.zipcode").toBe("101-0001");
    expect.soft(x.customerInfo?.address, "customerInfo.address").toBe("東京都 千代田区晴屋1-2-3 神田ビル4F");
  });
});

const 十二件 = "ABCDEFGHIJKL".split("").map((c) => `004${c}`);
caseTest("IT-A07-02-004", 一覧を取る(十二件, (r, ctx) => {
  const ids = 十二件.map((l) => 番号(ctx, l));
  const 並び = 配列(r).map((e) => String(e.netBuyOrderId));
  for (const id of ids) expect.soft(並び.filter((x) => x === id).length, `受注 ${id} が1回だけ返る（重複・欠落なし）`).toBe(1);
  const 位置 = ids.map((id) => 並び.indexOf(id));
  expect.soft(位置.every((p, i) => i === 0 || p > 位置[i - 1]), `004A〜004L が配列の中で昇順に並ぶ（位置 ${位置.join("・")}）`).toBe(true);
}));

caseTest("IT-A07-02-006", async (ctx) => {
  let r1!: 応答; let r2!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
  await ctx.step(2, async () => { r1 = await 送る(ctx.page, "GET", 経路, { トークン: await トークン("A") }); });
  await ctx.step(3, async () => { r2 = await 送る(ctx.page, "GET", 経路, { トークン: await トークン("B") }); });
  await ctx.step(4, async () => {
    const 同じ = r1.本文 === r2.本文;
    note(`査定担当Aの応答 HTTP ${r1.ステータス}・${配列(r1).length} 件、査定担当Bの応答 HTTP ${r2.ステータス}・${配列(r2).length} 件。本文は${同じ ? "同じ" : "違う"}（共有の開発環境なので、2回の要求の間にほかの方の受注が変わると違いうる）`);
    const id = 番号(ctx, "006");
    await 応答を画面に出す(ctx.page, "査定担当A・Bの応答の比べ（受注 006 の要素）", r2, { 本文が同じ: 同じ, 査定担当A: 要素を探す(r1, id), 査定担当B: 要素を探す(r2, id) });
  });
  await ctx.expected(async () => {
    expect.soft(r1.ステータス, "査定担当Aの応答の HTTP ステータス").toBe(200);
    expect.soft(r2.ステータス, "査定担当Bの応答の HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r1.json) && Array.isArray(r2.json), "どちらも JSON 配列").toBe(true);
    expect.soft(r2.json, "査定担当Bの応答が査定担当Aの応答と同じ JSON 配列").toEqual(r1.json);
  });
});

/** 401 を確かめる（007・008・009） */
function 拒否(手順: "なし" | "末尾" | "009") {
  return async (ctx: CaseCtx): Promise<void> => {
    let r!: 応答; let token: string | undefined;
    const n = 手順 === "末尾" ? 1 : 0;
    await ctx.step(1, async () => { note(開発者ツールの代わり); await トップページを開く(ctx.page); });
    if (手順 === "末尾") {
      await ctx.step(2, async () => {
        const t = await トークン("A");
        token = 末尾を置き換える(t);
        note(`認証トークンの末尾1文字を、元が${t.endsWith("A") ? " A なので B" : " A でないので A"}へ置き換えた（値は記録しない）`);
      });
    }
    if (手順 === "009") {
      token = 控えたトークン.get("009");
      if (!token) throw new Error("S-A07-02-NOMEMBER-009 の認証トークンを控えていない");
      supplement("削除した管理者（〔管理者会員ID-A0702-009〕）の認証トークンは、削除の前に管理者ログインの API で受け取ったもの（シード）");
    }
    await ctx.step(2 + n, async () => { r = await 送る(ctx.page, "GET", 経路, 手順 === "なし" ? {} : { トークン: token }); });
    await ctx.step(3 + n, async () => {
      note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 200)}`);
      await 応答を画面に出す(ctx.page, "ネット買取受注一覧取得", r, r.json);
    });
    await ctx.expected(async () => { expect.soft(r.ステータス, "HTTP ステータス").toBe(401); });
  };
}
caseTest("IT-A07-02-007", 拒否("なし"));
caseTest("IT-A07-02-008", 拒否("末尾"));
caseTest("IT-A07-02-009", 拒否("009"));

caseTest("IT-A07-02-011", 一覧を取る(["011"], (r, ctx) => {
  const e = 要素を探す(r, 番号(ctx, "011"));
  expect(e.length, "受注 011 の要素が1件").toBe(1);
  const x = e[0];
  expect.soft("freeComment" in x, "freeComment の項目が省略されない").toBe(true);
  expect.soft("memberName" in x, "memberName の項目が省略されない").toBe(true);
  expect.soft(x.freeComment === "" || x.freeComment === null, `freeComment が空値（実際 ${JSON.stringify(x.freeComment)}）`).toBe(true);
  expect.soft(x.memberName === "" || x.memberName === null, `memberName が空値（実際 ${JSON.stringify(x.memberName)}）`).toBe(true);
}));

caseTest("IT-A07-02-016", 一覧を取る(["016A", "016B"], (r, ctx) => {
  expect.soft(要素を探す(r, 番号(ctx, "016A")).length, "受注 016A（商品到着）が含まれる").toBe(1);
  expect.soft(要素を探す(r, 番号(ctx, "016B")).length, "受注 016B（振込完了）が含まれない").toBe(0);
}));
