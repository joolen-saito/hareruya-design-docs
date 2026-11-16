/** M16-06 買取価格対応表一覧表示。正本: cases/M16-06_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { BuyPriceEditPage } from "../../pages/admin/m16_07_buy_price";
import { BuyPriceListPage, 区分, 状態, 金額を読む } from "../../pages/admin/m16_06_buy_price_list";
import { M1606_ADMIN, 正本の12件, 正本の組 } from "../../seeds/m16-06";

// 買取価格対応表は共有のマスタ。行を足す・消す画面が無いので、「12件だけ」にはせず、既存の NM価格1000・2000 の行を使う（seeds/m16-06.ts）。
// ケースが確かめる組の買取価格だけを、シードが画面で控えてから書き換え、ケースの終わりに基盤（lib/shared_restore.ts）が画面で戻して確かめる（夜に1本だけで流す）。
// 011（0件の一覧）は、共有のマスタを全件消すことになるので書かない。
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 読み替えの注記 = "事前準備の「買取価格対応表を12件だけにする」は、行を消す・足す画面が無く共有のマスタの行を消せないため行わず、既存の NM価格1000・2000 の行で確かめた（一覧にはほかの NM価格の行もある）。識別IDは一覧のリンクが示す既存の値に読み替えた";

caseTest("IT-M16-06-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1606_ADMIN);
  const l = new BuyPriceListPage(page);
  await step(1, async () => { expect(await l.開く(), "買取価格対応表（一覧）の応答").toBe(200); });
  await step(2, async () => {
    await l.NM価格の行の要素(1000).scrollIntoViewIfNeeded();
  });
  note(読み替えの注記);
  await expected(async () => {
    expect.soft(await l.一段目の見出し(), "1段目の見出し（NM価格・ノーマルカード・Foil&プロモ版カード）").toEqual(["NM価格", "ノーマルカード", "Foil&プロモ版カード"]);
    expect.soft(await l.二段目の見出し(), "2段目の見出し（カード状態。ノーマルカード・Foil&プロモ版カードの順）").toEqual(["SP", "MP", "HP", "SP", "MP", "HP"]);
    for (const nm of [1000, 2000]) {
      const rows = await l.NM価格の行だけを読む(nm);
      expect.soft(rows.length, `NM価格${nm}の行の数（1行にまとめられている）`).toBe(1);
      await expect.soft(l.NM価格の行の要素(nm), `NM価格${nm}の行`).toHaveCount(1);
      if (rows.length !== 1) continue;
      for (const k of 正本の12件.filter((x) => x.NM価格 === nm)) {
        const c = rows[0].欄.find((x) => x.区分 === k.区分 && x.状態 === k.状態);
        expect.soft(c?.金額 ?? null, `NM価格${nm}の行の${k.区分}カード・${k.状態}の列の買取価格`).toBe(k.買取価格);
      }
      expect.soft(rows[0].欄.length, `NM価格${nm}の行の買取価格の列の数`).toBe(6);
    }
  });
});

caseTest("IT-M16-06-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1606_ADMIN);
  const l = new BuyPriceListPage(page);
  await step(1, async () => { expect(await l.開く(), "買取価格対応表（一覧）の応答").toBe(200); });
  let 入力 = -1, 絞り込み = -1, ページ送り = -1;
  await step(2, async () => {
    入力 = await l.本文の入力部品の数();
    絞り込み = await l.本文の絞り込みの数();
    ページ送り = await l.ページ送りの数();
  });
  note(読み替えの注記);
  note("「12件の買取価格が2行にまとめて同一画面に表示される」は、NM価格1000・2000 の行がそれぞれ1行で、その2行に正本の12件の買取価格が出ていること（ページ送りなしの1画面）で確かめた");
  await expected(async () => {
    expect.soft(入力, "画面の中身にある入力項目（入力欄・選ぶ欄・ボタン）の数").toBe(0);
    expect.soft(絞り込み, "画面の中身にある絞り込み操作部（検索のフォーム）の数").toBe(0);
    expect.soft(ページ送り, "ページ送り操作部（ページ番号・表示件数）の数").toBe(0);
    const rows = [...await l.NM価格の行だけを読む(1000), ...await l.NM価格の行だけを読む(2000)];
    expect.soft(rows.length, "正本の12件が出る行（NM価格1000・2000）の数").toBe(2);
    const 出ている = rows.flatMap((r) => r.欄.filter((c) => c.リンク).map((c) => `${r.NM価格}/${c.区分}/${c.状態}/${c.金額}`)).sort();
    const 正本 = 正本の12件.map((k) => `${k.NM価格}/${k.区分}/${k.状態}/${k.買取価格}`).sort();
    expect.soft(出ている, "2行に出ている買取価格（NM価格/区分/状態/買取価格）が正本の12件").toEqual(正本);
  });
});

caseTest("IT-M16-06-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1606_ADMIN);
  const l = new BuyPriceListPage(page);
  await step(1, async () => { expect(await l.開く(), "買取価格対応表（一覧）の応答").toBe(200); });
  await step(2, async () => { await l.NM価格の行の要素(1000).scrollIntoViewIfNeeded(); });
  note(読み替えの注記);
  await expected(async () => {
    const row = l.NM価格の行の要素(1000);
    await expect(row, "NM価格1000の行").toHaveCount(1);
    const cell = row.locator("td").first();
    expect.soft(金額を読む(await cell.innerText()), "NM価格1000の行の価格部分の金額").toBe(1000);
    await expect.soft(cell.locator("a"), "NM価格1000の価格部分の中のリンク（買取価格対応修正へのリンクが無い）").toHaveCount(0);
  });
});

/** 005〜010: NM価格1000 の行の、区分・状態の組の買取価格を押して、買取価格対応修正（編集）画面の表示を見る */
function リンクを押す(区: 区分, 状: 状態, foil: "YES" | "NO"): (ctx: CaseCtx) => Promise<void> {
  return async ({ page, step, expected }) => {
    await loginAdmin(page, M1606_ADMIN);
    const l = new BuyPriceListPage(page);
    const 正本 = 正本の組(1000, 区, 状);
    let 押した識別ID = "";
    await step(1, async () => { expect(await l.開く(), "買取価格対応表（一覧）の応答").toBe(200); });
    await step(2, async () => {
      const c = await l.欄を読む(1000, 区, 状);
      expect(c.金額, `NM価格1000の行の${区}カード・${状}の買取価格（押す前）`).toBe(正本.買取価格);
      押した識別ID = c.識別ID ?? "";
      const link = await l.価格のリンク(1000, 区, 状);
      await expect(link, `NM価格1000の行の${区}カード・${状}の買取価格のリンク`).toHaveCount(1);
      await Promise.all([page.waitForURL(/\/data\/buy_price_list\/\d+\/edit/, { timeout: 120_000}), link.click({ noWaitAfter: true })]);
      await page.waitForLoadState("load");
    });
    note(読み替えの注記);
    await expected(async () => {
      const e = new BuyPriceEditPage(page);
      expect.soft(new URL(page.url()).pathname, "遷移した画面（買取価格対応修正）のアドレス").toMatch(new RegExp(`/data/buy_price_list/${押した識別ID}/edit$`));
      await expect.soft(e.買取価格欄, "買取価格の入力欄").toBeVisible();
      // 欄ごとに、その欄だけを読んで確かめる（赤枠と番号の札が、確かめた欄に付く）
      const セル = (i: number) => e.表示項目のセル.nth(i);
      const 文 = async (i: number) => ((await セル(i).innerText()) ?? "").replace(/\s+/g, " ").trim();
      expect.soft(金額を読む(await 文(0)), "NM価格").toBe(1000);
      expect.soft(await 文(1), "カード状態").toBe(状);
      expect.soft(await 文(2), "Foil or Promotion Card?").toBe(foil);
      expect.soft(await e.買取価格(), "買取価格").toBe(String(正本.買取価格));
    });
  };
}

caseTest("IT-M16-06-005", リンクを押す("ノーマル", "SP", "NO"));
caseTest("IT-M16-06-006", リンクを押す("ノーマル", "MP", "NO"));
caseTest("IT-M16-06-007", リンクを押す("ノーマル", "HP", "NO"));
caseTest("IT-M16-06-008", リンクを押す("Foil&プロモ", "SP", "YES"));
caseTest("IT-M16-06-009", リンクを押す("Foil&プロモ", "MP", "YES"));
caseTest("IT-M16-06-010", リンクを押す("Foil&プロモ", "HP", "YES"));
