/**
 * F05-06 ネット買取 買取手続き〜完了（フロント）。正本: cases/F05-06_test_cases.tsv
 *
 * 実装したのは 001・052〜058・059〜061・068・073・076 の14件。残りは実装しない（理由は PM への報告に書いた）:
 * - まとめて買取商品ID（追加システム設定。共有の開発環境で全員が使う1件の設定）を書き換える S-F05-06-SETTINGS を使う41件
 * - 購入上限・買取価格なしの商品や職業・生年月日が未登録の会員など DB での準備に頼るもの、ログイン状態だけを失効させるもの など
 *
 * 試験用ブラウザごとの準備（ログインと買取カートへの追加）は、ケースの事前準備としてケースの冒頭で行う（カートはブラウザのセッションに紐づく）。
 */
import { Browser, Page, test } from "@playwright/test";
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
