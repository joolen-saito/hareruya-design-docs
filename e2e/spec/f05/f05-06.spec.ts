/**
 * F05-06 ネット買取 買取手続き〜完了（フロント）。正本: cases/F05-06_test_cases.tsv
 *
 * 実装したのは 001・052〜058・059〜061・068・073・076 の14件と、2026-11-12 に足した S-F05-06-SETTINGS を使う39件（このファイルの後半）。
 * S-F05-06-SETTINGS はまとめて買取商品ID（追加システム設定。共有の開発環境で全員が使う1件の設定）を書き換えるので、夜の1本流しだけで流す
 * （config/solo_cases.tsv）。書き換える前に画面で全項目を控え、ケースの終わりに基盤が画面で元へ戻して確かめる（seeds/f05-06.ts）。
 * 実装しない: 003（自動ログイン機能の店舗設定の書き換えと自動ログイン記憶のCookieの作り分けが要る。判断待ち）・010（DB で会員・口座・過去の買取を登録する）、
 * 006・007・074・075（購入上限の画面が無い）・008（買取価格の無い商品は DB での準備）・071（ログイン状態だけの失効）・072・084〜087（生年月日なしの会員）など。
 * 077・083 は 2026-11-13 に足した（このファイルの末尾）
 *
 * 試験用ブラウザごとの準備（ログインと買取カートへの追加）は、ケースの事前準備としてケースの冒頭で行う（カートはブラウザのセッションに紐づく）。
 */
import { Browser, Page, test } from "@playwright/test";
import { 会員の職業と生年月日, 会員の買取受注, 買取受注を読む, 事業者情報の件数, 申込時買取価格を読む, 振込口座を読む, ステータス変更履歴の件数, 明細を読む } from "../../db/f05_06";
import { mailIds, mailsTo, mailText, waitForMailTo } from "../../lib/mail";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 依頼者情報を読む, 口座情報を読む, 一覧の行を読む, 明細の申込時買取価格を読む, 買取情報編集を開く } from "../../pages/admin/f05_06_buy";
import { M0701ListPage } from "../../pages/admin/m07_01_list";
import { PurchaseFlowPage, 記入の値, 通常申込入力値 } from "../../pages/front/f05_06_purchase";
import { F0506_L_ADMIN, F0506_PD_ADMIN, f0506会員, f0506商品 } from "../../seeds/f05-06";

type Step = CaseCtx["step"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const digits = (s: string) => s.replace(/[^\d]/g, "");

const ログインの注記 = "事前準備の「ログイン済み・買取カートに入っている」は、ケースの冒頭（手順1の前）で、会員ログイン画面でログインし、買取商品詳細の画面から数量ぶん買取カートへ追加して用意した。"
  + "買取価格が500円未満の商品は買取商品詳細に「カートに追加」ボタンが出ない（画面の作り）ので、ボタンが送る追加の要求（同じ宛先・同じ値）を画面のスクリプトから送った。買取ログイン画面はカートが空だとカートへ戻されるので、ログインは会員ログイン画面で行った";
const 印の注記 = "商品コード・商品名・メールアドレスには、実行ごとの印を付けた値で作ってあり、画面の表示も印を付けた値と比べた。氏名・住所・電話番号は正本の値のまま";

/** 事前準備: ログインして、買取カートへ商品を入れる */
async function 準備する(page: Page, seedId: string, 商品: [string, number][]): Promise<PurchaseFlowPage> {
  const flow = new PurchaseFlowPage(page);
  const m = f0506会員(seedId);
  await flow.会員ログインする(m.メール, m.パスワード);
  for (const [キー, 数量] of 商品) {
    const p = f0506商品(キー);
    await flow.カートへ追加する(p.商品ID, p.規格ID, 数量);
  }
  note(ログインの注記);
  note(印の注記);
  return flow;
}

// ---- 手順1・2: カートを開いて記入画面へ進む ----

async function カートから記入画面へ(flow: PurchaseFlowPage, step: Step, 商品名: string, 数量: string): Promise<void> {
  await step(1, async () => {
    await flow.カートを開く();
    await expect(flow.数量欄(商品名), "買取カートの商品の数量").toHaveValue(数量);
  });
  await step(2, async () => {
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
  });
}

// ---- 001 ----

caseTest("IT-F05-06-001", async ({ page, step, expected }) => {
  const flow = new PurchaseFlowPage(page);
  const m = f0506会員("S-F05-06-MEMBER-001");
  await step(1, async () => { await flow.会員ログインする(m.メール, m.パスワード); });
  await step(2, async () => {
    await page.goto(`${BASE_URL}/ja/purchase/fill`, { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  note("手順の「買取カートが空の状態で買取依頼内容の記入画面を開く」は、記入画面のアドレス（/ja/purchase/fill）を直接開いた（カートが空だと記入画面のボタンへ進めないため）");
  await expected(async () => {
    expect.soft(flow.パス, "移った先の画面（買取カート）").toBe("/purchase/cart");
  });
});

// ---- 059〜061・076: 記入画面の表示 ----

caseTest("IT-F05-06-059", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-ORDERER-059", [["L", 2]]);
  const p = f0506商品("L");
  await カートから記入画面へ(flow, step, p.商品名, "2");
  let 名前 = "", 郵便番号 = "", 電話 = "";
  await step(3, async () => {
    名前 = (await flow.注文主の名前.innerText()).replace(/\s+/g, " ").trim();
    郵便番号 = (await flow.注文主の郵便番号.innerText()).replace(/\s+/g, "");
    電話 = (await flow.注文主の電話番号.innerText()).replace(/\s+/g, "");
  });
  await expected(async () => {
    expect.soft(名前, "ご注文主の名前").toContain("表示五九 会員");
    expect.soft(郵便番号, "ご注文主の郵便番号").toContain("160-0059");
    expect.soft(電話, "ご注文主の電話番号").toContain("03-0506-0059");
  });
});

caseTest("IT-F05-06-060", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-PRODUCT-060", [["L", 2]]);
  const p = f0506商品("L");
  await カートから記入画面へ(flow, step, p.商品名, "2");
  let 行: Awaited<ReturnType<PurchaseFlowPage["注文の商品"]>> = [];
  await step(3, async () => { 行 = await flow.注文の商品(); });
  await expected(async () => {
    expect.soft(行.length, "ご注文の商品の行数").toBe(1);
    expect.soft(行[0]?.商品コード, "ご注文の商品の商品コード").toBe(p.商品コード);
    expect.soft(行[0]?.商品名, "ご注文の商品の商品名").toBe(p.商品名);
    expect.soft(行[0]?.数量, "ご注文の商品の数量").toBe("2");
  });
});

caseTest("IT-F05-06-061", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-AMOUNT-061", [["L", 2]]);
  const p = f0506商品("L");
  await カートから記入画面へ(flow, step, p.商品名, "2");
  note("手順3の「ご注文の商品の合計」は、ご注文の商品の行の「合計」欄、「申込時買取金額合計」は、画面の「買取金額合計」と読んだ");
  let 行の合計 = "", 合計 = "";
  await step(3, async () => {
    行の合計 = digits((await flow.注文の商品())[0]?.合計 ?? "");
    合計 = digits(await flow.買取金額合計.innerText());
  });
  await expected(async () => {
    expect.soft(行の合計, "ご注文の商品の合計（NMの買取価格100に数量2を掛けた値）").toBe("200");
    expect.soft(合計, "申込時買取金額合計").toBe("200");
  });
});

caseTest("IT-F05-06-076", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-DP-MEMBER-076", [["DPQ-A", 2], ["DPQ-B", 2]]);
  const a = f0506商品("DPQ-A");
  note("購入上限5はDBで設定する前提（正本）だが設定していない。このケースは購入上限に関係なく、合計金額だけを確かめる");
  await step(1, async () => {
    await flow.カートを開く();
    await expect(flow.数量欄(a.商品名), "買取カートの商品Aの数量").toHaveValue("2");
  });
  await step(2, async () => {
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
  });
  note("手順3の「ご注文の商品の合計」は、ご注文の商品の行の「合計」欄を足した値、「申込時買取金額合計」は、画面の「買取金額合計」と読んだ");
  let 行の合計 = 0, 合計 = "";
  await step(3, async () => {
    for (const r of await flow.注文の商品()) 行の合計 += Number(digits(r.合計));
    合計 = digits(await flow.買取金額合計.innerText());
  });
  await expected(async () => {
    expect.soft(行の合計, "ご注文の商品の合計（100×2＋200×2）").toBe(600);
    expect.soft(合計, "申込時買取金額合計").toBe("600");
  });
});

// ---- 068: 申込みの前にカートが空になった ----

caseTest("IT-F05-06-068", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-CARTLOST-068", [["L", 2]]);
  const p = f0506商品("L");
  await step(1, async () => {
    await flow.カートを開く();
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "タブ1の買取依頼内容の記入画面").toBeVisible();
  });
  await step(2, async () => { await flow.入力する(通常申込入力値); });
  note("「申込み」ボタンを押す前に、タブ2（同じブラウザの別タブ）でカートを操作した。手順3の「数量を0にして」は、数量の欄に0を入れた（画面は欄から外れたときに数量を1へ丸める）");
  const tab2 = new PurchaseFlowPage(await page.context().newPage());
  await step(3, async () => {
    await tab2.カートを開く();
    await tab2.数量を入れる(p.商品名, "0");
    await tab2.買取手続きへを押す();
    await tab2.カートを開く();
    await expect(tab2.カートの行, "買取カートが空になった（商品の行が0）").toHaveCount(0);
  });
  await step(4, async () => { await flow.申込みを押す(); });
  await step(5, async () => { await flow.モーダルの申込みを押す(); });
  await expected(async () => {
    expect.soft(flow.パス, "移った先の画面（カート画面）").toBe("/purchase/cart");
  });
});

// ---- 052〜058・073: 申込みを管理画面で確かめる ----

/** 手順1〜3: カートの確認 → 記入して「申込み」 → モーダルの「申込み」→ 完了画面。買取の番号（数字）を返す */
async function 申込む(flow: PurchaseFlowPage, step: Step, 商品名: string, 値: 記入の値): Promise<string> {
  await step(1, async () => {
    await flow.カートを開く();
    await expect(flow.数量欄(商品名), "買取カートの商品の数量").toHaveValue("2");
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
  });
  await step(2, async () => {
    await flow.入力する(値);
    await flow.申込みを押す();
  });
  let 番号 = "";
  await step(3, async () => {
    await flow.モーダルの申込みを押す();
    expect(flow.パス, "買取依頼完了の画面").toBe("/purchase/complete");
    番号 = await flow.完了した買取の番号();
  });
  return 番号;
}

const 番号の注記 = "共有の開発環境には前の実行の同じ氏名の買取が残るので、検索結果の行は、完了画面に出た買取番号で見分けた（検索は正本のとおり注文者名で行った）";

/** 管理画面にログインする別のブラウザ（ブラウザB） */
async function ブラウザBで(browser: Browser, account: { loginId: string; password: string }, fn: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await fn(page);
  } finally { await context.close(); }
}

type 連携の指定 = { seed: string; 会員の姓: string; 値?: Partial<記入の値>; 管理者: { loginId: string; password: string }; 商品キー?: string };

/** 連携ケースの共通の流れ（手順1〜6）。手順7が要るケースは after で続ける */
async function 連携する(
  ctx: Pick<CaseCtx, "page" | "browser" | "step">, 指定: 連携の指定,
  最後: "一覧を確認" | "編集を開く",
  after: (a: { page: Page; edit: Awaited<ReturnType<typeof 買取情報編集を開く>> | null; 一覧: Awaited<ReturnType<typeof 一覧の行を読む>> }) => Promise<void>,
): Promise<void> {
  const { page, browser, step } = ctx;
  const キー = 指定.商品キー ?? "L";
  const flow = await 準備する(page, 指定.seed, [[キー, 2]]);
  const 番号 = await 申込む(flow, step, f0506商品(キー).商品名, { ...通常申込入力値, ...指定.値 });
  note(番号の注記);
  await ブラウザBで(browser, 指定.管理者, async (admin) => {
    const list = new M0701ListPage(admin);
    await step(4, async () => {
      await loginAdmin(admin, 指定.管理者);
      await list.open();
    });
    await step(5, async () => {
      await list.注文者名を入れる(指定.会員の姓);
      await list.検索する();
    });
    let 一覧!: Awaited<ReturnType<typeof 一覧の行を読む>>;
    let edit: Awaited<ReturnType<typeof 買取情報編集を開く>> | null = null;
    if (最後 === "一覧を確認") {
      await step(6, async () => { 一覧 = await 一覧の行を読む(admin, list, 番号); });
    } else {
      await step(6, async () => {
        一覧 = await 一覧の行を読む(admin, list, 番号);
        expect(一覧.行の数, "検索結果に、今回の買取の行がある").toBe(1);
        edit = await 買取情報編集を開く(admin, list, 番号);
      });
    }
    await after({ page: admin, edit, 一覧 });
  });
}

const 姓の名 = (姓: string) => `${姓}買取`;

caseTest("IT-F05-06-052", async (ctx) => {
  await 連携する(ctx, { seed: "S-F05-06-L-MEMBER-052", 会員の姓: "連携甲", 管理者: F0506_L_ADMIN }, "一覧を確認", async ({ 一覧 }) => {
    await ctx.expected(async () => {
      expect.soft(一覧.行の数, "買取検索一覧の今回の買取の行数").toBe(1);
      expect.soft(一覧.氏名.replace(/\s/g, ""), "買取依頼者氏名").toBe(姓の名("連携甲"));
      expect.soft(一覧.買取状況, "買取状況").toBe("注文");
    });
  });
});

caseTest("IT-F05-06-053", async (ctx) => {
  await 連携する(ctx, { seed: "S-F05-06-L-MEMBER-053", 会員の姓: "連携乙", 値: { 箱数: "2" }, 管理者: F0506_L_ADMIN }, "一覧を確認", async ({ 一覧 }) => {
    await ctx.expected(async () => {
      expect.soft(一覧.行の数, "買取検索一覧の今回の買取の行数").toBe(1);
      expect.soft(一覧.氏名.replace(/\s/g, ""), "買取依頼者氏名").toBe(姓の名("連携乙"));
      expect.soft(一覧.箱数, "箱数").toMatch(/^2(\s*箱)?$/);
    });
  });
});

caseTest("IT-F05-06-054", async (ctx) => {
  await 連携する(ctx, { seed: "S-F05-06-L-MEMBER-054", 会員の姓: "連携丙", 管理者: F0506_L_ADMIN }, "一覧を確認", async ({ 一覧 }) => {
    await ctx.expected(async () => {
      expect.soft(一覧.行の数, "買取検索一覧の今回の買取の行数").toBe(1);
      expect.soft(一覧.明細.map((m) => m.商品名), "買取詳細の商品名").toEqual([f0506商品("L").商品名]);
      expect.soft(一覧.明細.map((m) => m.数量), "買取詳細の数量").toEqual(["2"]);
      expect.soft(digits(一覧.申込時買取金額合計), "申込時買取金額合計（NMの申込時買取価格100に数量2を掛けた値）").toBe("200");
    });
  });
});

caseTest("IT-F05-06-055", async (ctx) => {
  await 連携する(ctx, { seed: "S-F05-06-L-MEMBER-055", 会員の姓: "連携丁", 管理者: F0506_L_ADMIN }, "編集を開く", async ({ page }) => {
    let 情報!: Awaited<ReturnType<typeof 依頼者情報を読む>>;
    await ctx.step(7, async () => { 情報 = await 依頼者情報を読む(page); });
    await ctx.expected(async () => {
      expect.soft(情報.都道府県, "都道府県").toBe("東京都");
      expect.soft(情報.住所1, "住所1").toBe("新宿区");
      expect.soft(情報.住所2, "住所2").toBe("西新宿1-1-1");
      expect.soft(情報.住所3, "住所3").toBe("連携ビル004");
      expect.soft(情報.メール, "E-mail").toBe(`${rc("it-f0506-l-004")}@example.test`);
      expect.soft(情報.職業, "職業").toBe("会社員");
    });
  });
});

caseTest("IT-F05-06-056", async (ctx) => {
  await 連携する(ctx, {
    seed: "S-F05-06-L-MEMBER-056", 会員の姓: "連携戊", 値: { 適格請求書発行事業者: true, 登録番号: "T1234567890123" }, 管理者: F0506_L_ADMIN,
  }, "編集を開く", async ({ page, edit }) => {
    let 口座!: Awaited<ReturnType<typeof 口座情報を読む>>;
    let 基本!: Awaited<ReturnType<NonNullable<typeof edit>["基本情報"]>>;
    await ctx.step(7, async () => { 口座 = await 口座情報を読む(page); 基本 = await edit!.基本情報(); });
    await ctx.expected(async () => {
      expect.soft(口座.銀行名, "銀行名").toBe("晴銀行");
      expect.soft(口座.支店名, "支店名").toBe("本店");
      expect.soft(口座.口座種別, "口座種別").toBe("普通");
      expect.soft(口座.口座番号, "口座番号").toBe("1234567");
      expect.soft(口座.口座名義, "口座名義").toBe("ハレヤタロウ");
      expect.soft(基本.事業者, "適格請求書発行事業者情報（事業者状況）").toBe("事業者");
      expect.soft(基本.登録番号, "事業者番号").toBe("T1234567890123");
    });
  });
});

caseTest("IT-F05-06-057", async (ctx) => {
  await 連携する(ctx, {
    seed: "S-F05-06-L-MEMBER-057", 会員の姓: "連携己", 値: { 承諾方法: "自動承諾を利用する" }, 管理者: F0506_L_ADMIN,
  }, "編集を開く", async ({ edit }) => {
    note("買取情報編集画面の「買取の承諾方法」は、自動承諾の買取では「自動承諾」と表示される（申込画面の選択肢の名前「自動承諾を利用する」よりも短い表示）。「自動承諾」の表示で確かめた");
    let 承諾 = "";
    await ctx.step(7, async () => { 承諾 = (await edit!.基本情報()).承諾方法; });
    await ctx.expected(async () => {
      expect.soft(承諾, "買取の承諾方法").toContain("自動承諾");
      expect.soft(承諾, "買取の承諾方法（手動承諾ではない）").not.toContain("手動");
    });
  });
});

caseTest("IT-F05-06-058", async (ctx) => {
  await 連携する(ctx, { seed: "S-F05-06-L-MEMBER-058", 会員の姓: "連携庚", 管理者: F0506_L_ADMIN }, "編集を開く", async ({ page, edit }) => {
    let 行!: Awaited<ReturnType<typeof 明細の申込時買取価格を読む>>;
    await ctx.step(7, async () => { 行 = await 明細の申込時買取価格を読む(page, edit!, f0506商品("L").商品コード); });
    await ctx.expected(async () => {
      expect.soft(行.行の数, "商品コード「F0506L-A」の行の数").toBe(1);
      expect.soft(行.商品名, "商品名").toBe(f0506商品("L").商品名);
      expect.soft(行.数量, "数量").toBe("2");
      expect.soft(digits(行.申込時買取価格), "申込時買取価格").toBe("100");
    });
  });
});

caseTest("IT-F05-06-073", async (ctx) => {
  const { page, browser, step } = ctx;
  const キー = "PD";
  const flow = await 準備する(page, "S-F05-06-PD-MEMBER-073", [[キー, 2]]);
  const 番号 = await 申込む(flow, step, f0506商品(キー).商品名, 通常申込入力値);
  note(番号の注記);
  await ブラウザBで(browser, F0506_PD_ADMIN, async (admin) => {
    const list = new M0701ListPage(admin);
    await step(4, async () => { await loginAdmin(admin, F0506_PD_ADMIN); await list.open(); });
    await step(5, async () => { await list.注文者名を入れる("履歴丁"); await list.検索する(); });
    let edit!: Awaited<ReturnType<typeof 買取情報編集を開く>>;
    await step(6, async () => {
      expect((await list.行()).filter((r) => r.番号 === String(Number(番号))).length, "検索結果に、今回の買取の行がある").toBe(1);
      edit = await 買取情報編集を開く(admin, list, 番号);
    });
    let 履歴: Awaited<ReturnType<typeof edit.履歴の行>> = [];
    await step(7, async () => {
      if (!(await edit.履歴が見えるか())) await edit.履歴の開閉アイコンを押す();
      履歴 = await edit.履歴の行();
    });
    await ctx.expected(async () => {
      expect.soft(履歴.length, "ステータス変更履歴の行数（申込で作成された履歴）").toBeGreaterThanOrEqual(1);
      expect.soft(履歴.some((r) => r.ステータス === "注文"), "申込で作成された履歴のステータス「注文」の行がある").toBe(true);
    });
  });
});

// =====================================================================================================
// 2026-11-12 追加: S-F05-06-SETTINGS（まとめて買取商品IDの共有設定を書き換える）を使うケース。夜の1本流しだけで流す。
// 事前準備の「ログイン済み・正常申込カート」は、ケースの冒頭で会員ログインし、商品A×1・商品B×2・商品C（まとめて買取）×1 を買取カートへ入れて用意する。
// =====================================================================================================

/** 正常申込カート（S-F05-06-CART-BASE の商品A×1・B×2・C×1） */
const 正常申込カート: [string, number][] = [["A", 1], ["B", 2], ["C", 1]];

/** 正本の適格事業者・自動承諾入力値（S-F05-06-INPUT-INVOICE） */
const 適格入力値: 記入の値 = {
  銀行名: "晴銀行", 支店名: "中央支店", 口座種別: "当座", 口座番号: "7654321", 口座名義: "ハレヤタロウ", 箱数: "20",
  承諾方法: "自動承諾を利用する", 適格請求書発行事業者: true, 登録番号: "T1234567890123", 規約同意: true,
};

/** 手順「会員で買取依頼内容の記入画面へ進む」（買取カートを開いて「買取手続きへ」） */
async function 記入画面へ(flow: PurchaseFlowPage, step: Step, n = 1): Promise<void> {
  await step(n, async () => {
    await flow.カートを開く();
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
  });
}

type 申込の手順 = { 入力: number; 押す: number; モーダル: number };
/** 記入画面で入力 →「申込み」→ モーダルの「申込み」→ 完了画面。完了画面の買取番号（数字）を返す */
async function 申込んで完了まで(flow: PurchaseFlowPage, step: Step, 手順: 申込の手順, 入れる: () => Promise<void>): Promise<string> {
  if (手順.入力 === 手順.押す) {
    await step(手順.入力, async () => { await 入れる(); await flow.申込みを押す(); });
  } else {
    await step(手順.入力, async () => { await 入れる(); });
    await step(手順.押す, async () => { await flow.申込みを押す(); });
  }
  let 番号 = "";
  await step(手順.モーダル, async () => {
    await flow.モーダルの申込みを押す();
    expect(flow.パス, "買取依頼完了の画面").toBe("/purchase/complete");
    番号 = await flow.完了した買取の番号();
  });
  return 番号;
}

/** 会員の事前準備（ログイン・正常申込カート）→ 手順1（記入画面へ）までのよくある形 */
async function 正常申込で記入画面へ(page: Page, step: Step, seedId: string, カート: [string, number][] = 正常申込カート): Promise<PurchaseFlowPage> {
  const flow = await 準備する(page, seedId, カート);
  await 記入画面へ(flow, step, 1);
  return flow;
}

const 縦の位置 = async (l: import("@playwright/test").Locator): Promise<number> => (await l.boundingBox())?.y ?? Number.NaN;

// ---- 002・004 ログインへの遷移 ----

caseTest("IT-F05-06-002", async ({ page, step, expected }) => {
  const flow = new PurchaseFlowPage(page);
  for (const [キー, 数量] of 正常申込カート) { const p = f0506商品(キー); await flow.カートへ追加する(p.商品ID, p.規格ID, 数量); }
  note("事前準備の未ログインの買取カートは、ケースの冒頭でログインせずに商品A×1・B×2・C×1 を買取カートへ入れて用意した（シード表の商品ID 50601・50603・50604 を S-F05-06-CART-BASE の商品に読み替えた）");
  await step(1, async () => { await flow.カートを開く(); });
  await step(2, async () => { await flow.買取手続きへを押す(); });
  await expected(async () => { expect.soft(flow.パス, "移った先の画面（買取ログイン画面）").toBe("/purchase/login"); });
});

caseTest("IT-F05-06-004", async ({ page, step, expected }) => {
  const flow = new PurchaseFlowPage(page);
  for (const [キー, 数量] of 正常申込カート) { const p = f0506商品(キー); await flow.カートへ追加する(p.商品ID, p.規格ID, 数量); }
  const m = f0506会員("S-F05-06-MEMBER-004");
  note("事前準備のログアウト状態の買取カートは、ケースの冒頭でログインせずに買取カートへ入れて用意した。手順1のログインは会員ログイン画面で行った");
  await step(1, async () => { await flow.会員ログインする(m.メール, m.パスワード); });
  await step(2, async () => { await flow.買取ログイン画面を開く(); });
  await expected(async () => { expect.soft(flow.パス, "移った先の画面（買取依頼内容の記入画面）").toBe("/purchase/fill"); });
});

// ---- 009・011・012・017・024・080〜082 記入画面の表示 ----

caseTest("IT-F05-06-009", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-009");
  let 住所 = "";
  await step(2, async () => { 住所 = (await flow.注文主の住所.innerText()).replace(/\s+/g, " ").trim(); });
  await expected(async () => { expect.soft(住所, "ご注文主の住所").toContain("ITビル506"); });
});

caseTest("IT-F05-06-011", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-MISSING-011");
  let 口座!: Awaited<ReturnType<PurchaseFlowPage["口座の入力値"]>>;
  await step(2, async () => { 口座 = await flow.口座の入力値(); });
  await expected(async () => {
    expect.soft(口座.銀行名, "銀行名の欄（空）").toBe("");
    expect.soft(口座.支店名, "支店名の欄（空）").toBe("");
    expect.soft(口座.口座番号, "口座番号の欄（空）").toBe("");
    expect.soft(口座.口座名義, "口座名義の欄（空）").toBe("");
    await expect.soft(flow.銀行名の欄, "銀行名の欄（新規入力できる）").toBeEditable();
  });
});

caseTest("IT-F05-06-012", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-MISSING-012");
  await expected(async () => {
    await expect.soft(flow.職業の欄, "職業の入力フォーム").toBeVisible();
    await expect.soft(flow.生年月日の欄, "生年月日の入力フォーム").toBeVisible();
    const 銀行 = await 縦の位置(flow.銀行名の欄);
    expect.soft(await 縦の位置(flow.職業の欄) < 銀行, "職業の入力フォームがお振込口座情報（銀行名の欄）より上にある").toBe(true);
    expect.soft(await 縦の位置(flow.生年月日の欄) < 銀行, "生年月日の入力フォームがお振込口座情報（銀行名の欄）より上にある").toBe(true);
  });
});

caseTest("IT-F05-06-017", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-017");
  await step(2, async () => { await flow.事業者を選ぶ(true); });
  await expected(async () => { await expect.soft(flow.登録番号の欄, "登録番号の入力フォーム").toBeVisible(); });
});

caseTest("IT-F05-06-024", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-024");
  await step(2, async () => { await flow.適格の説明リンク.click(); });
  await expected(async () => {
    await expect.soft(flow.適格の説明モーダル, "適格請求書発行事業者についてのモーダル").toBeVisible();
    expect.soft(await flow.適格の説明モーダル.locator("img").count(), "モーダルの中の画像の数").toBeGreaterThan(0);
  });
});

caseTest("IT-F05-06-080", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-080");
  await expected(async () => {
    await expect.soft(flow.職業の欄, "職業の入力フォーム（表示される）").toBeVisible();
    expect.soft(await 縦の位置(flow.職業の欄) < await 縦の位置(flow.銀行名の欄), "職業の入力フォームがお振込口座情報（銀行名の欄）より上にある").toBe(true);
    await expect.soft(flow.生年月日の欄, "生年月日の入力フォーム（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F05-06-081", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-081");
  await expected(async () => {
    await expect.soft(flow.生年月日の欄, "生年月日の入力フォーム（表示される）").toBeVisible();
    expect.soft(await 縦の位置(flow.生年月日の欄) < await 縦の位置(flow.銀行名の欄), "生年月日の入力フォームがお振込口座情報（銀行名の欄）より上にある").toBe(true);
    await expect.soft(flow.職業の欄, "職業の入力フォーム（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F05-06-082", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-082");
  await step(2, async () => { await flow.事業者を選ぶ(false); await flow.事業者を選ぶ(true); });
  await expected(async () => {
    await expect.soft(flow.登録番号の欄, "登録番号欄（表示される）").toBeVisible();
    await expect.soft(flow.登録番号の欄, "登録番号欄（空）").toHaveValue("");
  });
});

// ---- 027〜029 申込みの確認モーダル ----

caseTest("IT-F05-06-027", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-027");
  await step(2, async () => { await flow.入力する({ ...通常申込入力値, 承諾方法: "査定結果を確認してから承諾する" }); });
  await step(3, async () => { await flow.申込みを押す(); });
  await expected(async () => {
    await expect.soft(flow.確認モーダル, "申込モーダル").toHaveClass(/is-active/);
    await expect.soft(flow.モーダルの承諾方法, "申込モーダルの買取の承諾方法").toHaveText("査定結果を確認してから承諾する");
  });
});

caseTest("IT-F05-06-028", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-028");
  await step(2, async () => { await flow.入力する(適格入力値); });
  await step(3, async () => { await flow.申込みを押す(); });
  await expected(async () => {
    await expect.soft(flow.確認モーダル, "申込モーダル").toHaveClass(/is-active/);
    await expect.soft(flow.モーダルの承諾方法, "申込モーダルの買取の承諾方法").toHaveText("自動承諾を利用する");
  });
});

caseTest("IT-F05-06-029", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-029");
  await step(2, async () => { await flow.入力する(通常申込入力値); await flow.申込みを押す(); });
  await step(3, async () => { await flow.モーダルの入力に戻る.click(); });
  await expected(async () => {
    await expect.soft(flow.確認モーダル, "申込モーダル（閉じた）").not.toHaveClass(/is-active/);
    await expect.soft(flow.確認モーダル, "申込モーダル（表示されない）").toBeHidden();
  });
});

// ---- 034・067 箱数の警告 ----

caseTest("IT-F05-06-034", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-034");
  await step(2, async () => { await flow.箱数を選ぶ("3"); });
  await expected(async () => {
    await expect.soft(flow.箱数の警告, "査定期間が延長されうる旨の警告").toBeVisible();
    await expect.soft(flow.箱数の警告, "警告の文").toContainText("査定期間が延長");
  });
});

caseTest("IT-F05-06-067", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-BOX2-067");
  await step(2, async () => { await flow.箱数を選ぶ("2"); });
  let 表示 = true;
  await step(3, async () => { 表示 = await flow.箱数の警告.isVisible(); });
  await expected(async () => {
    expect.soft(表示, "箱数付近の警告「箱数が多い場合、査定期間が延長されることがあります。」が表示されている").toBe(false);
    await expect.soft(flow.箱数の警告, "警告（表示されない）").toBeHidden();
  });
});

// ---- 015 職業・生年月日の更新 ----

caseTest("IT-F05-06-015", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-MISSING-015");
  await 申込んで完了まで(flow, step, { 入力: 2, 押す: 3, モーダル: 4 }, () => flow.入力する({ ...通常申込入力値, 職業: "会社員", 生年月日: ["1990", "1", "2"] }));
  const m = f0506会員("S-F05-06-MEMBER-MISSING-015");
  let 会員!: ReturnType<typeof 会員の職業と生年月日>;
  await step(5, async () => { 会員 = 会員の職業と生年月日(m.会員ID); });
  await expected(async () => {
    expect.soft(会員.職業, "会員情報の職業").toBe("会社員");
    expect.soft(会員.生年月日, "会員情報の生年月日").toBe("1990-01-02");
  });
});

// ---- 023・030・033・037・062 振込口座・事業者番号の保存 ----

caseTest("IT-F05-06-023", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-023");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(適格入力値));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(4, async () => { 受注 = 買取受注を読む(番号); });
  await expected(async () => {
    expect.soft(受注.事業者番号, "新規買取受注に紐づく登録番号（14文字）").toBe("T1234567890123");
    expect.soft(事業者情報の件数(番号), "新規買取受注に紐づく適格請求書発行事業者情報の件数").toBe(1);
  });
});

caseTest("IT-F05-06-030", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-030");
  const 名義 = "ア".repeat(128);
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 3, モーダル: 4 }, () => flow.入力する({ ...通常申込入力値, 口座番号: "1234567", 口座名義: 名義 }));
  let 口座: ReturnType<typeof 振込口座を読む> = null;
  await step(5, async () => { 口座 = 振込口座を読む(番号); });
  await expected(async () => {
    expect.soft(口座?.口座番号, "口座番号（7桁）").toBe("1234567");
    expect.soft(口座?.口座名義, "口座名義（128文字）").toBe(名義);
  });
});

caseTest("IT-F05-06-033", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-033");
  const v: 記入の値 = { ...通常申込入力値, 銀行名: "晴Bank", 支店名: "本店1", 口座種別: "貯蓄", 口座番号: "1234567", 口座名義: "ﾊﾚﾔ太郎" };
  note("手順2の振込口座と、手順3の残りの値（通常申込入力値）は、記入画面の入力の部品でまとめて入れ、手順3で「申込み」を押した");
  await step(2, async () => { await flow.入力する(v); });
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 3, 押す: 3, モーダル: 4 }, async () => { /* 手順2で入れた */ });
  let 口座: ReturnType<typeof 振込口座を読む> = null;
  await step(5, async () => { 口座 = 振込口座を読む(番号); });
  await expected(async () => {
    expect.soft(口座?.銀行名, "銀行名").toBe("晴Bank");
    expect.soft(口座?.支店名, "支店名").toBe("本店1");
    expect.soft(口座?.口座名義, "口座名義").toBe("ﾊﾚﾔ太郎");
  });
});

caseTest("IT-F05-06-037", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-037");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let 口座: ReturnType<typeof 振込口座を読む> = null;
  await step(4, async () => { 口座 = 振込口座を読む(番号); });
  await expected(async () => {
    expect.soft(口座, "新規買取受注に紐づく振込口座情報").toEqual({ 銀行名: "晴銀行", 支店名: "本店", 口座種別: "普通", 口座番号: "1234567", 口座名義: "ハレヤタロウ" });
  });
});

caseTest("IT-F05-06-062", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-ACCTTYPE-062");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する({ ...通常申込入力値, 口座種別: "当座" }));
  let 口座: ReturnType<typeof 振込口座を読む> = null;
  await step(4, async () => { 口座 = 振込口座を読む(番号); });
  await expected(async () => {
    expect.soft(口座, "新規買取受注に紐づく振込口座情報").toEqual({ 銀行名: "晴銀行", 支店名: "本店", 口座種別: "当座", 口座番号: "1234567", 口座名義: "ハレヤタロウ" });
  });
});

// ---- 035・063 箱数の記録 ----

caseTest("IT-F05-06-035", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-035");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 3, モーダル: 4 }, () => flow.入力する({ ...通常申込入力値, 箱数: "3" }));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(5, async () => { 受注 = 買取受注を読む(番号); });
  await expected(async () => { expect.soft(受注.箱数, "買取受注の箱数").toBe("3"); });
});

caseTest("IT-F05-06-063", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-BOX20-063");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 3, モーダル: 4 }, () => flow.入力する({ ...通常申込入力値, 箱数: "20" }));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(5, async () => { 受注 = 買取受注を読む(番号); });
  await expected(async () => { expect.soft(受注.箱数, "買取受注の箱数").toBe("20"); });
});

// ---- 036 買取受注へ写す会員の情報 ----

caseTest("IT-F05-06-036", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-036");
  const m = f0506会員("S-F05-06-MEMBER-036");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(4, async () => { 受注 = 買取受注を読む(番号); });
  note("「買取用の送金方法」は、買取受注に送金方法が設定されている（空でない）ことと、その名前を確かめた。郵便番号・電話番号は数字だけで比べた。メールアドレスは実行の印を付けた値");
  await expected(async () => {
    expect.soft(会員の買取受注(m.会員ID).length, "この会員の買取受注の件数").toBe(1);
    expect.soft(受注.状態, "状態").toBe("注文");
    expect.soft(受注.送金方法, "送金方法（買取用。空でない）").not.toBe("");
    expect.soft([受注.姓, 受注.名], "氏名").toEqual(["結合", "買取"]);
    expect.soft([受注.セイ, 受注.メイ], "フリガナ").toEqual(["ケツゴウ", "カイトリ"]);
    expect.soft(受注.メール, "メールアドレス").toBe(m.メール);
    expect.soft(digits(受注.郵便番号), "郵便番号").toBe("1600023");
    expect.soft(受注.都道府県, "都道府県").toBe("東京都");
    expect.soft(受注.住所1, "住所1").toBe("新宿区");
    expect.soft(受注.住所2, "住所2").toBe("西新宿1-1-1");
    expect.soft(受注.住所3, "住所3").toBe("ITビル506");
    expect.soft(digits(受注.電話番号), "電話番号").toBe("0312345678");
    expect.soft(受注.職業, "職業").toBe("会社員");
    expect.soft(受注.生年月日, "生年月日").toBe("1990-01-02");
  });
});

// ---- 038〜041 明細・申込時買取価格・メモ・履歴 ----

caseTest("IT-F05-06-038", async ({ page, step, expected, notes }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-038");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let 明細: ReturnType<typeof 明細を読む> = [];
  await step(4, async () => { 明細 = 明細を読む(番号); });
  await expected(async () => {
    const 数量 = (id: string) => 明細.filter((r) => r.商品ID === id).map((r) => r.数量);
    expect.soft(数量(notes.get("〔商品ID-F0506-共有A〕")), "選んで買取の商品A の明細の数量").toEqual(["1"]);
    expect.soft(数量(notes.get("〔商品ID-F0506-共有B〕")), "選んで買取の商品B の明細の数量").toEqual(["2"]);
    expect.soft(数量(notes.get("〔商品ID-F0506-共有C〕")), "まとめて買取の商品C の明細の数量").toEqual(["1"]);
    expect.soft(明細.length, "明細の行数").toBe(3);
  });
});

caseTest("IT-F05-06-039", async ({ page, step, expected, notes }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-039");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let F0506A: Record<string, string> = {}, F0506B: Record<string, string> = {};
  await step(4, async () => {
    F0506A = 申込時買取価格を読む(番号, notes.get("〔商品ID-F0506-共有B〕"));
    F0506B = 申込時買取価格を読む(番号, notes.get("〔商品ID-F0506-共有A〕"));
  });
  note("商品コード F0506-A は〔商品ID-F0506-共有B〕、F0506-B は〔商品ID-F0506-共有A〕の商品（シード表の定め）。状態はカード状態の略号で比べた");
  await expected(async () => {
    expect.soft(F0506A, "商品コード F0506-A の申込時買取価格（日本語）").toEqual({ NM: "100", SP: "70", MP: "40" });
    expect.soft(F0506B, "商品コード F0506-B の申込時買取価格（日本語）").toEqual({ NM: "200", SP: "150", MP: "100" });
  });
});

caseTest("IT-F05-06-040", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-040", [["D", 2], ["E", 3], ["C", 4]]);
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let メモ = "";
  await step(4, async () => { メモ = 買取受注を読む(番号).メモ; });
  note("商品名には実行の印を付けてあるので、メモの「ITパックx2」「ITサプライx3」も印を付けた商品名で比べた");
  await expected(async () => {
    expect.soft(メモ.split(/\r?\n/), "メモの行（ITパックx2 と ITサプライx3 を改行で連ねた値）").toEqual([`${f0506商品("D").商品名}x2`, `${f0506商品("E").商品名}x3`]);
    expect.soft(メモ.includes(f0506商品("C").商品名), "メモにまとめて買取の商品が含まれる").toBe(false);
  });
});

caseTest("IT-F05-06-041", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-041");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let n = 0;
  await step(4, async () => { n = ステータス変更履歴の件数(番号); });
  await expected(async () => { expect.soft(n, "新規買取受注に対応する買取ステータス変更履歴の件数").toBeGreaterThanOrEqual(1); });
});

// ---- 042・078・079 自動承諾・事業者情報 ----

caseTest("IT-F05-06-042", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-042");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 3, モーダル: 4 }, () => flow.入力する(適格入力値));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(5, async () => { 受注 = 買取受注を読む(番号); });
  await expected(async () => { expect.soft(受注.自動承諾, "新規買取受注の自動承諾").toBe(true); });
});

caseTest("IT-F05-06-078", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-078");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する({ ...通常申込入力値, 承諾方法: "査定結果を確認してから承諾する" }));
  let 受注!: ReturnType<typeof 買取受注を読む>;
  await step(4, async () => { 受注 = 買取受注を読む(番号); });
  await expected(async () => { expect.soft(受注.自動承諾, "新規買取受注の自動承諾").toBe(false); });
});

caseTest("IT-F05-06-079", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-079");
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する({ ...通常申込入力値, 適格請求書発行事業者: false }));
  let n = -1;
  await step(4, async () => { n = 事業者情報の件数(番号); });
  await expected(async () => { expect.soft(n, "新規買取受注に紐づく適格請求書発行事業者情報の件数").toBe(0); });
});

// ---- 043・069 買取番号 ----

caseTest("IT-F05-06-043", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-MEMBER-043");
  await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let 表示 = "";
  await step(4, async () => { 表示 = /PU[\d-]+/.exec((await flow.完了画面の買取番号.innerText()).replace(/\s+/g, ""))?.[0] ?? ""; });
  const m = f0506会員("S-F05-06-MEMBER-043");
  let 受注ID = "";
  await step(5, async () => { 受注ID = 会員の買取受注(m.会員ID)[0] ?? ""; });
  const 日 = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "2-digit", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\D/g, "");
  note("実行日の年月日6桁は、期待結果を確かめた時点の日本時間の日付（年の下2桁・月・日）で作った");
  await expected(async () => {
    expect.soft(表示, "完了画面の買取番号（PU＋実行日の年月日6桁＋ハイフン＋DBの受注IDを10桁ゼロ詰め）").toBe(`PU${日}-${受注ID.padStart(10, "0")}`);
  });
});

caseTest("IT-F05-06-069", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-COMPLETE-069", 正常申込カート);
  await step(1, async () => {
    await flow.カートを開く();
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
    await flow.入力する(通常申込入力値);
    await flow.申込みを押す();
  });
  await step(2, async () => { await flow.モーダルの申込みを押す(); expect(flow.パス, "買取依頼完了の画面").toBe("/purchase/complete"); });
  let 最初 = "";
  await step(3, async () => { 最初 = /PU[\d-]+/.exec((await flow.完了画面の買取番号.innerText()).replace(/\s+/g, ""))?.[0] ?? ""; expect(最初, "完了画面のオーダーＩＤ").not.toBe(""); });
  let 再表示の応答 = 0;
  await step(4, async () => {
    再表示の応答 = (await page.reload({ timeout: 60_000, waitUntil: "load" }))?.status() ?? 0;
    note(`再読み込みの応答 ${再表示の応答}・再表示後の画面 ${page.url()}`);
  });
  note("「オーダーＩＤ」は、完了画面の「買取番号」（PUyymmdd-10桁）と読んだ");
  await expected(async () => {
    // 画面の誤り（500番台）や応答なしで番号が出ないのは確かめにならないので、画面が返ったことも見る
    expect.soft(再表示の応答, "再表示の応答が返った").toBeGreaterThan(0);
    expect.soft(再表示の応答, "再表示の応答が画面の誤り（500番台）でない").toBeLessThan(500);
    const 本文 = (await page.locator("body").innerText()).replace(/\s+/g, "");
    expect.soft(本文.includes(最初), `再表示後の画面に最初のオーダーＩＤ（${最初}）が表示されている`).toBe(false);
  });
});

// ---- 044・045 買取受注完了メール ----

async function 完了してメールを待つ(page: Page, step: Step, seedId: string): Promise<{ 宛先: string; 前: Set<number> }> {
  const 前 = await mailIds();
  const flow = await 正常申込で記入画面へ(page, step, seedId);
  await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  return { 宛先: f0506会員(seedId).メール, 前 };
}

caseTest("IT-F05-06-044", async ({ page, step, expected }) => {
  const { 宛先, 前 } = await 完了してメールを待つ(page, step, "S-F05-06-MEMBER-044");
  let 届いた: { id: number; subject: string }[] = [];
  await step(4, async () => {
    await waitForMailTo(宛先, 前, 120_000).catch(() => null);
    await page.waitForTimeout(5_000); // 続けて届くメールも数える
    届いた = await mailsTo(宛先, 前);
  });
  note(`試験用メール受信画面は、E2E が読むメールの受け口の一覧で読んだ。宛先は実行の印を付けたメールアドレス（${宛先}）。受信件数の0件は、ケースの前に控えたメールの番号より後に届いたものだけを数えることで作った`);
  await expected(async () => {
    expect.soft(届いた.length, `${宛先} 宛てのメールの受信件数（件名: ${届いた.map((m) => m.subject).join("・") || "なし"}）`).toBe(1);
  });
});

caseTest("IT-F05-06-045", async ({ page, step, expected }) => {
  const 前 = await mailIds();
  await 買取依頼を完了する(page, step, "S-F05-06-MEMBER-045");
  const 宛先 = f0506会員("S-F05-06-MEMBER-045").メール;
  let 本文 = "";
  await step(2, async () => {
    const m = await waitForMailTo(宛先, 前, 120_000);
    const list = await mailsTo(宛先, 前);
    本文 = list.length ? await mailText(list[list.length - 1].id) : m.text;
  });
  const 位置: number[] = [];
  await step(3, async () => {
    for (const k of ["A", "B", "C"]) {
      const p = f0506商品(k);
      const i = 本文.indexOf(p.商品名);
      位置.push(i >= 0 ? i : 本文.indexOf(p.商品コード));
    }
  });
  note("買取明細の商品の並びは、メール本文に出る商品名（無ければ商品コード）の位置で読んだ。商品名・商品コードには実行の印を付けてある");
  await expected(async () => {
    expect.soft(位置.every((i) => i >= 0), `買取明細に商品A・B・C が載っている（位置 ${位置.join("・")}）`).toBe(true);
    expect.soft(位置[0] < 位置[1] && 位置[1] < 位置[2], "買取明細が商品ID〔商品ID-F0506-共有A〕・〔商品ID-F0506-共有B〕・〔商品ID-F0506-共有C〕の順に並ぶ").toBe(true);
  });
});

// ---- 048〜051 完了画面のあと ----

caseTest("IT-F05-06-048", async ({ page, step, expected }) => {
  const flow = await 準備する(page, "S-F05-06-MEMBER-048", 正常申込カート);
  await step(1, async () => {
    await flow.カートを開く();
    await flow.買取手続きへを押す();
    await flow.入力する(通常申込入力値);
    await flow.申込みを押す();
    await flow.モーダルの申込みを押す();
    expect(flow.パス, "買取依頼完了の画面").toBe("/purchase/complete");
  });
  await step(2, async () => { await flow.カートを開く(); });
  await expected(async () => {
    await expect.soft(flow.カートの行, "ネット買取カートの商品の行").toHaveCount(0);
    await expect.soft(flow.カートが空の案内, "カートが空である旨の案内").toBeVisible();
  });
});

async function 買取依頼を完了する(page: Page, step: Step, seedId: string): Promise<PurchaseFlowPage> {
  const flow = await 準備する(page, seedId, 正常申込カート);
  await step(1, async () => {
    await flow.カートを開く();
    await flow.買取手続きへを押す();
    await flow.入力する(通常申込入力値);
    await flow.申込みを押す();
    await flow.モーダルの申込みを押す();
    expect(flow.パス, "買取依頼完了の画面").toBe("/purchase/complete");
  });
  return flow;
}

caseTest("IT-F05-06-049", async ({ page, step, expected }) => {
  const flow = await 買取依頼を完了する(page, step, "S-F05-06-MEMBER-049");
  let 新しい: Page | null = null;
  await step(2, async () => {
    const [p] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }), flow.本人確認の画像リンク.locator("img").click()]);
    await p.waitForLoadState("load");
    新しい = p;
  });
  await expected(async () => {
    expect.soft(新しい !== null, "新しいウィンドウが開いた").toBe(true);
    expect.soft(新しい ? new URL((新しい as Page).url()).pathname : "", "新しいウィンドウの画面（オンライン本人確認について）").toMatch(/\/mypage\/identification/);
  });
});

caseTest("IT-F05-06-050", async ({ page, step, expected }) => {
  const flow = await 買取依頼を完了する(page, step, "S-F05-06-MEMBER-050");
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), flow.買取TOPへ.click({ noWaitAfter: true })]); });
  await expected(async () => { expect.soft(flow.パス, "移った先の画面（買取TOP）").toMatch(/^\/purchase\/?$/); });
});

caseTest("IT-F05-06-051", async ({ page, step, expected }) => {
  const flow = await 買取依頼を完了する(page, step, "S-F05-06-MEMBER-051");
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), flow.マイページへ.click({ noWaitAfter: true })]); });
  await expected(async () => { expect.soft(flow.パス, "移った先の画面（マイページ）").toMatch(/^\/mypage\/?$/); });
});

// =====================================================================================================
// 2026-11-13 追加: 077（カード詳細のある商品とない商品が混ざるカートのメモ）・083（完了後に同じ会員でもう一度申し込む）。
// どちらも S-F05-06-SETTINGS（共有の設定）を使わない。
// =====================================================================================================

caseTest("IT-F05-06-077", async ({ page, step, expected }) => {
  const flow = await 正常申込で記入画面へ(page, step, "S-F05-06-DP-MEMBER-077", [["L", 1], ["D", 2]]);
  const 番号 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  let メモ = "";
  await step(4, async () => { メモ = 買取受注を読む(番号).メモ; });
  note("商品名には実行の印を付けてあるので、メモの「ITパックx2」も印を付けた商品名で比べた。結合連携カードA（カード詳細あり）も印を付けた商品名で探した");
  await expected(async () => {
    expect.soft(メモ.split(/\r?\n/).filter((x) => x !== ""), "登録された買取受注のメモ（ITパックx2 だけ）").toEqual([`${f0506商品("D").商品名}x2`]);
    expect.soft(メモ.includes(f0506商品("L").商品名), "メモに結合連携カードA（カード詳細のある商品）が含まれる").toBe(false);
  });
});

caseTest("IT-F05-06-083", async ({ page, browser, step, expected }) => {
  const キー = "PD";
  const p = f0506商品(キー);
  const flow = await 準備する(page, "S-F05-06-DP-MEMBER-083", [[キー, 1]]);
  await 記入画面へ(flow, step, 1);
  const 一回目 = await 申込んで完了まで(flow, step, { 入力: 2, 押す: 2, モーダル: 3 }, () => flow.入力する(通常申込入力値));
  await step(4, async () => {
    note("買取価格が500円未満の商品は買取商品詳細に「カートに追加」ボタンが出ない（画面の作り）ので、買取商品詳細を開き、ボタンが送る追加の要求（同じ宛先・同じ値）を画面のスクリプトから送った（事前準備と同じ）");
    await flow.カートへ追加する(p.商品ID, p.規格ID, 1);
    await flow.カートを開く();
    await expect(flow.数量欄(p.商品名), "買取カートの商品の数量").toHaveValue("1");
    await flow.買取手続きへを押す();
    await expect(flow.記入画面の印, "買取依頼内容の記入画面").toBeVisible();
  });
  const 二回目 = await 申込んで完了まで(flow, step, { 入力: 5, 押す: 5, モーダル: 6 }, () => flow.入力する(通常申込入力値));
  note("共有の開発環境には前の実行の同じ氏名（重ね 買取）の買取が残るので、検索結果の行は、2回の完了画面に出た買取番号で見分けた（検索は正本のとおり注文者名「重ね」で行った）");
  let 番号の並び: string[] = [];
  await ブラウザBで(browser, F0506_PD_ADMIN, async (admin) => {
    const list = new M0701ListPage(admin);
    await step(7, async () => { await loginAdmin(admin, F0506_PD_ADMIN); await list.open(); });
    await step(8, async () => {
      await list.注文者名を入れる("重ね");
      await list.検索する();
      番号の並び = (await list.行()).map((r) => r.番号);
    });
  });
  note(`完了画面の買取番号: 1回目 ${一回目}・2回目 ${二回目}。検索結果の行の買取番号: ${番号の並び.join("、") || "（なし）"}`);
  await expected(async () => {
    const 今回 = 番号の並び.filter((n) => n === 一回目 || n === 二回目);
    expect.soft(今回.length, "注文者名に「重ね」を含む買取受注のうち、今回の2回の申込みの行の数").toBe(2);
    expect.soft(new Set(今回).size, "2行の買取番号が互いに異なる").toBe(2);
    expect.soft(一回目 !== 二回目, "1回目と2回目の完了画面の買取番号が異なる").toBe(true);
  });
});
