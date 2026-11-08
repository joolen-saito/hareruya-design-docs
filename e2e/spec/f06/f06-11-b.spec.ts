/**
 * F06-11 買取履歴一覧（-b）。正本: cases/F06-11_test_cases.tsv
 * 実装するのは、画面だけで用意できるシードのケース（002・007・020・021・024・028〜034・037・048・049・052・053）。
 * 依頼日をDBで直接設定する手順（OWNERS・ADMINCANCEL）は行わず、依頼日は申込みの日になる。これらのケースは依頼日を確かめない。
 * 記録 review/F06-11_progress_2026-11-07.md
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { PurchaseHistoryPageB } from "../../pages/front/f06_11_purchase_history_b";
import { mailOf } from "../../seeds/f06-11-b";

const 依頼日の補い = () => test.info().annotations.push({ type: "正本の外の補い", description: "シード表が依頼日をDBで直接設定する手順は行わなかった（依頼日は申込みの日になる）。このケースは依頼日を確かめない" });

const 一覧を開く = (前半: string, パスワード: string) => async (h: PurchaseHistoryPageB, step: CaseCtx["step"]) => {
  await step(1, async () => { await h.ログインする(mailOf(前半), パスワード); });
  await step(2, async () => { await h.履歴一覧を開く(); });
};

// ---- 会員別の抽出・店舗・遷移（OWNERS） ----
const A = ["f0611-a", "F0611PwdOwnersA"] as const;

caseTest("IT-F06-11-002", async ({ page, notes, step, expected }) => {
  依頼日の補い();
  const h = new PurchaseHistoryPageB(page);
  await 一覧を開く(...A)(h, step);
  await expected(async () => {
    const 並び = await h.買取番号の並び();
    expect.soft(並び, "会員Aのネット買取番号が表示される").toContain(notes.get("〔買取番号-F0611-共有A〕"));
    expect.soft(並び, "会員Aの店頭買取番号が表示される").toContain(notes.get("〔買取番号-F0611-共有B〕"));
    expect.soft(並び, "会員Bの買取番号は表示されない").not.toContain(notes.get("〔買取番号-F0611-共有C〕"));
  });
});

caseTest("IT-F06-11-007", async ({ page, notes, step, expected }) => {
  依頼日の補い();
  const h = new PurchaseHistoryPageB(page);
  await 一覧を開く(...A)(h, step);
  const 店: Record<string, string> = {};
  await step(3, async () => {
    for (const k of ["共有A", "共有B"]) { const 番号 = notes.get(`〔買取番号-F0611-${k}〕`); 店[k] = await h.行の項目(番号, "店舗"); }
  });
  await expected(async () => {
    expect.soft(店["共有A"], "ネット買取の買取店舗").toBe("オンラインショップ");
    expect.soft(店["共有B"], "店頭買取の買取店舗").toBe("晴れる屋テスト店");
  });
});

caseTest("IT-F06-11-020", async ({ page, notes, step, expected }) => {
  依頼日の補い();
  const h = new PurchaseHistoryPageB(page);
  const 番号 = () => notes.get("〔買取番号-F0611-共有A〕");
  await 一覧を開く(...A)(h, step);
  await step(3, async () => { await h.押して遷移する(h.買取番号のリンク(番号())); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（ネット買取の買取履歴詳細）").toMatch(new RegExp(`^/ja/mypage/purchase_history/net/${Number(番号())}$`));
    expect.soft(await h.詳細の買取番号(), "詳細画面の買取番号").toBe(番号());
  });
});

caseTest("IT-F06-11-021", async ({ page, notes, step, expected }) => {
  依頼日の補い();
  const h = new PurchaseHistoryPageB(page);
  const 番号 = () => notes.get("〔買取番号-F0611-共有B〕");
  await 一覧を開く(...A)(h, step);
  await step(3, async () => { await h.押して遷移する(h.詳細を見るボタン(番号())); });
  await expected(async () => {
    expect.soft(h.path, "遷移した画面（店頭買取の買取履歴詳細）").toMatch(/^\/ja\/mypage\/purchase_history\/otc\/\d+$/);
    expect.soft(await h.詳細の買取番号(), "詳細画面の買取番号").toBe(番号());
  });
});

// ---- 管理者取消 ----
caseTest("IT-F06-11-024", async ({ page, notes, step, expected }) => {
  依頼日の補い();
  const h = new PurchaseHistoryPageB(page);
  await 一覧を開く("f0611-024", "F0611PwdCase024")(h, step);
  await step(3, async () => { await h.履歴一覧画面である(); });
  await expected(async () => {
    const 並び = await h.買取番号の並び();
    expect.soft(並び, "査定前の買取番号が表示される").toContain(notes.get("〔買取番号-F0611-024A〕"));
    expect.soft(並び, "管理者取消の買取番号は表示されない").not.toContain(notes.get("〔買取番号-F0611-024B〕"));
  });
});

// ---- ページ送り ----
function 先頭ページで(n: string, 位置: "上部" | "下部") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryPageB(page);
    await step(1, async () => { await h.ログインする(mailOf(`f0611-${n}`), `F0611PwdCase${n}`); });
    await step(2, async () => { await h.履歴一覧を開く(); });
    await step(3, async () => { await h.ページ送り(位置).first().waitFor({ state: "visible" }); });
    await expected(async () => {
      expect.soft(await h.ページ番号のリンク(位置, 2).count(), "（前提）ページ送りに2ページ目のリンクがある").toBe(1);
      expect.soft(await h.ページ送りのリンク(位置, "最初").count(), `画面${位置}のページ送りの「最初」のリンクの数`).toBe(0);
    });
  };
}
function 最終ページで(n: string, 位置: "上部" | "下部") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryPageB(page);
    await step(1, async () => { await h.ログインする(mailOf(`f0611-${n}`), `F0611PwdCase${n}`); });
    await step(2, async () => { await h.履歴一覧を開く(); });
    await step(3, async () => { await h.押して遷移する(h.ページ番号のリンク(位置, 2)); });
    await step(4, async () => { await h.ページ送り(位置).first().waitFor({ state: "visible" }); });
    await expected(async () => {
      expect.soft(h.page.url(), "2ページ目を開いている").toMatch(/page=2/);
      expect.soft(await h.ページ送りのリンク(位置, "最後").count(), `最終ページの画面${位置}のページ送りの「最後」のリンクの数`).toBe(0);
    });
  };
}
caseTest("IT-F06-11-028", 先頭ページで("028", "上部"));
caseTest("IT-F06-11-029", 最終ページで("029", "上部"));
caseTest("IT-F06-11-030", 先頭ページで("030", "下部"));
caseTest("IT-F06-11-031", 最終ページで("031", "下部"));

caseTest("IT-F06-11-037", async ({ page, step, expected }) => {
  const h = new PurchaseHistoryPageB(page);
  await step(1, async () => { await h.ログインする(mailOf("f0611-037"), "F0611PwdCase037"); });
  await step(2, async () => { await h.履歴一覧を開く(); });
  await step(3, async () => { await expect(h.履歴の行.first(), "買取履歴の行が表示されている").toBeVisible({ timeout: 30_000 }); });
  await expected(async () => {
    expect.soft(await h.履歴の行.count(), "（前提）1ページに表示された買取履歴の行の数").toBe(5);
    expect.soft(await h.ページ送りのリンク("上部", "最初").count(), "画面上部のページ送りの「最初」のリンクの数").toBe(0);
    expect.soft(await h.ページ送りのリンク("上部", "最後").count(), "画面上部のページ送りの「最後」のリンクの数").toBe(0);
  });
});

// ---- 店頭買取・買取依頼内容 ----
caseTest("IT-F06-11-032", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryPageB(page);
  const 番号 = () => notes.get("〔買取番号-F0611-032〕");
  await 一覧を開く("f0611-032", "F0611PwdCase032")(h, step);
  let 内容 = "";
  await step(3, async () => { 内容 = await h.行の項目(番号(), "依頼内容"); });
  await expected(async () => {
    expect.soft(内容, "買取依頼内容欄に「えらんで買取」の文言が表示されない").not.toContain("えらんで買取");
    expect.soft(内容, "買取依頼内容欄に「まとめて買取」の文言が表示されない").not.toContain("まとめて買取");
  });
});

caseTest("IT-F06-11-033", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryPageB(page);
  const 番号 = () => notes.get("〔買取番号-F0611-033〕");
  await 一覧を開く("f0611-033", "F0611PwdCase033")(h, step);
  let 内容 = "";
  await step(3, async () => { 内容 = await h.行の項目(番号(), "依頼内容"); });
  await expected(async () => {
    expect.soft(内容, "買取依頼内容に「えらんで買取」").toContain("えらんで買取");
    expect.soft(内容, "買取依頼内容に選んだ商品の名前").toContain(notes.get("〔商品名-F0611-033〕"));
    expect.soft(内容, "「ほか」の表示がない").not.toContain("ほか");
  });
});

caseTest("IT-F06-11-034", async ({ page, notes, step, expected }) => {
  const h = new PurchaseHistoryPageB(page);
  const 番号 = () => notes.get("〔買取番号-F0611-034〕");
  await 一覧を開く("f0611-034", "F0611PwdCase034")(h, step);
  let 内容 = "";
  await step(3, async () => { 内容 = await h.行の項目(番号(), "依頼内容"); });
  await expected(async () => {
    expect.soft(内容, "（前提）買取依頼内容に「えらんで買取」").toContain("えらんで買取");
    expect.soft(内容, "買取依頼内容に「まとめて買取：」が表示されない").not.toMatch(/まとめて買取\s*[:：]/);
    expect.soft(内容, "買取依頼内容に「まとめて買取」の文言が表示されない").not.toContain("まとめて買取");
  });
});

// ---- 並び順 ----
function 並びの確認(n: string, 前半: string, パスワード: string, 期待: ("A" | "B")[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const h = new PurchaseHistoryPageB(page);
    await step(1, async () => { await h.ログインする(mailOf(前半), パスワード); });
    await step(2, async () => { await h.履歴一覧を開く(); });
    let 並び: string[] = [];
    await step(3, async () => { await expect(h.履歴の行.first(), "買取履歴の行が表示されている").toBeVisible({ timeout: 30_000 }); 並び = await h.買取番号の並び(); });
    await expected(async () => {
      const 期待の並び = 期待.map((k) => notes.get(`〔買取番号-F0611-${n}${k}〕`));
      expect.soft(並び, `買取番号の並び（上から ${期待.join("、")} の順）`).toEqual(期待の並び);
    });
  };
}
caseTest("IT-F06-11-048", 並びの確認("048", "cbf0611-048", "Passw0rd-CBF0611048", ["A", "B"]));
caseTest("IT-F06-11-049", 並びの確認("049", "cbf0611-049", "Passw0rd-CBF0611049", ["B", "A"]));
caseTest("IT-F06-11-052", 並びの確認("052", "cbf0611-052", "Passw0rd-CBF0611052", ["A", "B"]));
caseTest("IT-F06-11-053", 並びの確認("053", "cbf0611-053", "Passw0rd-CBF0611053", ["B", "A"]));

