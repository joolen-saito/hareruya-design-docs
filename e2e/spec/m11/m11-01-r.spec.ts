/**
 * M11-01 メンバー管理一覧（追加分: 004・007・008・035）。正本: cases/M11-01_test_cases.tsv
 * 所属・権限・店舗の読み替えとメンバーの並べ方は spec/m11/m11-01.spec.ts・seeds/m11-01.ts と同じ。
 * 正本の「削除されていないメンバーはケースのメンバーだけ」は、ほかの方のメンバーを退避しないとできないので、ケースのメンバーだけを数えて確かめる。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { ログインIDの数 } from "../../db/m11_01";
import { 名前のメンバーの数 } from "../../db/m11_01_r";
import { MemberListPage } from "../../pages/admin/m11_01_member_list";
import { MemberEditPage } from "../../pages/admin/m11_02_member";
import { 所属, 権限, 店舗の, 読み替えの文, ログイン管理者, ログインID, パスワード, 呼び名, 名前の } from "../../seeds/m11-01";
import "../../seeds/m11-01-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const ID = (ctx: CaseCtx, n: string, 記号: string): string => ctx.notes.get(呼び名(n, 記号));

async function 一覧を開く(ctx: CaseCtx, n: string): Promise<MemberListPage> {
  await loginAdmin(ctx.page, ログイン管理者(n));
  return new MemberListPage(ctx.page);
}

caseTest("IT-M11-01-004", async (ctx) => {
  const { step, expected } = ctx;
  const n = "004";
  const 全員 = "ABCDEFGHIJKL".split("");
  const l = await 一覧を開く(ctx, n);
  let 見える = 0, ページ送り = -1;
  const 見えない: string[] = [];
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    for (const k of 全員) { if (await l.行(ID(ctx, n, k)).isVisible()) 見える++; else 見えない.push(k); }
    ページ送り = await ctx.page.locator(".pagination, .page-link, nav[aria-label*='ページ']").count();
    note(`ケースの12人のうち一覧に表示された行: ${見える}・表示されなかった記号: ${見えない.join("") || "なし"}・ページ送りの部品: ${ページ送り}`);
  });
  await expected(async () => {
    supplement("正本の「削除されていないメンバーは全12件」は、ほかの方のメンバーを退避しないとできない。ケースの12人が、ページを切り替えずに1つの一覧へ全部表示されることで確かめた");
    expect.soft(見える, "ケースの12人（ログイン管理者-004・ページング確認01〜11-004）が一覧にすべて表示される").toBe(12);
    expect.soft(ページ送り, "ページを切り替える部品が無い").toBe(0);
  });
});

function 絞り込んで見る(n: string, 何: "所属" | "権限", 値: string, 表示: string[], 非表示: string[]): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const l = await 一覧を開く(ctx, n);
    const 見え: Record<string, boolean> = {};
    await step(1, async () => { await l.開く(); });
    await step(2, async () => {
      await ctx.page.locator(何 === "所属" ? "#filter_department" : "#filter_authority").selectOption({ label: 値 });
    });
    await step(3, async () => {
      for (const k of [...表示, ...非表示]) 見え[k] = await l.行(ID(ctx, n, k)).isVisible();
      note(`絞り込み（${何}=${値}）のあとの、ケースのメンバーの表示: ${JSON.stringify(Object.fromEntries(Object.entries(見え).map(([k, v]) => [名前の(n, k), v])))}`);
    });
    await expected(async () => {
      supplement(`${何}の「${何 === "所属" ? "東京店" : "店舗権限"}」は、開発環境に既にあるもの「${値}」へ読み替えた（${読み替えの文}）。正本の「この5件だけ」は、ケースの5人だけを見て確かめた`);
      for (const k of 表示) expect.soft(見え[k], `${名前の(n, k)} が表示される`).toBe(true);
      for (const k of 非表示) expect.soft(見え[k], `${名前の(n, k)} が表示されない`).toBe(false);
    });
  };
}
// 007: 所属が東京店（A=ログイン管理者・B=東京店舗担当・D=東京システム担当）。C・E は大阪店
caseTest("IT-M11-01-007", 絞り込んで見る("007", "所属", 所属.東京店, ["A", "B", "D"], ["C", "E"]));
// 008: 権限が店舗権限（B=東京店舗担当・E=大阪店舗担当）。A・C・D はシステム権限
caseTest("IT-M11-01-008", 絞り込んで見る("008", "権限", 権限.店舗権限, ["B", "E"], ["A", "C", "D"]));

caseTest("IT-M11-01-035", async (ctx) => {
  const { step, expected } = ctx;
  const n = "035";
  const 重複 = ログインID(`m1101-${n}-dup`);
  const 名 = rc("重複登録-035");
  const l = await 一覧を開く(ctx, n);
  const e = new MemberEditPage(ctx.page);
  let r: Awaited<ReturnType<MemberEditPage["登録を押す"]>> | null = null;
  let 重複の数 = -1, 名前の数 = -1;
  expect(ログインIDの数(重複), "ログインID（既存利用中-035）のメンバーはあらかじめ1人だけ").toBe(1);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await l.新規登録を押す(); });
  await step(3, async () => {
    await e.入れる({
      名前: 名, 所属: 所属.東京店, ログインID: 重複, メールアドレス: `${重複}-new@example.com`, パスワード: パスワード("Pw035Ab9"),
      権限: 権限.システム権限, 所属店舗ID: 店舗の("東京店"), 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"),
    });
    supplement("パスワードは正本の値（8文字）がアプリの最低12文字に足りず、その誤りで止まると重複の確かめにならないので、末尾を足した12文字以上の値を入れた。ログインID・メールアドレス・名前には実行の印を付けた");
  });
  await step(4, async () => { r = await e.登録を押す(); note(`登録のあと: ${JSON.stringify(r)}`); });
  await step(5, async () => { 重複の数 = ログインIDの数(重複); 名前の数 = 名前のメンバーの数(名); note(`DB: 重複したログインIDのメンバー ${重複の数} 件・名前「重複登録-035」のメンバー ${名前の数} 件`); });
  await expected(async () => {
    supplement("正本の「削除されていないメンバーが2件のまま」は、ほかの方のメンバーがいるので数えられない。重複したログインIDのメンバーが既存の1件のままで、名前「重複登録-035」のメンバーが0件であることで確かめた");
    expect.soft(名前の数, "名前「重複登録-035」のメンバーが登録されない").toBe(0);
    expect.soft(重複の数, "ログインID「m1101-035-dup」のメンバーが既存の1件のまま").toBe(1);
  });
});
