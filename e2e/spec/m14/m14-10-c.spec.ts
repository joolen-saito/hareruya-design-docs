/** M14-10 フォーマット詳細(登録・編集・削除)の続き（登録・更新・削除）。正本: cases/M14-10_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { カード名日のリーガリティ, フォーマットの指定数, フォーマットの値, 名日のフォーマット, 統率の枚数 } from "../../db/m14_10_format";
import { 欄, 削除を実行する, 新規画面を開く, 編集画面を開く, 入力する, 登録を押す } from "../../pages/admin/m14_10_format";
import { M1410_ADMIN } from "../../seeds/m14-10";
import "../../seeds/m14-10-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 空 = (x: string | null | undefined) => (x ?? "") === "";
const IDから = (url: string) => /\/format\/(\d+)\/edit/.exec(url)?.[1] ?? "";

// ---------------------------------------------------------------------------
// 登録
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const 名日 = rc("結合形式A");
  let r = { sent: false, url: "", status: 0 };
  let 件数 = -1;
  let v: ReturnType<typeof フォーマットの値> = null;
  let 統率: ReturnType<typeof 統率の枚数> = null;
  await step(1, async () => { await 新規画面を開く(page); });
  await step(2, async () => {
    await 入力する(page, { 名日, 名英: rc("Integration Format A"), コード: "IT_FMT-A", 並び順: "200", メイン上限: "60", メイン下限: "40", サイド上限: "15", サイド下限: "0", メタ日数: "30", ルール日: "結合試験ルール", ルール英: "Integration test rule" });
  });
  await step(3, async () => {
    await 入力する(page, { 認定: "M14-10試験認定", チェック: { searchFlg: true, productSearchFlg: true, rankingFlg: true, OtherMetaFlg: true, ArenaLegalFlg: true, IncludeBasicFlg: true, DeckbuilderFlg: true, isShownInEvent: true, useCommandFlg: true, commanderInMain: true, HighlanderFlg: true } });
    await 入力する(page, { 統率上限: "2", 統率下限: "1" });
  });
  await step(4, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { const l = 名日のフォーマット(名日); 件数 = l.length; v = l[0] ?? null; 統率 = v ? 統率の枚数(v.フォーマットID) : null; });
  await expected(async () => {
    expect.soft(件数, "「結合形式A」のフォーマット数").toBe(1);
    expect.soft([v?.名英, v?.コード, v?.並び順], "フォーマット名(英)・フォーマットコード・並び順").toEqual([rc("Integration Format A"), "IT_FMT-A", "200"]);
    expect.soft([v?.メイン上限, v?.メイン下限, v?.サイド上限, v?.サイド下限, v?.メタ日数], "メイン上限・下限、サイド上限・下限、メタゲーム分析日数").toEqual(["60", "40", "15", "0", "30"]);
    expect.soft([v?.ルール日, v?.ルール英, v?.認定], "ルール説明(日)・(英)・認定").toEqual(["結合試験ルール", "Integration test rule", "M14-10試験認定"]);
    expect.soft([v?.検索, v?.商品検索, v?.ランキング, v?.メタ簡易, v?.アリーナ, v?.基本土地算入, v?.デッキビルダー, v?.イベント表示, v?.統率使用, v?.一枚まで], "選択項目（すべて選択）").toEqual(Array(10).fill(true));
    expect.soft([統率?.上限, 統率?.下限], "統率上限枚数・統率下限枚数").toEqual(["2", "1"]);
  });
});

caseTest("IT-M14-10-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const 名日 = rc("任意空フォーマット");
  let r = { sent: false, url: "", status: 0 };
  let v: ReturnType<typeof フォーマットの値> = null;
  let 件数 = -1;
  await step(1, async () => { await 新規画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日, 名英: rc("Optional Empty Format"), 並び順: "220" }); });
  await step(3, async () => { await 入力する(page, { コード: "", メイン上限: "", メイン下限: "", サイド上限: "", サイド下限: "", ルール日: "", ルール英: "", 認定: "" }); });
  await step(4, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { const l = 名日のフォーマット(名日); 件数 = l.length; v = l[0] ?? null; });
  await expected(async () => {
    expect.soft(件数, "「任意空フォーマット」のフォーマット数").toBe(1);
    expect.soft([v?.名英, v?.並び順, v?.メタ日数], "必須項目（名称・英語名・並び順・メタゲーム分析日数14）").toEqual([rc("Optional Empty Format"), "220", "14"]);
    expect.soft([空(v?.コード), 空(v?.メイン上限), 空(v?.メイン下限), 空(v?.サイド上限), 空(v?.サイド下限), 空(v?.ルール日), 空(v?.ルール英), 空(v?.認定)], "任意項目がすべて空").toEqual(Array(8).fill(true));
  });
});

caseTest("IT-M14-10-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const 名日 = rc("トークン欠落形式");
  let r = { sent: false, url: "", status: 0 };
  let 件数 = -1;
  await step(1, async () => { await 新規画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日, 名英: rc("Missing Token Format"), 並び順: "230" }); });
  await step(3, async () => { await page.evaluate(() => { document.querySelector('input[name="admin_format[_token]"]')?.remove(); }); });
  await step(4, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(5, async () => { 件数 = 名日のフォーマット(名日).length; });
  await expected(async () => {
    expect.soft(r.sent, "登録要求が送信された").toBe(true);
    expect.soft(r.status, "登録要求への応答").toBe(403);
    expect.soft(件数, "「トークン欠落形式」のフォーマット数").toBe(0);
  });
});

caseTest("IT-M14-10-073", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const 名日 = rc("登録通過形式-M1410CB073");
  let r = { sent: false, url: "", status: 0 };
  let 件数 = -1;
  await step(1, async () => { await 新規画面を開く(page); });
  await step(2, async () => { await 入力する(page, { 名日, 名英: rc("Reg Pass M1410CB073"), 並び順: "70", メタ日数: "14" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 件数 = 名日のフォーマット(名日).length; });
  await expected(async () => {
    expect.soft(IDから(page.url()), "登録後の編集画面のフォーマットID").toMatch(/^\d+$/);
    expect.soft(await 欄(page, "nameJp").inputValue().catch(() => ""), "表示されたフォーマット名(日)").toBe(名日);
    expect.soft(件数, "フォーマット名(日)が一致するフォーマットの数").toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 更新
// ---------------------------------------------------------------------------

caseTest("IT-M14-10-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-041〕");
  let 前: ReturnType<typeof 統率の枚数> = null;
  let 後: ReturnType<typeof 統率の枚数> = null;
  let r = { sent: false, url: "", status: 0 };
  await step(1, async () => { await 編集画面を開く(page, id); 前 = 統率の枚数(id); });
  await step(2, async () => { await 入力する(page, { チェック: { useCommandFlg: false } }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 後 = 統率の枚数(id); });
  await expected(async () => {
    expect.soft([前?.上限, 前?.下限], "更新前: 統率上限枚数・統率下限枚数").toEqual(["2", "1"]);
    expect.soft(後, "更新後: 統率の上限・下限の保存（削除されている）").toBeNull();
  });
});

caseTest("IT-M14-10-071", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-071〕");
  let r = { sent: false, url: "", status: 0 };
  let 後: ReturnType<typeof 統率の枚数> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { チェック: { useCommandFlg: true }, 統率上限: "6", 統率下限: "3" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 後 = 統率の枚数(id); });
  await expected(async () => { expect.soft([後?.上限, 後?.下限], "統率上限枚数・統率下限枚数").toEqual(["6", "3"]); });
});

caseTest("IT-M14-10-072", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-072〕");
  let r = { sent: false, url: "", status: 0 };
  let 後: ReturnType<typeof 統率の枚数> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { ルール日: "統率なし更新後-M1410CB072" }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { 後 = 統率の枚数(id); });
  await expected(async () => { expect.soft(後, "統率上限枚数・統率下限枚数の保存（保存されていない）").toBeNull(); });
});

caseTest("IT-M14-10-074", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-074〕");
  const 新 = rc("更新後形式-M1410CB074");
  let r = { sent: false, url: "", status: 0 };
  let v: ReturnType<typeof フォーマットの値> = null;
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await 入力する(page, { 名日: 新 }); });
  await step(3, async () => { r = await 登録を押す(page); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await step(4, async () => { v = フォーマットの値(id); });
  await expected(async () => {
    expect.soft(IDから(page.url()), "更新後に表示された編集画面のフォーマットID").toBe(id);
    expect.soft(v?.名日, "フォーマット名(日)").toBe(新);
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------

/** 「画面を開く → 削除ボタン → ポップアップで実行 →（DBで確かめる）」の型。トークンを書き換えるケースは、書き換えの手順が1つ増える */
function 削除ケース(n: string, o: {
  トークン?: string; DBなし?: boolean;
  確かめ: (ctx: { id: string; 結果: { status: number; url: string }; v: ReturnType<typeof フォーマットの値>; 指定数: number }) => void;
}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1410_ADMIN);
    const id = notes.get(`〔フォーマットID-M1410-${n}〕`);
    let 結果 = { status: 0, url: "" };
    let v: ReturnType<typeof フォーマットの値> = null;
    let 指定数 = -1;
    const 実行 = async () => {
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
        page.locator("#DeleteModal [data-method=delete]").click({ timeout: 20_000 }),
      ]);
      await page.waitForLoadState("load").catch(() => undefined);
      結果 = { status: res?.status() ?? 0, url: page.url() };
    };
    const 読む = () => { v = フォーマットの値(id); 指定数 = フォーマットの指定数(id); };
    await step(1, async () => { await 編集画面を開く(page, id); });
    await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
    let 次 = 3;
    if (o.トークン !== undefined) {
      await step(次++, async () => { await page.locator("#DeleteModal [data-method=delete]").evaluate((a, t) => a.setAttribute("token-for-anchor", t), o.トークン!); });
    }
    await step(次++, async () => { await 実行(); });
    if (!o.DBなし) await step(次++, async () => { 読む(); });
    await expected(async () => {
      expect.soft(結果.status, "削除要求への応答があった（要求が送られた）").not.toBe(0);
      o.確かめ({ id, 結果, v, 指定数 });
    });
  };
}
void 削除を実行する;

caseTest("IT-M14-10-043", 削除ケース("043", {
  トークン: "invalid-token",
  確かめ: ({ 結果, v, 指定数 }) => {
    expect.soft(結果.status, "削除要求への応答").toBe(403);
    expect.soft(v?.削除済み, "フォーマットが削除されている").toBe(false);
    expect.soft(指定数, "カードごとの禁止・制限の指定の数（2件のまま）").toBe(2);
  },
}));
caseTest("IT-M14-10-046", 削除ケース("046", { 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "大会が紐づくフォーマットが残っている").toBe(true); } }));
caseTest("IT-M14-10-048", 削除ケース("048", { 確かめ: ({ v }) => { expect.soft(v !== null && !v.削除済み, "アーキタイプが紐づくフォーマットが残っている").toBe(true); } }));
caseTest("IT-M14-10-049", 削除ケース("049", {
  確かめ: ({ id, 結果 }) => { expect.soft(IDから(結果.url), "戻った画面のフォーマットID（フォーマット新規登録・編集画面）").toBe(id); },
  DBなし: true,
}));
caseTest("IT-M14-10-050", 削除ケース("050", {
  確かめ: ({ v, 指定数 }) => {
    expect.soft(v === null || v.削除済み, "フォーマットが削除されている").toBe(true);
    expect.soft(指定数, "カードごとの禁止・制限の指定の数").toBe(0);
  },
}));
caseTest("IT-M14-10-051", 削除ケース("051", {
  確かめ: ({ 結果 }) => { expect.soft(new URL(結果.url).pathname, "遷移先の画面（カードセット一覧）").toMatch(/\/cardset(\/page\/\d+)?$/); },
  DBなし: true,
}));
caseTest("IT-M14-10-068", 削除ケース("068", {
  確かめ: ({ 結果, v }) => {
    expect.soft(結果.status, "削除要求への応答（エラーでない）").toBeLessThan(400);
    expect.soft(v === null || v.削除済み, "フォーマットが削除されている").toBe(true);
  },
}));
caseTest("IT-M14-10-069", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-069A〕");
  let 指定: string[] = [];
  await step(1, async () => { await 編集画面を開く(page, id); });
  await step(2, async () => { await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 }); });
  await step(3, async () => {
    await Promise.all([
      page.waitForResponse((r) => r.request().isNavigationRequest() && r.request().method() !== "GET", { timeout: 30_000 }).catch(() => null),
      page.locator("#DeleteModal [data-method=delete]").click({ timeout: 20_000 }),
    ]);
    await page.waitForLoadState("load").catch(() => undefined);
  });
  await step(4, async () => { 指定 = カード名日のリーガリティ(rc("共通指定カード-069")); });
  await expected(async () => {
    expect.soft(指定.filter((x) => x.startsWith(`${rc("削除対象形式-069")}:`)), "「削除対象形式-069」に対する禁止の指定（無くなる）").toEqual([]);
    expect.soft(指定.filter((x) => x.startsWith(`${rc("残存形式-069")}:`)), "「残存形式-069」に対する制限の指定（残る）").toEqual([`${rc("残存形式-069")}:Restriction`]);
  });
});
void (null as unknown as Page);
