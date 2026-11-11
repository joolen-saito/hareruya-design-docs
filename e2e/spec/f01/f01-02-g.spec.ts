/** F01-02 支店ECTOP（注文方法・公開／非公開・ランキング・バナー・QRコード & 採用情報）。正本: cases/F01-02_test_cases.tsv */
import { test } from "@playwright/test";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { BranchTopPage, 画面幅 } from "../../pages/front/f01_02_branch";
import { LoginPage } from "../../pages/front/f06_03_login";
import { 支店URL, 支店名 } from "../../seeds/f01-02";
import { バナーリンクタグのID, バナー画像, 会員 } from "../../seeds/f01-02-branch";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const 店内向けの文 = "商品をお選びいただき、カート画面へお進みください。ご注文完了後、番号でお呼びいたします。";

/** 支店のログイン画面（/ja/<支店URL>/mypage/login）で会員としてログインする */
async function 支店でログインする(page: import("@playwright/test").Page, n: string): Promise<void> {
  const login = new LoginPage(page);
  await login.URLを開く(`/ja/${支店URL(n)}/mypage/login`);
  await login.ログインする(会員[n].メール, 会員[n].パスワード);
  if (await login.ログイン画面である()) throw new Error(`会員 ${会員[n].メール} でログインできない（${await login.認証エラー()}）`);
}

caseTest("IT-F01-02-001", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 文 = ""; let リンク = -1;
  await step(1, async () => { await 支店でログインする(page, "001"); await top.open(支店URL("001")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.注文方法欄.first(), "注文方法欄").toBeVisible({ timeout: 30_000 });
    文 = (await top.注文方法欄.allInnerTexts()).join(" ").replace(/\s+/g, "");
    リンク = await top.通販サイトのリンク.count();
  });
  await expected(async () => {
    expect.soft(文, "注文方法欄の文（商品選択から注文完了後の呼び出しまでの案内）").toContain(店内向けの文);
    expect.soft(リンク, "注文方法欄の「通販サイト」の案内（リンク）の数").toBe(0);
    expect.soft(文.includes("通販サイト"), "注文方法欄に通販サイトの案内の文がある").toBe(false);
  });
});

caseTest("IT-F01-02-002", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 文 = ""; let リンク = -1;
  await step(1, async () => { await 支店でログインする(page, "002"); await top.open(支店URL("002")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.注文方法欄.first(), "注文方法欄").toBeVisible({ timeout: 30_000 });
    文 = (await top.注文方法欄.allInnerTexts()).join(" ").replace(/\s+/g, "");
    リンク = await top.通販サイトのリンク.count();
  });
  await expected(async () => {
    note(`正本の「テスト支店A」は、この実行の支店「${支店名("002")}」と読む`);
    expect.soft(文, "注文方法欄の文（支店での店頭受け取りの案内）").toContain(`晴れる屋${支店名("002")}での店頭受け取り注文を承っています。`.replace(/\s+/g, ""));
    expect.soft(リンク, "注文方法欄の「通販サイト」の案内（リンク）の数").toBe(1);
    expect.soft(文.includes(店内向けの文), "支店店内向けの注文フローの文がある").toBe(false);
  });
});

caseTest("IT-F01-02-004", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 区画 = -1; let 見出し = -1;
  await step(1, async () => { await top.open(支店URL("004")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.注文方法欄.first(), "支店ECTOPの区画（注文方法欄）が描かれた").toBeVisible({ timeout: 30_000 });
    区画 = await top.商品人気ランキング.count();
    見出し = await page.getByRole("heading", { name: "ランキング", exact: true }).count();
  });
  await expected(async () => {
    expect.soft(区画, "商品人気ランキングの区画の数").toBe(0);
    expect.soft(見出し, "見出し「ランキング」の数").toBe(0);
  });
});

caseTest("IT-F01-02-005", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let status = 0;
  await step(1, async () => { status = await top.open(支店URL("005")); });
  await expected(async () => {
    expect.soft(status, "支店ECTOPのルートURLの応答").toBe(200);
    expect.soft(await top.支店ECTOPか(), "支店ECTOPの画面").toBe(true);
    expect.soft(await page.title(), "画面の題名（支店の名前）").toContain(支店名("005"));
  });
});

caseTest("IT-F01-02-006", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let status = 0;
  await step(1, async () => { status = await top.open(支店URL("006")); await page.locator("body").waitFor({ state: "attached", timeout: 30_000 }); });
  await expected(async () => {
    note(`ルートURLの応答は ${status}`);
    expect.soft(await top.支店ECTOPか(), "非公開の支店の支店ECTOPの画面が表示される").toBe(false);
    expect.soft((await page.title()).includes(支店名("006")), "画面の題名に非公開の支店の名前がある").toBe(false);
  });
});

caseTest("IT-F01-02-033", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let src = ""; let 中身: Buffer | null = null;
  await step(1, async () => { await top.open(支店URL("033")); await top.開いている(); });
  await step(2, async () => {
    await top.バナー画像.scrollIntoViewIfNeeded();
    await expect(top.バナー画像, "バナー欄の画像").toBeVisible({ timeout: 30_000 });
    src = (await top.バナー画像.getAttribute("src")) ?? "";
    中身 = src ? await top.画像の中身(src) : null;
  });
  await expected(async () => {
    note("画像「branch-banner-033.webp」は中身が 32x32 の PNG（シード作成時の問題）。表示された画像の中身が、登録した画像と同じかで確かめた");
    expect.soft(src.includes("top-category-list-banner01"), "バナー欄が既定の画像のまま").toBe(false);
    expect.soft(中身 !== null && Buffer.compare(中身, バナー画像("033").buffer) === 0, "バナー欄の画像が、トップページ管理で設定した画像と同じ").toBe(true);
  });
});

caseTest("IT-F01-02-034", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  await step(1, async () => { await top.open(支店URL("034")); await top.開いている(); });
  await step(2, async () => {
    await top.バナーのリンク.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/products\/search\/tags\//, { timeout: 60_000 }).catch(() => undefined), top.バナーのリンク.click({ timeout: 20_000 })]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    note("リンクURLは画面で設定できず、バナーリンクタグ（タグ管理で作ったタグ）の商品一覧のURLを「設定したURL」と読み替えた（シード作成時の問題）");
    expect.soft(new URL(page.url()).pathname, "遷移先（バナーリンクタグの商品一覧）").toMatch(new RegExp(`/products/search/tags/${バナーリンクタグのID("034")}$`));
  });
});

caseTest("IT-F01-02-067", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 値 = "";
  await step(1, async () => { await top.open(支店URL("067")); await top.開いている(); });
  await step(2, async () => {
    const card = top.QRのカード("最新情報はXでチェック");
    await card.scrollIntoViewIfNeeded();
    値 = await top.QRコードを読み取る(BranchTopPage.QRコードの画像(card));
  });
  await expected(async () => { expect.soft(値, "読み取ったURL（店舗登録のX公式アカウントURL）").toBe("https://x.com/hareruya_test_branch-067"); });
});

/** QRコード & 採用情報欄の採用情報の表示（PC幅／スマートフォン幅） */
function 採用情報(n: string, 幅: keyof typeof 画面幅, 出る: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const top = new BranchTopPage(page);
    let 見える = false;
    await page.setViewportSize(画面幅[幅]);
    await step(1, async () => { await top.open(支店URL(n)); await top.開いている(); });
    await step(2, async () => {
      await expect(top.注文方法欄.first(), "支店ECTOPの区画（注文方法欄）が描かれた").toBeAttached({ timeout: 30_000 });
      if (await top.採用情報.count()) await top.採用情報.first().scrollIntoViewIfNeeded().catch(() => undefined);
      見える = await top.採用情報.first().isVisible().catch(() => false);
    });
    await expected(async () => { expect.soft(見える, `${幅}幅で、QRコード & 採用情報欄の採用情報が見える`).toBe(出る); });
  };
}
caseTest("IT-F01-02-078", 採用情報("078", "PC", true));
caseTest("IT-F01-02-079", 採用情報("079", "スマートフォン", false));

caseTest("IT-F01-02-080", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 新しいタブ = ""; let 元の画面 = "";
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("080")); await top.開いている(); });
  await step(2, async () => {
    await top.採用情報.first().scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }), top.採用情報.first().click({ timeout: 20_000 })]);
    await popup.waitForURL((u) => u.href !== "about:blank", { timeout: 60_000 }).catch(() => undefined);
    await popup.waitForLoadState("domcontentloaded", { timeout: 60_000 }).catch(() => note("新しいタブの読み込みが60秒で終わらなかった"));
    新しいタブ = popup.url();
    元の画面 = page.url();
  });
  await expected(async () => {
    note(`新しいタブのURLは ${新しいタブ}（末尾の「/」の有無は区別しない）`);
    expect.soft(新しいタブ.replace(/\/$/, ""), "新しいタブのURL（採用ページ）").toBe("https://corp.hareruyamtg.com/recruit");
    expect.soft(元の画面, "元のタブは支店ECTOPのまま（新しいタブで開いた）").toContain(`/${支店URL("080")}/`);
  });
});

caseTest("IT-F01-02-082", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let 控えたURL = ""; let 値 = "";
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await 支店でログインする(page, "082"); await top.open(支店URL("082")); await top.開いている(); 控えたURL = page.url(); });
  await step(2, async () => {
    const card = top.QRのカード("ご自宅から簡単予約！");
    await card.scrollIntoViewIfNeeded();
    値 = await top.QRコードを読み取る(BranchTopPage.QRコードの画像(card));
  });
  await expected(async () => { expect.soft(値, "読み取ったURL（手順1で控えた支店ECTOPのURL）").toBe(控えたURL); });
});

caseTest("IT-F01-02-088", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  let カード = -1; let 文 = -1;
  await page.setViewportSize(画面幅.PC);
  await step(1, async () => { await top.open(支店URL("088")); await top.開いている(); });
  await step(2, async () => {
    await expect(top.QRコード欄.first(), "QRコード & 採用情報欄").toBeAttached({ timeout: 30_000 });
    カード = await top.QRのカード("ご自宅から簡単予約").count();
    文 = await page.getByText("ご自宅から簡単予約").count();
  });
  await expected(async () => {
    expect.soft(カード, "QRコード & 採用情報欄の「ご自宅から簡単予約」のカードの数").toBe(0);
    expect.soft(文, "画面の「ご自宅から簡単予約」の文の数").toBe(0);
  });
});
