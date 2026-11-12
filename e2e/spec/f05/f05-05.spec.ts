/**
 * F05-05 ネット買取カート（フロント）。正本: cases/F05-05_test_cases.tsv
 *
 * 実装したのは 30 件（003〜016・021・023〜028・030〜038）。実装しなかったケース（理由は PM への報告に書いた）:
 * - 001 は f05-05-x.spec.ts（手順2の DB 更新を、E2E が作った印つきの商品に対して行う）
 * - 022・029: 共有の基本設定「まとめて買取商品ID」を書き換える（開発環境で全員が使う1件の設定）
 *
 * 試験用ブラウザごとの準備（ログインと買取カートへの追加）は、ケースの事前準備としてケースの冒頭で行う（カートはブラウザのセッションに紐づく）。
 * 画面の作り（アプリの Purchase/cart.twig と各画面のスクリプトで確かめた）:
 * - 数量・プラス・マイナス・削除は、画面の合計を計算し直してから数量の一覧をサーバーへ送る（読み込み直さない）。数量の欄は外れたとき 1〜20 に丸められる。
 * - 「カートに追加」のあと、画面共通の知らせ（ポップアップ）が出る。正本の「「買取カートページへ進みますか？」のダイアログ」はこの知らせに当て、
 *   「カートへ進む」は知らせの「カートを見る」リンク、「ダイアログを閉じる」は知らせの閉じるボタンに当てた。
 * - 「開発者ツールで…」の手順は、画面のスクリプトで同じ書き換えをして行う（欄の値の書き換え・要素の削除・属性の変更）。
 * - 金額は「¥1,000」の形で出る。比べるときは「¥」を除いた「1,000」の形にした。
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { NetBuyCart05Page, 行の値 } from "../../pages/front/f05_05_cart";
import { ネット買取トップのパス } from "../../pages/front/f05_01_purchase_top";
import { F0505商品, f0505会員, f0505商品 } from "../../seeds/f05-05";

type Step = CaseCtx["step"];
void (null as unknown as Step);
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 準備の注記 = "事前準備の「ログイン済み・買取カートに入っている」は、ケースの冒頭（手順1の前）で、会員ログイン画面でログインし、買取商品詳細の画面から記載数量でカートに入れて用意した。"
  + "買取価格が500円未満の商品は買取商品詳細に「カートに追加」ボタンが出ない（画面の作り）ので、その商品は、ボタンが送る追加の要求（同じ宛先・同じ値）を画面のスクリプトから送って入れた";
const 印の注記 = "商品名・商品コード・メールアドレスには、実行ごとの印を付けた値で作ってある（商品名の「更新前カードA」「カードB」は重ならないよう末尾にシードの番号も付けた）。"
  + "ご案内のモーダルは、カートを開くたびに出るので、ほかの操作の前に閉じた";
const 空の文1 = "現在、カートには商品が入っておりません。";
const 空の文2 = "お買取りを続けるには下の「TOPへ戻る」をクリックしてください。";

type 準備した = { c: NetBuyCart05Page; 商品: Record<string, F0505商品> };

/** 事前準備: ログインして、カートのシードの商品を記載数量で買取カートへ入れる */
async function 準備する(page: Page, 会員シード: string, カートシード: string | null, 商品キー: string[] = ["A", "B"]): Promise<準備した> {
  const c = new NetBuyCart05Page(page);
  const m = f0505会員(`S-F05-05-${会員シード}`);
  await c.ログインする(m.メール, m.パスワード);
  const 商品: Record<string, F0505商品> = {};
  const 方法: string[] = [];
  if (カートシード) {
    for (const k of 商品キー) {
      let p: F0505商品;
      try { p = f0505商品(`S-F05-05-${カートシード}`, k); } catch { continue; }
      商品[k] = p;
      if (p.数量 > 0) 方法.push(`${p.商品コード}: ${await c.カートへ入れる(p.商品ID, p.規格ID, p.言語, p.数量)}`);
    }
  }
  note(準備の注記);
  note(印の注記);
  if (方法.length) note(`カートへの入れ方（ボタン=画面のとおり押した／要求=ボタンと同じ追加の要求）: ${方法.join("、")}`);
  return { c, 商品 };
}

const 画面 = async (c: NetBuyCart05Page, 商品: F0505商品[]) => ({
  行: Object.fromEntries(await Promise.all(商品.map(async (p) => [p.商品コード, await c.行を読む(p.規格ID)] as [string, 行の値 | null]))),
  行数: await c.明細の行.count(),
  小計: await c.小計を読む(),
});
type 画面の値 = Awaited<ReturnType<typeof 画面>>;
const 行 = (数量: number, 合計: string): 行の値 => ({ 数量: String(数量), 合計 });

// ---- 003 ----
caseTest("IT-F05-05-003", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-003", "NOIMAGE-003", ["A"]);
  const A = 商品.A;
  let src = "";
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { src = (await c.画像(A.規格ID).getAttribute("src")) ?? ""; });
  await expected(async () => {
    expect.soft(await c.画像(A.規格ID).count(), "規格F0505-NOIMG-001-003の商品画像欄の画像の数").toBe(1);
    expect.soft(src, "画像未登録の規格の商品画像（代替画像）のアドレス").toContain("noimg");
  });
});

// ---- 004〜006: 数量の変更（画面を読み込み直さずに金額が変わる） ----
type 数量操作 = (c: NetBuyCart05Page, a: F0505商品) => Promise<void>;
function 数量変更(n: string, 操作: 数量操作, 期待: { A: 行の値; 小計: string }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const { c, 商品 } = await 準備する(page, `CUS-${n}`, `CART-${n}`);
    const { A, B } = 商品;
    let 応答: number | null = null;
    let 印 = false;
    let 操作後!: 画面の値;
    let 再読込後!: 画面の値;
    await step(1, async () => { await c.開いて整える(); });
    await step(2, async () => { await c.画面の印を付ける(); 応答 = await c.更新の応答を待つ(() => 操作(c, A)); });
    await step(3, async () => { 印 = await c.画面の印が残っている(); 操作後 = await 画面(c, [A, B]); });
    await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
    await expected(async () => {
      expect.soft(印, "画面を読み込み直していない（操作の前に付けた画面の印が残っている）").toBe(true);
      expect.soft(操作後.行[A.商品コード], "画面再読み込みなしの規格Aの数量と商品ごとの合計金額").toEqual(期待.A);
      expect.soft(操作後.小計, "画面再読み込みなしの小計").toBe(期待.小計);
      expect.soft(再読込後.行[A.商品コード], "手動再読み込み後の規格Aの数量と商品ごとの合計金額").toEqual(期待.A);
      expect.soft(再読込後.小計, "手動再読み込み後の小計").toBe(期待.小計);
    });
    note(`数量の一覧の更新の応答: ${応答 ?? "なし"}`);
  };
}
caseTest("IT-F05-05-004", 数量変更("004", (c, a) => c.数量を入れて外す(a.規格ID, "4"), { A: 行(4, "400"), 小計: "1,000" }));
caseTest("IT-F05-05-005", 数量変更("005", (c, a) => c.プラス(a.規格ID).click(), { A: 行(3, "300"), 小計: "900" }));
caseTest("IT-F05-05-006", 数量変更("006", (c, a) => c.マイナス(a.規格ID).click(), { A: 行(1, "100"), 小計: "700" }));

// ---- 007: 明細の削除 ----
caseTest("IT-F05-05-007", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-007", "CART-007");
  const { A, B } = 商品;
  let 印 = false;
  let 操作後!: 画面の値;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.画面の印を付ける(); await c.更新の応答を待つ(() => c.削除ボタン(A.規格ID).click()); });
  await step(3, async () => { 印 = await c.画面の印が残っている(); 操作後 = await 画面(c, [A, B]); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  await expected(async () => {
    expect.soft(印, "画面を読み込み直していない（操作の前に付けた画面の印が残っている）").toBe(true);
    expect.soft(操作後.行[A.商品コード], "画面再読み込みなしの規格Aの明細（削除済み）").toBeNull();
    expect.soft(操作後.行[B.商品コード], "画面再読み込みなしの規格Bの明細").toEqual(行(3, "600"));
    expect.soft(操作後.小計, "画面再読み込みなしの小計（規格Bだけ）").toBe("600");
    expect.soft(再読込後.行[A.商品コード], "手動再読み込み後の規格Aの明細（削除済み）").toBeNull();
    expect.soft(再読込後.行[B.商品コード], "手動再読み込み後の規格Bの明細").toEqual(行(3, "600"));
    expect.soft(再読込後.小計, "手動再読み込み後の小計").toBe("600");
  });
});

// ---- 008: 数量に0 ----
caseTest("IT-F05-05-008", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-008", "CART-008");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.更新の応答を待つ(() => c.数量を入れて外す(A.規格ID, "0")); });
  await step(3, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-A-001-008の明細（買取カートから外れている）").toBeNull();
    expect.soft(再読込後.行[B.商品コード], "規格F0505-B-001-008の明細").toEqual(行(3, "600"));
    expect.soft(再読込後.小計, "小計（規格Bだけ）").toBe("600");
  });
});

// ---- 009: 数量に数字でない値 ----
caseTest("IT-F05-05-009", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-009", "CART-009");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.数量に文字を設定する(A.規格ID, "abc"); });
  await step(3, async () => { await c.更新の応答を待つ(() => c.数量の欄から外す(A.規格ID)); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  note("数量の欄は数字だけの欄なので、開発者ツールの代わりに、欄を文字を入れられる欄に直してから「abc」を入れた");
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "数字でない数量が指定された規格F0505-A-001-009の明細（買取カートから外れている）").toBeNull();
    expect.soft(再読込後.行[B.商品コード], "規格F0505-B-001-009の明細").toEqual(行(3, "600"));
    expect.soft(再読込後.小計, "小計（規格Bだけ）").toBe("600");
  });
});

// ---- 010: 数量の上限 ----
caseTest("IT-F05-05-010", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-010", "CART-010");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.更新の応答を待つ(() => c.数量を入れて外す(A.規格ID, "20")); });
  await step(3, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-A-001-010の数量（上限値20）と商品ごとの合計金額").toEqual(行(20, "2,000"));
    expect.soft(再読込後.小計, "小計").toBe("2,600");
  });
});

// ---- 011: 20を超える数量が混じる更新 ----
caseTest("IT-F05-05-011", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-011", "CART-011");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.数量の値を書き換える(A.規格ID, "4"); await c.数量の値を書き換える(B.規格ID, "21"); });
  await step(3, async () => { await c.更新の応答を待つ(() => c.数量の欄から外す(B.規格ID)); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  note(`画面が出した alert: ${c.アラート.join(" / ") || "なし"}`);
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-A-001-011の数量（更新されず2）").toEqual(行(2, "200"));
    expect.soft(再読込後.行[B.商品コード], "規格F0505-B-001-011の数量（更新されず3）").toEqual(行(3, "600"));
    expect.soft(再読込後.小計, "小計").toBe("800");
    expect.soft(c.パス, "ネット買取カート画面に留まっている").toBe("/ja/purchase/cart");
  });
});

// ---- 012・013: なりすまし対策トークン ----
function トークン(n: string, 操作: (c: NetBuyCart05Page) => Promise<void>, 注: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    const { c, 商品 } = await 準備する(page, `CUS-${n}`, `CART-${n}`);
    const { A, B } = 商品;
    let 再読込後!: 画面の値;
    await step(1, async () => { await c.開いて整える(); });
    await step(2, async () => { await expect(c.トークン入力, "なりすまし対策トークンの入力要素").toHaveCount(1); await 操作(c); });
    await step(3, async () => { await c.更新の応答を待つ(() => c.削除ボタン(A.規格ID).click()); });
    await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
    note(`${注}。画面が出した alert: ${c.アラート.join(" / ") || "なし"}`);
    await expected(async () => {
      expect.soft(再読込後.行[A.商品コード], "規格Aの明細（削除されず数量2）").toEqual(行(2, "200"));
      expect.soft(再読込後.行[B.商品コード], "規格Bの明細（削除されず数量3）").toEqual(行(3, "600"));
    });
  };
}
caseTest("IT-F05-05-012", トークン("012", (c) => c.トークン入力.evaluate((e) => e.remove()), "手順2は、画面のスクリプトでフォームのトークンの入力要素を削除した"));
caseTest("IT-F05-05-013", トークン("013", (c) => c.トークン入力.evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }), "手順2は、画面のスクリプトでフォームのトークンの値を「invalid-token」に変えた"));

// ---- 014: 同一セッションの2つの画面 ----
caseTest("IT-F05-05-014", async ({ page, step, expected }) => {
  const { c: a, 商品 } = await 準備する(page, "CUS-014", "CART-014");
  const { A, B } = 商品;
  const b = new NetBuyCart05Page(await page.context().newPage());
  let 再読込後!: 画面の値;
  await step(1, async () => { await a.開いて整える(); await b.開いて整える(); });
  await step(2, async () => { await b.更新の応答を待つ(() => b.削除ボタン(A.規格ID).click()); });
  await step(3, async () => { await a.更新の応答を待つ(() => a.削除ボタン(A.規格ID).click()); });
  await step(4, async () => { await a.再読み込みして整える(); 再読込後 = await 画面(a, [A, B]); });
  note("ブラウザAとブラウザBは、同じブラウザ（同じセッション）の別タブで行った");
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-A-001-014の明細（削除済み）").toBeNull();
    expect.soft(再読込後.行[B.商品コード], "規格F0505-B-001-014の数量と商品ごとの合計金額").toEqual(行(3, "600"));
    expect.soft(再読込後.小計, "小計").toBe("600");
  });
});

// ---- 015: 空のカート ----
caseTest("IT-F05-05-015", async ({ page, step, expected }) => {
  const { c } = await 準備する(page, "CUS-015", null);
  await step(1, async () => { await c.開く(); });
  await expected(async () => {
    expect.soft(await c.明細の行.count(), "明細の行の数").toBe(0);
    expect.soft(await c.空の案内の文を読む(), "商品が入っていない案内").toContain(空の文1);
    await expect.soft(c.TOPへ戻るボタン, "商品一覧へ戻るための導線（「TOPへ戻る」）").toBeVisible();
  });
});

// ---- 016: 商品名リンク ----
caseTest("IT-F05-05-016", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-016", "CART-016");
  const { A } = 商品;
  let 新: Page | null = null;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => {
    const [popup] = await Promise.all([page.context().waitForEvent("page"), c.商品名リンク(A.規格ID).click()]);
    await popup.waitForLoadState("load");
    新 = popup;
  });
  await expected(async () => {
    expect.soft(新 !== null, "新しいウィンドウが開いた").toBe(true);
    expect.soft(new URL(新!.url()).pathname, "新しいウィンドウの画面（規格F0505-A-001-016の商品詳細）").toBe(`/ja/purchase/detail/${A.商品ID}`);
    await expect.soft(新!.locator("h1.p-hareruya-product-detail__title-text"), "商品詳細の商品名").toContainText(A.商品名);
    expect.soft(c.パス, "もとのウィンドウはネット買取カートのまま").toBe("/ja/purchase/cart");
  });
});

// ---- 021: まとめて買取が無く、選んで買取だけ ----
caseTest("IT-F05-05-021", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-021", "CART-021");
  const { A } = 商品;
  let 知らせ = "";
  let 開いた = false;
  await step(1, async () => {
    const d = await c.詳細を開く(A.商品ID, A.規格ID, "JP");
    await d.数量を入れる("1");
    知らせ = (await c.追加を押す(d)).知らせ;
  });
  await step(2, async () => { await c.知らせからカートへ進む(); });
  await step(3, async () => { 開いた = await c.お知らせモーダル.waitFor({ state: "visible", timeout: 10_000 }).then(() => true, () => false); });
  note(`追加のあとの知らせ「${知らせ}」。買取価格は、ボタンの出る600円で作ってある（シード表の100円では「カートに追加」ボタンが出ない）`);
  await expected(async () => {
    expect.soft(開いた, "ネット買取カート画面に「ご案内」のモーダルが表示される").toBe(true);
    await expect.soft(c.行(A.規格ID), "規格F0505-A-021の明細").toHaveCount(1);
  });
});

// ---- 023: TOPへ戻る ----
caseTest("IT-F05-05-023", async ({ page, step, expected }) => {
  const { c } = await 準備する(page, "CUS-023", null);
  await step(1, async () => { await c.開く(); });
  await step(2, async () => {
    await Promise.all([page.waitForURL((u) => u.pathname !== "/ja/purchase/cart", { timeout: 60_000, waitUntil: "load" }), c.TOPへ戻るボタン.click()]);
  });
  note("「TOPへ戻る」のリンク先はネット買取のTOP（/ja/purchase）。TOP画面はここに当てた");
  await expected(async () => {
    expect.soft(c.パス, "移った先の画面（TOP）").toBe(ネット買取トップのパス);
    await expect.soft(page.locator("body.purchase_page"), "ネット買取TOP画面の印").toBeVisible();
  });
});

// ---- 024: 再計算ボタン ----
caseTest("IT-F05-05-024", async ({ page, step, expected }) => {
  const { c } = await 準備する(page, "CUS-024", "CART-024");
  let 名: string[] = [];
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { 名 = await c.ボタンの表示名(); });
  note(`画面内のボタンの表示名: ${名.join("、")}`);
  await expected(async () => {
    expect.soft(名.length, "画面内のボタンの数（ボタンを読めている）").toBeGreaterThan(0);
    expect.soft(名.filter((n) => n.includes("再計算")), "「再計算」を含む表示名のボタン").toEqual([]);
  });
});

// ---- 025: 最後の1明細を削除 ----
caseTest("IT-F05-05-025", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-025", "CART-025", ["A"]);
  const { A } = 商品;
  let 文 = "";
  let 行数 = -1;
  let ボタン = false;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.更新の応答を待つ(() => c.削除ボタン(A.規格ID).click()); });
  await step(3, async () => { await c.再読み込みして整える(); });
  await step(4, async () => {
    行数 = await c.明細の行.count();
    文 = await c.空の案内の文を読む();
    ボタン = await c.TOPへ戻るボタン.isVisible();
  });
  note("案内文の比べ方: 正本の文の空白（「下の 「TOPへ戻る」 を」の前後の空白）は画面の文に無いので、空白を除いて比べた");
  await expected(async () => {
    expect.soft(行数, "明細の行の数（規格F0505-A-025が削除されている）").toBe(0);
    expect.soft(文, "案内文（1行目）").toContain(空の文1);
    expect.soft(文, "案内文（2行目）").toContain(空の文2);
    expect.soft(ボタン, "「TOPへ戻る」ボタンの表示").toBe(true);
  });
});

// ---- 026: 言語コードの表示 ----
caseTest("IT-F05-05-026", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CUS-026", "CART-026", ["A"]);
  const { A } = 商品;
  let リンクの文 = "";
  let ラベル = "";
  let 名前 = "";
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => {
    const link = c.商品名リンク(A.規格ID);
    リンクの文 = (await link.innerText()).replace(/\s+/g, "");
    ラベル = (await link.locator(".c-hareruya-label--language").innerText()).trim();
    名前 = (await link.locator(".p-hareruya-cart-item__name-text").innerText()).trim();
  });
  note(`画面の商品名欄の文: 「${リンクの文}」（言語コードのラベル「${ラベル}」と商品名「${名前}」）。正本は言語コードを【 】で囲むと定めるので、囲みの有無も比べた`);
  await expected(async () => {
    expect.soft(ラベル, "言語コードのラベル").toBe("EN");
    expect.soft(名前, "商品名").toBe(A.商品名);
    expect.soft(リンクの文, "商品名欄の文（先頭に言語コードENを【 】で囲って付けた商品名）").toBe(`【EN】${A.商品名}`);
  });
});

// ---- 027・028: 同じ規格を2回追加 ----
function 二回追加(n: string, 一回目: string, 二回目: string, 期待: { 数量: number; 合計: string }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const { c, 商品 } = await 準備する(page, `CUS-${n}`, `CART-${n}`);
    const { A } = 商品;
    let d!: Awaited<ReturnType<NetBuyCart05Page["詳細を開く"]>>;
    let 知らせ1 = "";
    let 知らせ2 = "";
    let 詳細に留まる = false;
    let 画面値!: 画面の値;
    await step(1, async () => {
      d = await c.詳細を開く(A.商品ID, A.規格ID, "JP");
      await d.数量を入れる(一回目);
      知らせ1 = (await c.追加を押す(d)).知らせ;
    });
    await step(2, async () => {
      await c.知らせを閉じる();
      詳細に留まる = c.パス === `/ja/purchase/detail/${A.商品ID}`;
    });
    await step(3, async () => {
      await d.数量を入れる(二回目);
      知らせ2 = (await c.追加を押す(d)).知らせ;
    });
    await step(4, async () => { await c.知らせからカートへ進む(); });
    await step(5, async () => { await c.お知らせを閉じる(); 画面値 = await 画面(c, [A]); });
    note(`1回目の知らせ「${知らせ1}」、2回目の知らせ「${知らせ2}」`);
    await expected(async () => {
      expect.soft(詳細に留まる, "ダイアログを閉じたあと、元のネット買取商品詳細画面に留まっている").toBe(true);
      expect.soft(知らせ2, "2回目の追加で上限超過の通知が出ない").not.toMatch(/までです/);
      expect.soft(画面値.行数, "明細の行の数（同じ規格が1行だけ）").toBe(1);
      expect.soft(画面値.行[A.商品コード], "規格Aの数量と商品ごとの合計金額").toEqual(行(期待.数量, 期待.合計));
      expect.soft(画面値.小計, "小計").toBe(期待.合計);
    });
  };
}
caseTest("IT-F05-05-027", 二回追加("027", "2", "3", { 数量: 5, 合計: "3,000" }));
caseTest("IT-F05-05-028", 二回追加("028", "19", "1", { 数量: 20, 合計: "12,000" }));

// ---- 030〜033: 数量の指定なし・21の指定で追加 ----
function 書き換え追加(n: string, 値: string, 終わり: "進む" | "閉じる", 期待: { 数量: number; 合計: string } | null, 通知なし: boolean) {
  return async ({ page, step, expected }: CaseCtx) => {
    const { c, 商品 } = await 準備する(page, `CBCUS-${n}`, `CBCART-${n}`, ["A"]);
    const { A } = 商品;
    let 結果 = { 応答: 0, 知らせ: "" };
    let 画面値!: 画面の値;
    let 空の文 = "";
    await step(1, async () => {
      const d = await c.詳細を開く(A.商品ID, A.規格ID, "JP");
      結果 = await c.数量を書き換えて追加を押す(d, 値);
    });
    if (終わり === "進む") {
      await step(2, async () => { await c.知らせからカートへ進む(); });
      await step(3, async () => { await c.お知らせを閉じる(); 画面値 = await 画面(c, [A]); });
    } else {
      await step(2, async () => { await c.知らせを閉じる(); });
      await step(3, async () => { await c.開いて整える(); 画面値 = await 画面(c, [A]); 空の文 = await c.空の案内の文を読む(); });
    }
    note(`追加の応答 ${結果.応答}・知らせ「${結果.知らせ}」。手順1の商品数の欄の書き換え（${値 === "" ? "空" : 値}）は、欄から外れる処理を走らせないよう、欄を押さずに値を書き換え、「カートに追加」を画面のスクリプトで押した`);
    await expected(async () => {
      if (期待) {
        expect.soft(画面値.行数, "明細の行の数（同じ規格が1行だけ）").toBe(1);
        expect.soft(画面値.行[A.商品コード], "規格Aの数量と商品ごとの合計金額").toEqual(行(期待.数量, 期待.合計));
        expect.soft(画面値.小計, "小計").toBe(期待.合計);
      } else {
        expect.soft(画面値.行[A.商品コード], "規格Aの明細（無い）").toBeNull();
        expect.soft(画面値.行数, "明細の行の数").toBe(0);
        expect.soft(空の文, "商品が入っていない案内").toContain(空の文1);
      }
      if (通知なし) expect.soft(結果.知らせ, "上限超過の通知が出ない").not.toMatch(/までです/);
    });
  };
}
caseTest("IT-F05-05-030", 書き換え追加("030", "", "進む", { 数量: 3, 合計: "1,800" }, true));
caseTest("IT-F05-05-031", 書き換え追加("031", "", "進む", { 数量: 1, 合計: "600" }, true));
caseTest("IT-F05-05-032", 書き換え追加("032", "", "閉じる", { 数量: 20, 合計: "12,000" }, false));
caseTest("IT-F05-05-033", 書き換え追加("033", "21", "閉じる", null, false));

// ---- 034・035: 数量の一覧が渡される更新 ----
caseTest("IT-F05-05-034", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CBCUS-034", "CBCART-034", ["A"]);
  const { A } = 商品;
  let 印 = false;
  let 操作後!: 画面の値;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.画面の印を付ける(); await c.更新の応答を待つ(() => c.数量を入れて外す(A.規格ID, "4")); });
  await step(3, async () => { 印 = await c.画面の印が残っている(); 操作後 = await 画面(c, [A]); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A]); });
  await expected(async () => {
    expect.soft(印, "画面を読み込み直していない（操作の前に付けた画面の印が残っている）").toBe(true);
    expect.soft(操作後.行[A.商品コード], "画面再読み込みなしの数量と商品ごとの合計金額").toEqual(行(4, "2,400"));
    expect.soft(操作後.小計, "画面再読み込みなしの小計").toBe("2,400");
    expect.soft(再読込後.行[A.商品コード], "手動再読み込み後の数量と商品ごとの合計金額").toEqual(行(4, "2,400"));
    expect.soft(再読込後.小計, "手動再読み込み後の小計").toBe("2,400");
  });
});

caseTest("IT-F05-05-035", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CBCUS-035", "CBCART-035");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.更新の応答を待つ(() => c.数量を入れて外す(A.規格ID, "0")); });
  await step(3, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-CB035-Aの明細（買取カートから外れている）").toBeNull();
    expect.soft(再読込後.行[B.商品コード], "規格F0505-CB035-Bの数量と商品ごとの合計金額").toEqual(行(3, "2,100"));
    expect.soft(再読込後.小計, "小計").toBe("2,100");
  });
});

// ---- 036: 20を超える数量が混じる更新 ----
caseTest("IT-F05-05-036", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CBCUS-036", "CBCART-036");
  const { A, B } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.数量の値を書き換える(A.規格ID, "4"); await c.数量の値を書き換える(B.規格ID, "21"); });
  await step(3, async () => { await c.更新の応答を待つ(() => c.数量の欄から外す(B.規格ID)); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A, B]); });
  note(`画面が出した alert: ${c.アラート.join(" / ") || "なし"}`);
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-CB036-Aの数量（更新されず2）").toEqual(行(2, "1,200"));
    expect.soft(再読込後.行[B.商品コード], "規格F0505-CB036-Bの数量（更新されず3）").toEqual(行(3, "2,100"));
    expect.soft(再読込後.小計, "小計").toBe("3,300");
    expect.soft(c.パス, "ネット買取カート画面に留まっている").toBe("/ja/purchase/cart");
  });
});

// ---- 037: 数量の一覧が渡されない更新 ----
caseTest("IT-F05-05-037", async ({ page, step, expected }) => {
  const { c, 商品 } = await 準備する(page, "CBCUS-037", "CBCART-037", ["A"]);
  const { A } = 商品;
  let 再読込後!: 画面の値;
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => { await c.数量欄(A.規格ID).evaluate((e) => e.removeAttribute("name")); });
  await step(3, async () => { await c.更新の応答を待つ(() => c.数量を入れて外す(A.規格ID, "4")); });
  await step(4, async () => { await c.再読み込みして整える(); 再読込後 = await 画面(c, [A]); });
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-CB037-Aの数量（2のまま）と商品ごとの合計金額").toEqual(行(2, "1,200"));
    expect.soft(再読込後.小計, "小計").toBe("1,200");
  });
});

// ---- 038: 別のタブで空にしたあとの更新 ----
caseTest("IT-F05-05-038", async ({ page, step, expected }) => {
  const { c: a, 商品 } = await 準備する(page, "CBCUS-038", "CBCART-038", ["A"]);
  const { A } = 商品;
  const b = new NetBuyCart05Page(await page.context().newPage());
  let 再読込後!: 画面の値;
  let 文 = "";
  await step(1, async () => { await a.開いて整える(); await b.開いて整える(); });
  await step(2, async () => { await b.更新の応答を待つ(() => b.削除ボタン(A.規格ID).click()); });
  await step(3, async () => { await a.更新の応答を待つ(() => a.数量を入れて外す(A.規格ID, "5")); });
  await step(4, async () => { await a.再読み込みして整える(); 再読込後 = await 画面(a, [A]); 文 = await a.空の案内の文を読む(); });
  note("ブラウザAとブラウザBは、同じブラウザ（同じセッション）の別タブで行った");
  await expected(async () => {
    expect.soft(再読込後.行[A.商品コード], "規格F0505-CB038-Aの明細（現れない）").toBeNull();
    expect.soft(再読込後.行数, "明細の行の数").toBe(0);
    expect.soft(文, "商品が入っていない案内").toContain(空の文1);
  });
});
