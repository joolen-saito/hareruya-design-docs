/**
 * M11-01 メンバー管理一覧（仕分け直しで流せる見込みになったケース）。正本: cases/M11-01_test_cases.tsv
 * 実装しないケースと理由は記録 review/M11-01_progress_2026-11-11_dev.md（034）。
 * 所属・権限は開発環境に既にあるものへ読み替え、ケースのメンバーは表示順を「基準＋正本の値」にして一覧の先頭に並べる（seeds/m11-01.ts）。
 * 上へ・下へ・削除は、押す前に入れ替え・繰り下げの相手が E2E のメンバーだけであることを DB で確かめ、ほかの方のメンバーに当たるときは押さずに止める。
 */
import { BrowserContext, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 表示順, いるか, ログインIDの数, マスタの登録内容, 入れ替えの相手を確かめる, 繰り下がる相手を確かめる } from "../../db/m11_01";
import { MemberListPage, 操作 } from "../../pages/admin/m11_01_member_list";
import { MemberEditPage } from "../../pages/admin/m11_02_member";
import { 所属, 権限, 店舗の, 読み替えの文, ログイン管理者, ログインID, パスワード, 呼び名, 名前の, 正本の表示順 } from "../../seeds/m11-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 並びの読み替え = (基準: number) => supplement(`ケースのメンバーの表示順は、正本の値に基準 ${基準} を足した値（開発環境のほかの方のメンバーより上に並べるため）。期待結果の表示順は「基準＋正本の値」で確かめた`);

/** ケースの番号の、記号のメンバーID */
const ID = (ctx: CaseCtx, n: string, 記号: string): string => ctx.notes.get(呼び名(n, 記号));

/** ケースのメンバーの表示順の基準（いまの表示順 − 正本の表示順。全員がそろっていることも確かめる） */
function 基準を読む(ctx: CaseCtx, n: string): number {
  const want = 正本の表示順(n);
  const 記号 = Object.keys(want);
  const 基準 = (表示順(ID(ctx, n, 記号[0])) ?? NaN) - want[記号[0]];
  for (const k of 記号) {
    const s = 表示順(ID(ctx, n, k));
    if (s !== 基準 + want[k]) throw new Error(`${n} の ${k} の表示順が ${s}（基準 ${基準}＋正本の ${want[k]} のはず）。事前準備の並びになっていない`);
  }
  return 基準;
}

async function 一覧を開く(ctx: CaseCtx, n: string): Promise<MemberListPage> {
  await loginAdmin(ctx.page, ログイン管理者(n));
  const l = new MemberListPage(ctx.page);
  return l;
}

/** 別のブラウザ（ブラウザB）で同じログイン管理者としてログインする */
async function ブラウザBを開く(ctx: CaseCtx, n: string): Promise<{ contextB: BrowserContext; listB: MemberListPage }> {
  const contextB = await ctx.browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(contextB);
  const pageB: Page = await contextB.newPage();
  await loginAdmin(pageB, ログイン管理者(n));
  return { contextB, listB: new MemberListPage(pageB) };
}

// ---- 一覧の表示 ----
caseTest("IT-M11-01-001", async (ctx) => {
  const { step, expected } = ctx;
  const n = "001";
  const l = await 一覧を開く(ctx, n);
  let 表示: Awaited<ReturnType<MemberListPage["行の表示"]>> | null = null;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { 表示 = await l.行の表示(ID(ctx, n, "C")); note(`大阪システム担当-001 の行: ${JSON.stringify(表示)}`); });
  await expected(async () => {
    supplement(`期待結果の所属・権限・店舗は、開発環境に既にあるものへ読み替えた値で確かめた（${読み替えの文}。店舗「大阪店」「東京店」は店名が一致する既存の店舗）`);
    const v = 表示!;
    expect.soft(v.名前, "名前").toBe(名前の(n, "C"));
    expect.soft(v.所属, "所属（大阪店の読み替え）").toBe(所属.大阪店);
    expect.soft(v.権限, "権限（システム権限の読み替え）").toBe(権限.システム権限);
    expect.soft(v.デフォルト検索表示店舗, "デフォルト検索表示店舗").toBe("大阪店");
    expect.soft(v.編集可能店舗.split(/\s*,\s*/).sort(), "編集可能店舗（東京店と大阪店）").toEqual(["大阪店", "東京店"].sort());
    expect.soft(v.自動ログアウト, "自動ログアウト").toBe("有効");
    expect.soft(v.二段階認証, "2段階認証").toContain("有効");
    expect.soft(v.二段階認証の設定, "2段階認証は設定済み（吹き出しの文）").toContain("完了");
  });
});

caseTest("IT-M11-01-002", async (ctx) => {
  const { step, expected } = ctx;
  const n = "002";
  const 基準 = 基準を読む(ctx, n);
  const l = await 一覧を開く(ctx, n);
  let 上から: string[] = [];
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { 上から = await l.上からのID(5); note(`一覧の上から5行のメンバーID: ${上から.join("・")}`); });
  await expected(async () => {
    並びの読み替え(基準);
    supplement("正本の「削除されていないメンバーは5件だけ」は、ほかの方のメンバーを退避しないとできない。一覧の上から5行がケースの5人で、正本の順に並ぶことを確かめた（6行目以降はほかの方のメンバー）");
    expect.soft(上から, "上から ログイン管理者-002・東京店舗担当-002・大阪システム担当-002・東京システム担当-002・大阪店舗担当-002 の順").toEqual(["A", "B", "C", "D", "E"].map((k) => ID(ctx, n, k)));
  });
});

caseTest("IT-M11-01-003", async (ctx) => {
  const { step, expected } = ctx;
  const n = "003";
  const l = await 一覧を開く(ctx, n);
  let C = 0, F = 0, 名前で = 0;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    C = await l.行(ID(ctx, n, "C")).count(); F = await l.行(ID(ctx, n, "F")).count();
    名前で = await ctx.page.locator("table tbody tr td:first-child", { hasText: 名前の(n, "F") }).count();
  });
  await expected(async () => {
    expect.soft(C, "非稼働の「大阪システム担当-003」が表示される").toBe(1);
    expect.soft(F, "削除済みの「削除済みメンバー-003」（その行）が表示されない").toBe(0);
    expect.soft(名前で, "削除済みの「削除済みメンバー-003」の名前が一覧に無い").toBe(0);
  });
});

function 絞り込みの選択肢を見る(n: string, 何: "所属" | "権限"): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const l = await 一覧を開く(ctx, n);
    let 選択肢: string[] = [];
    await step(1, async () => { await l.開く(); });
    await step(2, async () => { await l.絞り込みを開く(何); 選択肢 = await l.絞り込みの選択肢(何); note(`${何}の選択肢: ${選択肢.join("、")}`); });
    await expected(async () => {
      supplement(`${何}のマスタは全員が使うので正本の値を足さず、既存の値へ読み替えて確かめた（${読み替えの文}）`);
      const want = 何 === "所属" ? [所属.東京店, 所属.大阪店] : [権限.システム権限, 権限.店舗権限];
      for (const w of want) expect.soft(選択肢, `${何}の選択肢に「${w}」がある`).toContain(w);
    });
  };
}
caseTest("IT-M11-01-005", 絞り込みの選択肢を見る("005", "所属"));
caseTest("IT-M11-01-006", 絞り込みの選択肢を見る("006", "権限"));

caseTest("IT-M11-01-009", async (ctx) => {
  const { step, expected } = ctx;
  const l = await 一覧を開く(ctx, "009");
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await l.新規登録を押す(); });
  await expected(async () => {
    expect.soft(l.パス, "新規登録のメンバー管理画面").toMatch(/\/setting\/system\/member\/new$/);
    const e = new MemberEditPage(ctx.page);
    await expect.soft(e.名前欄, "名前の入力欄が空（新規登録状態）").toHaveValue("");
    await expect.soft(e.ログインID欄, "ログインIDの入力欄が空（新規登録状態）").toHaveValue("");
  });
});

caseTest("IT-M11-01-010", async (ctx) => {
  const { step, expected } = ctx;
  const n = "010";
  const B = ID(ctx, n, "B");
  const l = await 一覧を開く(ctx, n);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await l.確認を開く(B, "編集"); });
  await step(3, async () => { await l.実行する(B, "編集"); });
  await expected(async () => {
    expect.soft(l.パス, "東京店舗担当-010 のメンバー管理画面").toMatch(new RegExp(`/setting/system/member/${B}/edit$`));
    await expect.soft(new MemberEditPage(ctx.page).名前欄, "名前").toHaveValue(名前の(n, "B"));
  });
});

caseTest("IT-M11-01-011", async (ctx) => {
  const { step, expected } = ctx;
  const n = "011";
  const A = ID(ctx, n, "A");
  const l = await 一覧を開く(ctx, n);
  let 押せる = true, ある = 0;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { ある = await l.アイコン(A, "削除").count(); 押せる = await l.押せるか(A, "削除"); });
  await expected(async () => {
    expect.soft(ある, "ログイン管理者-011 の行に削除の項目（アイコン）が表示される").toBe(1);
    expect.soft(押せる, "操作できる削除リンクではない（押せない表示）").toBe(false);
  });
});

caseTest("IT-M11-01-012", async (ctx) => {
  const { step, expected } = ctx;
  const n = "012";
  const A = ID(ctx, n, "A");
  const l = await 一覧を開く(ctx, n);
  let 先頭 = "", 末尾 = "", 先頭の上へ = true, 末尾の下へ = true;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    先頭 = (await l.上からのID(1))[0]; 末尾 = await l.最後の行のID();
    先頭の上へ = await l.押せるか(先頭, "上へ"); 末尾の下へ = await l.押せるか(末尾, "下へ");
    note(`先頭の行のメンバーID ${先頭}・末尾の行のメンバーID ${末尾}`);
  });
  await expected(async () => {
    supplement("正本の「ほかに削除されていないメンバーなし」は、ほかの方のメンバーを退避しないとできない。末尾の行はほかの方のメンバーになるので、末尾の「大阪店舗担当-012」の代わりに一覧の末尾の行の下への操作を見た");
    expect.soft(先頭, "先頭の行がログイン管理者-012").toBe(A);
    expect.soft(先頭の上へ, "先頭の行に上への操作が表示されない（押せない）").toBe(false);
    expect.soft(末尾の下へ, "末尾の行に下への操作が表示されない（押せない）").toBe(false);
  });
});

// ---- 上へ・下へ ----
function 入れ替える(n: string, 対象: string, 向き: "上へ" | "下へ", 相手: string, want: Record<string, number>): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const 基準 = 基準を読む(ctx, n);
    const id = ID(ctx, n, 対象);
    const l = await 一覧を開く(ctx, n);
    let 後: Record<string, number | null> = {};
    await step(1, async () => { await l.開く(); });
    await step(2, async () => { 入れ替えの相手を確かめる(id, 向き, ID(ctx, n, 相手)); await l.確認を開く(id, 向き); });
    await step(3, async () => { await l.実行する(id, 向き); note(`実行のあとの帯: ${JSON.stringify(await l.帯())}`); });
    await step(4, async () => { for (const k of Object.keys(want)) 後[k] = 表示順(ID(ctx, n, k)); note(`実行のあとの表示順: ${JSON.stringify(後)}`); });
    await expected(async () => {
      並びの読み替え(基準);
      expect.soft(l.一覧画面か(), "メンバー管理一覧画面が再表示される").toBe(true);
      for (const [k, v] of Object.entries(want)) expect.soft(後[k], `${名前の(n, k)} の表示順が ${v}（基準＋${v}）`).toBe(基準 + v);
    });
  };
}
caseTest("IT-M11-01-013", 入れ替える("013", "C", "上へ", "B", { C: 4, B: 3 }));
caseTest("IT-M11-01-014", 入れ替える("014", "C", "下へ", "D", { C: 2, D: 3 }));

function 欠番で押す(n: string, 向き: "上へ" | "下へ"): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const 基準 = 基準を読む(ctx, n);
    const B = ID(ctx, n, "B");
    const l = await 一覧を開く(ctx, n);
    let 帯: Awaited<ReturnType<MemberListPage["帯"]>> | null = null;
    let 後 = 0;
    await step(1, async () => { await l.開く(); });
    await step(2, async () => { 入れ替えの相手を確かめる(B, 向き, null); await l.確認を開く(B, 向き); });
    await step(3, async () => { await l.実行する(B, 向き); 帯 = await l.帯(); 後 = 表示順(B) ?? NaN; note(`実行のあとの帯: ${JSON.stringify(帯)}・表示順欠番メンバーの表示順: ${後}`); });
    await expected(async () => {
      並びの読み替え(基準);
      supplement("正本の「ほかに削除されていないメンバーなし」は、ほかの方のメンバーを退避しないとできない。表示順の上下（基準＋31・基準＋29）にメンバーがいないことを押す前に DB で確かめた");
      expect.soft(l.一覧画面か(), "メンバー管理一覧画面が再表示される").toBe(true);
      expect.soft(帯!.誤り.join(" / "), "管理画面上部に並び順の更新エラー").toContain("並び順の更新に失敗しました");
      expect.soft(後, "表示順欠番メンバーの表示順は変わらない（基準＋30）").toBe(基準 + 30);
    });
  };
}
caseTest("IT-M11-01-015", 欠番で押す("015", "上へ"));
caseTest("IT-M11-01-016", 欠番で押す("016", "下へ"));

caseTest("IT-M11-01-041", async (ctx) => {
  const { step, expected } = ctx;
  const n = "041";
  const 基準 = 基準を読む(ctx, n);
  const E = ID(ctx, n, "E");
  const l = await 一覧を開く(ctx, n);
  const 後: Record<string, number | null> = {};
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { 入れ替えの相手を確かめる(E, "上へ", ID(ctx, n, "D")); await l.確認を開く(E, "上へ"); });
  await step(3, async () => { await l.実行する(E, "上へ"); note(`1回目のあとの帯: ${JSON.stringify(await l.帯())}`); });
  await step(4, async () => { 入れ替えの相手を確かめる(E, "上へ", ID(ctx, n, "C")); await l.確認を開く(E, "上へ"); });
  await step(5, async () => { await l.実行する(E, "上へ"); note(`2回目のあとの帯: ${JSON.stringify(await l.帯())}`); });
  await step(6, async () => { for (const k of ["A", "B", "C", "D", "E"]) 後[k] = 表示順(ID(ctx, n, k)); note(`5人の表示順: ${JSON.stringify(後)}`); });
  await expected(async () => {
    並びの読み替え(基準);
    expect.soft(l.一覧画面か(), "メンバー管理一覧画面が再表示される").toBe(true);
    const want: Record<string, number> = { E: 3, D: 1, C: 2, B: 4, A: 5 };
    for (const [k, v] of Object.entries(want)) expect.soft(後[k], `${名前の(n, k)} の表示順が ${v}（基準＋${v}）`).toBe(基準 + v);
  });
});

// ---- 削除 ----
caseTest("IT-M11-01-017", async (ctx) => {
  const { step, expected } = ctx;
  const n = "017";
  const C = ID(ctx, n, "C");
  const l = await 一覧を開く(ctx, n);
  let ある = false, 表示 = 0;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await l.確認を開く(C, "削除"); });
  await step(3, async () => { await l.キャンセルする(C, "削除"); });
  await step(4, async () => { ある = いるか(C); 表示 = await l.行(C).count(); });
  await expected(async () => {
    expect.soft(ある, "大阪システム担当-017 が削除済みにならない（DB に行がある）").toBe(true);
    expect.soft(表示, "メンバー管理一覧画面に引き続き表示される").toBe(1);
  });
});

function 削除する(n: string, 対象: string, 繰り下がる: Record<string, number>, 変わらない: Record<string, number>): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const 基準 = 基準を読む(ctx, n);
    const id = ID(ctx, n, 対象);
    const 前の表示順 = 表示順(id);
    const マスタ前 = マスタの登録内容();
    const l = await 一覧を開く(ctx, n);
    let ある = true, 帯: Awaited<ReturnType<MemberListPage["帯"]>> | null = null;
    const 後: Record<string, number | null> = {};
    await step(1, async () => { await l.開く(); });
    await step(2, async () => {
      const 相手 = 繰り下がる相手を確かめる(id);
      const 想定 = Object.keys(繰り下がる).map((k) => ID(ctx, n, k)).sort();
      expect(相手.sort(), "削除で繰り下がるのはケースのメンバーだけ").toEqual(想定);
      await l.確認を開く(id, "削除");
    });
    await step(3, async () => { await l.実行する(id, "削除"); 帯 = await l.帯(); note(`実行のあとの帯: ${JSON.stringify(帯)}`); });
    await step(4, async () => { ある = いるか(id); for (const k of [...Object.keys(繰り下がる), ...Object.keys(変わらない)]) 後[k] = 表示順(ID(ctx, n, k)); note(`削除のあとの表示順: ${JSON.stringify(後)}`); });
    await expected(async () => {
      並びの読み替え(基準);
      expect.soft(l.一覧画面か(), "メンバー管理一覧画面が再表示される").toBe(true);
      expect.soft(ある, `${名前の(n, 対象)} が削除済み（DB に行が無い。削除前の表示順 ${前の表示順} の行は無い）`).toBe(false);
      for (const [k, v] of Object.entries(繰り下がる)) expect.soft(後[k], `${名前の(n, k)} の表示順が ${v}（基準＋${v}）へ繰り下がる`).toBe(基準 + v);
      for (const [k, v] of Object.entries(変わらない)) expect.soft(後[k], `${名前の(n, k)} の表示順が ${v}（基準＋${v}）のまま`).toBe(基準 + v);
      expect.soft(マスタの登録内容(), "所属・権限・稼働の各マスタが変わらない").toBe(マスタ前);
    });
  };
}
caseTest("IT-M11-01-018", 削除する("018", "C", { A: 4, B: 3 }, { D: 2, E: 1 }));
caseTest("IT-M11-01-040", 削除する("040", "B", {}, { A: 4, C: 3, D: 2, E: 1 }));

caseTest("IT-M11-01-042", async (ctx) => {
  const { step, expected } = ctx;
  const n = "042";
  const C = ID(ctx, n, "C");
  const l = await 一覧を開く(ctx, n);
  let 帯: Awaited<ReturnType<MemberListPage["帯"]>> | null = null, 表示 = 0;
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { 繰り下がる相手を確かめる(C); await l.確認を開く(C, "削除"); });
  await step(3, async () => { await l.実行する(C, "削除"); });
  await step(4, async () => { 帯 = await l.帯(); 表示 = await l.行(C).count(); note(`実行のあとの帯: ${JSON.stringify(帯)}`); });
  await expected(async () => {
    supplement("関連データは、正本の支払方法の代わりに、大阪システム担当-042 が登録したメンバー（東京システム担当-042・大阪店舗担当-042）にした（支払方法は全員の注文画面に出る共有の設定）");
    expect.soft(l.一覧画面か(), "メンバー管理一覧画面が再表示される").toBe(true);
    expect.soft(帯!.誤り.join(" / "), "管理画面上部に削除できない旨").toContain(`関連するデータがあるため「${名前の(n, "C")}」を削除できませんでした`);
    expect.soft(表示, "一覧に「大阪システム担当-042」の行が引き続き表示される").toBe(1);
  });
});

// ---- 2つのブラウザ（相手が先に削除した） ----
function 先に削除されてから押す(n: string, 何: 操作): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const C = ID(ctx, n, "C");
    const l = await 一覧を開く(ctx, n);
    let 応答 = 0, 帯: Awaited<ReturnType<MemberListPage["帯"]>> | null = null;
    const { contextB, listB } = await ブラウザBを開く(ctx, n);
    try {
      await step(1, async () => { await l.開く(); await l.確認を開く(C, 何); });
      await step(2, async () => {
        繰り下がる相手を確かめる(C);
        await listB.開く(); await listB.確認を開く(C, "削除"); await listB.実行する(C, "削除");
        expect(いるか(C), "ブラウザBで大阪システム担当を削除した").toBe(false);
      });
      await step(3, async () => {
        const res = await l.実行する(C, 何);
        応答 = res?.status() ?? 0; 帯 = await l.帯();
        note(`ブラウザAで実行したあとの応答: ${応答}・画面: ${ctx.page.url()}・帯: ${JSON.stringify(帯)}`);
      });
    } finally { await contextB.close(); }
    await expected(async () => {
      if (何 === "削除") {
        expect.soft(応答, "404画面には遷移しない").not.toBe(404);
        expect.soft(l.一覧画面か(), "メンバー管理一覧画面").toBe(true);
        expect.soft(帯!.警告.join(" / "), "削除対象不在の警告").toContain("既に削除されています");
      } else {
        expect.soft(応答, "404画面が表示される").toBe(404);
      }
    });
  };
}
caseTest("IT-M11-01-019", 先に削除されてから押す("019", "削除"));
caseTest("IT-M11-01-020", 先に削除されてから押す("020", "上へ"));
caseTest("IT-M11-01-021", 先に削除されてから押す("021", "下へ"));

// ---- なりすまし対策のトークン ----
function トークンを外して押す(n: string, 何: 操作, 相手: string, 相手の正本: number): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const 基準 = 基準を読む(ctx, n);
    const C = ID(ctx, n, "C");
    const 前 = Object.fromEntries(["A", "B", "C", "D", "E"].map((k) => [k, 表示順(ID(ctx, n, k))]));
    const l = await 一覧を開く(ctx, n);
    let 応答 = 0, ある = false;
    const 後: Record<string, number | null> = {};
    await step(1, async () => { await l.開く(); });
    await step(2, async () => {
      if (何 === "削除") 繰り下がる相手を確かめる(C); else 入れ替えの相手を確かめる(C, 何, ID(ctx, n, 相手));
      await l.確認を開く(C, 何);
    });
    await step(3, async () => {
      const 外した = await l.トークンを取り除く(C, 何);
      note(`開発者ツールの代わりに、実行のリンクのなりすまし対策のトークンの属性をスクリプトで取り除いた（${外した} 個）`);
      expect(外した, "取り除いたトークン").toBe(1);
    });
    await step(4, async () => { const res = await l.実行する(C, 何); 応答 = res?.status() ?? 0; note(`実行したあとの応答: ${応答}・画面: ${ctx.page.url()}`); });
    await step(5, async () => { ある = いるか(C); for (const k of ["A", "B", "C", "D", "E"]) 後[k] = 表示順(ID(ctx, n, k)); });
    await expected(async () => {
      並びの読み替え(基準);
      expect.soft(応答, "アクセス拒否を示す画面（403）").toBe(403);
      if (何 === "削除") {
        expect.soft(ある, "大阪システム担当-022 が削除されない").toBe(true);
        expect.soft(後, "全メンバー（ケースの5人）の表示順が変わらない").toEqual(前);
      } else {
        expect.soft(後.C, `大阪システム担当-${n} の表示順が 3（基準＋3）から変わらない`).toBe(基準 + 3);
        expect.soft(後[相手], `${名前の(n, 相手)} の表示順が ${相手の正本}（基準＋${相手の正本}）から変わらない`).toBe(基準 + 相手の正本);
      }
    });
  };
}
caseTest("IT-M11-01-022", トークンを外して押す("022", "削除", "", 0));
caseTest("IT-M11-01-023", トークンを外して押す("023", "上へ", "B", 4));
caseTest("IT-M11-01-024", トークンを外して押す("024", "下へ", "D", 2));

// ---- 権限グループにゲスト・顧客を選んだ新規登録 ----
function 権限を選んで登録する(n: string, 種類: "ゲスト" | "顧客", 確かめ: "DB" | "画面"): (ctx: CaseCtx) => Promise<void> {
  return async (ctx) => {
    const { step, expected } = ctx;
    const 語 = 種類 === "ゲスト" ? "guest" : "cust";
    const login = ログインID(`m1101-${n}-${語}`);
    const l = await 一覧を開く(ctx, n);
    const e = new MemberEditPage(ctx.page);
    let r: Awaited<ReturnType<MemberEditPage["登録を押す"]>> | null = null;
    let 件数 = -1;
    expect(ログインIDの数(login), `ログインID ${login} のメンバーは未登録`).toBe(0);
    await step(1, async () => { await l.開く(); });
    await step(2, async () => { await l.新規登録を押す(); });
    await step(3, async () => {
      await e.入れる({
        名前: rc(`${種類}権限登録-${n}`), 所属: 所属.東京店, ログインID: login, メールアドレス: `${login}@example.com`,
        パスワード: パスワード(`Pw${n}Ab9`), 権限: 権限[`${種類}権限` as "ゲスト権限" | "顧客権限"], 所属店舗ID: 店舗の("東京店"),
        編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"),
      });
      supplement(`パスワードは正本の値（8文字）がアプリの最低12文字に足りず、その誤りで止まると権限の確かめにならないので、末尾を足した12文字以上の値を入れた。権限グループの「${種類}権限」は開発環境に既にある「${権限[`${種類}権限` as "ゲスト権限" | "顧客権限"]}」（権限のマスタは作らない）。所属「東京店」は ${所属.東京店} の読み替え`);
    });
    await step(4, async () => { r = await e.登録を押す(); note(`登録のあと: ${JSON.stringify(r)}`); });
    await step(5, async () => {
      // 036・037 は DB でログインIDのメンバーを確かめる。038・039 は登録後に表示された画面を確かめる（画面のアドレスを控える）
      件数 = ログインIDの数(login);
      note(`登録後の画面: ${ctx.page.url()}・ログインID ${login} のメンバーの数: ${件数}`);
    });
    await expected(async () => {
      if (確かめ === "DB") {
        expect.soft(件数, `ログインID「m1101-${n}-${語}」のメンバーが登録されない`).toBe(0);
      } else {
        expect.soft(e.path(), "メンバーの編集画面（新規登録の画面）が表示される").toMatch(/\/setting\/system\/member\/new$/);
        await expect.soft(e.名前欄, "メンバーの編集画面の入力欄").toBeVisible();
        expect.soft(r!.誤り.length, "権限グループの入力の誤りが出る").toBeGreaterThan(0);
        expect.soft(ログインIDの数(login), "登録されない").toBe(0);
      }
    });
  };
}
caseTest("IT-M11-01-036", 権限を選んで登録する("036", "ゲスト", "DB"));
caseTest("IT-M11-01-037", 権限を選んで登録する("037", "顧客", "DB"));
caseTest("IT-M11-01-038", 権限を選んで登録する("038", "ゲスト", "画面"));
caseTest("IT-M11-01-039", 権限を選んで登録する("039", "顧客", "画面"));
