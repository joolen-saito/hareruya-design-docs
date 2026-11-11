/** F01-02 支店ECTOP（SALE中の商品・タイルの商品カード: 上限・カード言語・状態・SALEラベル・Foil・画像の拡大・スライド・表示対象）。正本: cases/F01-02_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage, 画面幅 } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import { タイルのタグ名 } from "../../seeds/f01-02-tile";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const 空白なし = (s: string) => s.replace(/\s+/g, "");

/** 商品詳細へ移ったか（支店URL配下の /products/detail/<商品ID>） */
async function 押して商品詳細へ(page: Page, target: Locator): Promise<void> {
  await Promise.all([page.waitForURL(/\/products\/detail\/\d+/, { timeout: 30_000 }).catch(() => undefined), target.click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
}

caseTest("IT-F01-02-020", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const 名前 = Array.from({ length: 31 }, (_, i) => rc(`SALE上限商品${String(i + 1).padStart(2, "0")}-020`));
  let 全部 = -1; let 自分の = -1;
  await step(1, async () => { await top.open(支店URL("020")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.SALE中, "SALE中の商品の区画").toHaveCount(1, { timeout: 30_000 });
    全部 = await top.SALE中の商品().count();
    const texts = await top.SALE中の商品().locator(".p-hareruya-product-card__name-text").allInnerTexts();
    自分の = 名前.filter((n) => texts.some((t) => t.includes(n))).length;
  });
  await expected(async () => {
    expect.soft(全部, "SALE中の商品に表示された商品数").toBe(30);
    expect.soft(自分の, "SALE上限商品01〜31-020 のうち表示された数（31番目は出ない）").toBe(30);
  });
});

caseTest("IT-F01-02-022", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const A = () => top.SALE中の商品(rc("セール基準商品-022")).first();
  const B = () => top.SALE中の商品(rc("セール非カード商品-022")).first();
  const v = { A言語: "", A状態: "", B言語: -1, B状態: -1 };
  await step(1, async () => { await top.open(支店URL("022")); await top.開いている(); });
  await step(2, async () => {
    await expect(A(), "カード商品「セール基準商品-022」").toBeVisible({ timeout: 30_000 });
    await expect(B(), "非カード商品「セール非カード商品-022」").toBeVisible({ timeout: 30_000 });
    v.A言語 = ((await BranchTopPage.カード言語(A()).first().textContent({ timeout: 10_000 }).catch(() => "")) ?? "").trim();
    v.A状態 = ((await BranchTopPage.カードの状態(A()).first().textContent({ timeout: 10_000 }).catch(() => "")) ?? "").trim();
    v.B言語 = await BranchTopPage.カード言語(B()).count();
    v.B状態 = await BranchTopPage.カードの状態(B()).count();
  });
  await expected(async () => {
    note("カード商品は、開発環境にある既存のカードを商品に指定して作った（シード作成時の問題）");
    expect.soft(v.A言語, "カード商品の言語コード").toBe("JP");
    expect.soft(v.A状態, "カード商品の状態").toBe("NM");
    expect.soft(v.B言語, "非カード商品の言語コードの表示の数").toBe(0);
    expect.soft(v.B状態, "非カード商品の状態の表示の数").toBe(0);
  });
});

caseTest("IT-F01-02-029", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const A = () => top.SALE中の商品(rc("セール基準商品-029")).first();
  const B = () => top.タイルの商品(タイルのタグ名("SALEラベル確認タイル-029"), rc("セールフラグOFF商品-029")).first();
  let a = -1; let b = -1;
  await step(1, async () => { await top.open(支店URL("029")); await top.開いている(); });
  await step(2, async () => {
    await expect(A(), "SALE中の商品の「セール基準商品-029」").toBeVisible({ timeout: 30_000 });
    await expect(B(), "タイルの「セールフラグOFF商品-029」").toBeVisible({ timeout: 30_000 });
    a = await BranchTopPage.SALEラベル(A()).count();
    b = await BranchTopPage.SALEラベル(B()).count();
  });
  await expected(async () => {
    note("「セールフラグOFF商品-029」は週間販売数（集計のバッチ）の代わりに、タイル（タグ「SALEラベル確認タイル-029」）で支店ECTOPに出した（シード作成時の問題）");
    expect.soft(a, "セールフラグ1の「セール基準商品-029」のSALE表示の数").toBe(1);
    expect.soft(b, "セールフラグ0の「セールフラグOFF商品-029」のSALE表示の数").toBe(0);
  });
});

/** カード言語を押して商品詳細へ（SALE中の商品・タイル） */
function カード言語を押す(n: string, 置き場: "SALE" | string, 商品名: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const top = new BranchTopPage(page);
    const card = () => (置き場 === "SALE" ? top.SALE中の商品(rc(商品名)) : top.タイルの商品(タイルのタグ名(置き場), rc(商品名))).first();
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); await expect(card(), `「${商品名}」のカード`).toBeVisible({ timeout: 30_000 }); });
    await step(2, async () => { await 押して商品詳細へ(page, BranchTopPage.カード言語(card()).first()); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "遷移先（商品詳細画面）").toMatch(new RegExp(`/products/detail/${notes.get(`〔商品ID-F0102-${n}〕`)}$`));
    });
  };
}
caseTest("IT-F01-02-031", カード言語を押す("031", "SALE", "セール基準商品-031"));
caseTest("IT-F01-02-051", カード言語を押す("051", "テストタイルA-051", "テストタイル商品-051"));

caseTest("IT-F01-02-038", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("テストタイルA");
  let A = -1; let B = -1;
  await step(1, async () => { await top.open(支店URL("038")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル(タグ名).first(), "タイル「テストタイルA」").toBeVisible({ timeout: 30_000 }).catch(() => note("タイル「テストタイルA」が支店ECTOPに見つからなかった"));
    A = await top.タイルの商品(タグ名, rc("タイル表示対象商品")).count();
    B = await top.タイルの商品(タグ名, rc("タイル表示対象外商品")).count();
  });
  await expected(async () => {
    expect.soft(A > 0, "表示対象の「タイル表示対象商品」の表示").toBe(true);
    expect.soft(B, "表示対象でない「タイル表示対象外商品」の表示数").toBe(0);
  });
});

caseTest("IT-F01-02-050", async ({ page, notes, step, expected }) => {
  const top = new BranchTopPage(page);
  const card = () => top.タイルの商品(タイルのタグ名("テストタイルA-050"), rc("テストタイル商品-050")).first();
  await step(1, async () => { await top.open(支店URL("050")); await top.開いている(); await expect(card(), "「テストタイル商品-050」のカード").toBeVisible({ timeout: 30_000 }); });
  await step(2, async () => { await 押して商品詳細へ(page, BranchTopPage.商品画像の押せるところ(card())); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先（商品詳細画面）").toMatch(new RegExp(`/products/detail/${notes.get("〔商品ID-F0102-050〕")}$`));
  });
});

/** 商品画像の拡大（押す場所: 画像そのもの／拡大ボタン） */
function 画像の拡大(n: string, 幅: keyof typeof 画面幅, 置き場: "SALE" | string, 商品名: string, 押す: "画像" | "拡大ボタン"): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const card = () => (置き場 === "SALE" ? top.SALE中の商品(rc(商品名)) : top.タイルの商品(タイルのタグ名(置き場), rc(商品名))).first();
    let カードの画像 = ""; let 拡大 = ""; let 開いた = false;
    await page.setViewportSize(画面幅[幅]);
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); await expect(card(), `「${商品名}」のカード`).toBeAttached({ timeout: 30_000 }); });
    await step(2, async () => {
      await card().scrollIntoViewIfNeeded();
      カードの画像 = (await BranchTopPage.商品画像(card()).getAttribute("src")) ?? "";
      const target = 押す === "画像" ? BranchTopPage.商品画像の押せるところ(card()) : BranchTopPage.商品画像拡大ボタン(card());
      await target.click({ timeout: 20_000 });
      await expect(top.画像の拡大, "商品画像の拡大の表示").toHaveClass(/is-active/, { timeout: 15_000 }).catch(() => note("商品画像の拡大の表示が開かなかった"));
      開いた = /is-active/.test((await top.画像の拡大.getAttribute("class").catch(() => "")) ?? "");
      拡大 = (await top.拡大した画像.getAttribute("src").catch(() => "")) ?? "";
    });
    await expected(async () => {
      note(`画像「${商品名}」の商品画像は、正本のファイル名（.webp）で中身が 32x32 の PNG（シード作成時の問題）。カードの画像は ${カードの画像}、拡大の画像は ${拡大}`);
      expect.soft(開いた, "商品画像の拡大の表示が開いた").toBe(true);
      expect.soft(カードの画像.includes("no_image"), "カードの画像が代替画像（登録した商品画像でない）").toBe(false);
      const path = (u: string) => (u ? new URL(u, page.url()).pathname : "");
      expect.soft(path(拡大), "拡大した画像（登録した商品画像。カードの画像と同じ）").toBe(path(カードの画像) || "(カードの画像が無い)");
    });
  };
}
caseTest("IT-F01-02-072", 画像の拡大("072", "PC", "SALE", "画像拡大商品F0102-072", "画像"));
caseTest("IT-F01-02-073", 画像の拡大("073", "スマートフォン", "SALE", "画像拡大SP商品F0102-073", "拡大ボタン"));
caseTest("IT-F01-02-076", 画像の拡大("076", "スマートフォン", "テストタイルF0102-076", "タイル拡大商品F0102-076", "拡大ボタン"));

caseTest("IT-F01-02-074", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 前: string[] = []; let 後: string[] = [];
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("074")); await top.開いている(); await expect(top.SALE中, "SALE中の商品の区画").toHaveCount(1, { timeout: 30_000 }); });
  await step(2, async () => { await top.SALE中.scrollIntoViewIfNeeded(); await page.waitForTimeout(1000); 前 = await top.SALE中の見えている商品名(); note(`左から1番目「${前[0] ?? ""}」・2番目「${前[1] ?? ""}」`); });
  await step(3, async () => { await top.左スライド.click({ timeout: 20_000 }); await page.waitForTimeout(1500); 後 = await top.SALE中の見えている商品名(); });
  await expected(async () => {
    note("「左スライドボタン」は、SALE中の商品の左側の矢印のボタン（前のスライド）と読んだ（設計書: 押下すると表示されている商品を左へ1つスライドする）");
    expect.soft(後[0] ?? "", "左から1番目の商品（手順2で左から2番目だった商品）").toBe(前[1] ?? "(手順2で2番目が無い)");
    expect.soft(後.includes(前[0] ?? "(手順2で1番目が無い)"), "手順2で左から1番目だった商品が表示領域に見えている").toBe(false);
  });
});

caseTest("IT-F01-02-075", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 前: string[] = []; let 後: string[] = [];
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("075")); await top.開いている(); await expect(top.SALE中, "SALE中の商品の区画").toHaveCount(1, { timeout: 30_000 }); });
  await step(2, async () => { await top.SALE中.scrollIntoViewIfNeeded(); await page.waitForTimeout(1000); 前 = await top.SALE中の見えている商品名(); note(`左から1〜3番目「${前.slice(0, 3).join("」「")}」`); });
  await step(3, async () => { for (let i = 0; i < 2; i++) { await top.左スライド.click({ timeout: 20_000 }); await page.waitForTimeout(1500); } });
  await step(4, async () => { await top.右スライド.click({ timeout: 20_000 }); await page.waitForTimeout(1500); 後 = await top.SALE中の見えている商品名(); });
  await expected(async () => {
    note("「左スライドボタン」「右スライドボタン」は、SALE中の商品の左側・右側の矢印のボタンと読んだ");
    expect.soft(後[0] ?? "", "左から1番目の商品（手順2で左から2番目だった商品）").toBe(前[1] ?? "(手順2で2番目が無い)");
    expect.soft(後[1] ?? "", "左から2番目の商品（手順2で左から3番目だった商品）").toBe(前[2] ?? "(手順2で3番目が無い)");
  });
});

caseTest("IT-F01-02-077", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const card = () => top.タイルの商品(タイルのタグ名("テストタイルF0102-077"), rc("タイル言語商品F0102-077")).first();
  let 言語 = "";
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("077")); await top.開いている(); });
  await step(2, async () => {
    await expect(card(), "「タイル言語商品F0102-077」のカード").toBeVisible({ timeout: 30_000 });
    言語 = ((await BranchTopPage.カード言語(card()).first().textContent({ timeout: 10_000 }).catch(() => "")) ?? "").trim();
  });
  await expected(async () => { expect.soft(言語, "カード言語の表示").toBe("JP"); });
});

caseTest("IT-F01-02-085", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 数 = -1;
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("085")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.注文方法欄.first(), "支店ECTOPの区画（注文方法欄）が描かれた").toBeAttached({ timeout: 30_000 });
    数 = await top.SALE中の商品(rc("最小状態表示対象外商品F0102-085")).count();
  });
  await expected(async () => { expect.soft(数, "SALE中の商品の「最小状態表示対象外商品F0102-085」の表示数").toBe(0); });
});

/** Foil の商品名（SALE中の商品・タイル） */
function Foilの商品名(n: string, 置き場: "SALE" | string, 商品名: string): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    const card = () => (置き場 === "SALE" ? top.SALE中の商品(rc(商品名)) : top.タイルの商品(タイルのタグ名(置き場), rc(商品名))).first();
    let 名前 = "";
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      await expect(card(), `「${商品名}」のカード`).toBeVisible({ timeout: 30_000 });
      名前 = 空白なし((await BranchTopPage.商品名の文字(card()).first().textContent({ timeout: 10_000 })) ?? "");
    });
    await expected(async () => {
      note("Foil のカード商品は、開発環境にある既存の Foil のカードを商品に指定して作った（シード作成時の問題）");
      expect.soft(名前, "商品名の表示").toBe(空白なし(`【Foil】${rc(商品名)}`));
    });
  };
}
caseTest("IT-F01-02-091", Foilの商品名("091", "SALE", "セールFoil商品-091"));
caseTest("IT-F01-02-092", Foilの商品名("092", "テストタイルF0102-092", "タイルFoil商品F0102-092"));

caseTest("IT-F01-02-108", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const タグ名 = タイルのタグ名("タイルF0102-CB108");
  let 価格: string[] = []; let 廃止 = -1;
  await step(1, async () => { await top.open(支店URL("CB108")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.タイル(タグ名).first(), "タイル「タイルF0102-CB108」").toBeVisible({ timeout: 30_000 }).catch(() => note("タイル「タイルF0102-CB108」が支店ECTOPに見つからなかった"));
    価格 = (await top.タイルの商品(タグ名, rc("タイル本店公開商品F0102-CB108")).locator(".p-hareruya-product-card__price").allInnerTexts()).map((t) => t.replace(/[¥,\s]/g, ""));
    廃止 = await top.タイルの商品(タグ名, rc("タイル本店廃止商品F0102-CB108")).count();
  });
  await expected(async () => {
    expect.soft(価格, "「タイル本店公開商品F0102-CB108」に表示された商品規格の販売価格（NM・800円）").toEqual(["800"]);
    expect.soft(廃止, "本店の公開状態が廃止の「タイル本店廃止商品F0102-CB108」の表示数").toBe(0);
  });
});
