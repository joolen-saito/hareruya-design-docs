/**
 * F06-07 購入履歴詳細。正本: cases/F06-07_test_cases.tsv
 * 実装したのは 003・004（前回）と、依頼者の方針（2026-11-10）で追加した 001・002・005〜019・021〜024・029〜039・041・042・046〜050。
 * 実装しないケース: 028（管理画面の受注詳細との明細順の一致。管理者の登録と受注詳細の明細の読み取りが要る）、040（スマレジ連携の成功結果を外部の試験環境に頼る）、
 *   043（言語別の商品規格・商品規格との関連がない明細は、共有の商品を作り直す必要がある）。
 * 記録 review/F06-07_progress_2026-11-04.md
 *
 * 読み替え（シードの注記にも残る）: 注文は画面で作った販売中の既存の商品1点の注文で、商品名・言語・現在価格はシード表と合わない。
 * 注文の金額・日付・種別・住所などは、画面で作れないのでDBで注文に設定した（db/f06_07.ts）。注文IDはシード表の固定の値ではなく画面が振った値。
 * 画面の見出しは正本の言い回しと少し違う（注文商品情報＝注文内容／購入内容、ポイント使用（値引き）＝ポイント使用、注文金額合計（税込み）＝注文金額合計（税込）、
 * スマレジ取引の支払金額合計（税込））。正本の項目を画面の見出しに対応させて確かめる。
 */
import { Page } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 商品の現在価格, 注文のポイント, 注文の金額 } from "../../db/f06_07_k";
import { HistoryDetailPage, 数字 } from "../../pages/front/f06_07_history";
import { LoginPage } from "../../pages/front/f06_03_login";
import { PointHistoryPage } from "../../pages/front/f06_10_point_history";
import { 会員A, 注文 } from "../../seeds/f06-07";
import "../../seeds/f06-07-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

/** 会員Aでログイン済みにする（事前準備） */
async function ログインする(page: Page, 番号: string): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  const a = 会員A(番号);
  await l.ログインする(a.メール, a.パスワード);
}

const 詳細のパス = (ID: string) => `/ja/mypage/shopping_history_detail/${ID}`;

function 存在しない(番号: string, 注文ID: () => string | undefined) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await ログインする(page, 番号);
    const h = new HistoryDetailPage(page);
    let status = 0;
    await step(1, async () => { status = await h.開く(注文ID()); });
    await expected(async () => {
      expect.soft(status, "HTTPステータス").toBe(404);
      expect.soft(await h.詳細の見出し.count(), "購入履歴詳細画面の見出しが表示されない").toBe(0);
    });
  };
}
caseTest("IT-F06-07-003", 存在しない("003", () => undefined));
caseTest("IT-F06-07-004", 存在しない("004", () => "abc"));

// ---- 画面の見出し（正本の項目 → 画面の見出し） ----
const 見出し = {
  注文番号: "注文番号", 購入番号: "購入番号", 注文日: "注文日", 購入日: "購入日", 出荷日: "出荷日", 注文ステータス: "処理状態",
  注文商品情報: "注文内容", 購入内容: "購入内容", 商品金額合計: "商品金額合計", 送料: "送料", 手数料: "手数料", ポイント使用: "ポイント使用",
  注文金額合計: "注文金額合計（税込）", 支払金額合計: "支払金額合計（税込）", ポイント発生: "ポイント発生",
  送り主: "送り主", 支払方法: "支払方法", 配送方法: "配送方法", お届け先: "お届け先",
  レシートNo: "レシートNo", クーポン名: "クーポン名", クーポン値引き: "クーポン値引き", 免税額: "免税額",
} as const;
type 項目名 = keyof typeof 見出し;

/** 表示されるはずの項目と、表示されないはずの項目を、画面の見出しで確かめる */
async function 項目を確かめる(h: HistoryDetailPage, 表示: 項目名[], 非表示: 項目名[], 領収書: "表示" | "非表示" | "対象外" = "対象外"): Promise<void> {
  const 一覧 = await h.見出しの一覧();
  for (const k of 表示) expect.soft(一覧.includes(見出し[k]), `「${k}」（画面の見出し「${見出し[k]}」）が表示される`).toBe(true);
  for (const k of 非表示) expect.soft(一覧.includes(見出し[k]), `「${k}」（画面の見出し「${見出し[k]}」）が表示されない`).toBe(false);
  if (領収書 !== "対象外") expect.soft(await h.領収書発行リンク.count() > 0, "領収書発行のリンクが表示される").toBe(領収書 === "表示");
}

/** 会員Aでログインして、注文の購入履歴詳細を開く（1手順のケース）。開いたあとの確かめは、各ケースの期待結果に書く */
async function 注文を開く(ctx: CaseCtx, 番号: string, キー: string): Promise<HistoryDetailPage> {
  await ログインする(ctx.page, 番号);
  const h = new HistoryDetailPage(ctx.page);
  await ctx.step(1, async () => { await h.開く(注文(キー).ID); });
  return h;
}

caseTest("IT-F06-07-001", async (ctx) => {
  const h = await 注文を開く(ctx, "001", "001");
  await ctx.expected(async () => {
    expect.soft(await h.詳細画面である(), "購入履歴詳細画面が表示される").toBe(true);
    expect.soft(h.path, "開いた画面（会員Aの注文の購入履歴詳細）").toBe(詳細のパス(注文("001").ID));
    expect.soft(await h.値(見出し.注文番号), "会員Aが所有する注文の注文番号").toContain(注文("001").番号);
  });
});

caseTest("IT-F06-07-007", async ({ page, step, expected }) => {
  await ログインする(page, "007");
  const h = new HistoryDetailPage(page);
  const 結果: { キー: string; 会員名: string; 店舗: string | null }[] = [];
  await step(1, async () => {
    for (const キー of ["007A", "007B", "007C", "007D"]) {
      await h.開く(注文(キー).ID);
      結果.push({ キー, 会員名: await h.会員名(), 店舗: await h.値("店舗") });
    }
  });
  await expected(async () => {
    for (const r of 結果) {
      expect.soft(r.会員名, `${r.キー} の会員名`).toContain("結合 花子");
      expect.soft(r.店舗, `${r.キー} が保持する店舗（${注文(r.キー).店名}）`).toBe(注文(r.キー).店名);
    }
  });
});

caseTest("IT-F06-07-008", async (ctx) => {
  const h = await 注文を開く(ctx, "008", "008");
  await ctx.expected(async () => {
    await 項目を確かめる(h,
      ["注文番号", "注文日", "出荷日", "注文ステータス", "注文商品情報", "商品金額合計", "送料", "手数料", "ポイント使用", "注文金額合計", "ポイント発生", "送り主", "支払方法", "配送方法", "お届け先"],
      ["レシートNo", "購入日", "クーポン名", "クーポン値引き", "免税額"]);
    expect.soft(数字((await h.値(見出し.商品金額合計)) ?? ""), "商品金額合計").toBe("4000");
    expect.soft(数字((await h.値(見出し.送料)) ?? ""), "送料").toBe("600");
    expect.soft(数字((await h.値(見出し.手数料)) ?? ""), "手数料").toBe("100");
    expect.soft((await h.値(見出し.注文金額合計)) ?? "", "注文金額合計（税込）と内税額").toMatch(/4,500[\s\S]*409/);
  });
});

caseTest("IT-F06-07-009", async (ctx) => {
  const h = await 注文を開く(ctx, "009", "009");
  await ctx.expected(async () => {
    await 項目を確かめる(h,
      ["注文番号", "注文日", "出荷日", "注文ステータス", "注文商品情報", "注文金額合計", "支払方法"],
      ["レシートNo", "購入日", "商品金額合計", "送料", "手数料", "クーポン名", "クーポン値引き", "免税額", "ポイント使用", "ポイント発生", "送り主", "配送方法", "お届け先"], "非表示");
    expect.soft(数字((await h.値(見出し.注文金額合計)) ?? ""), "注文金額合計").toMatch(/^2000/);
  });
});

caseTest("IT-F06-07-010", async (ctx) => {
  const h = await 注文を開く(ctx, "010", "010");
  await ctx.expected(async () => {
    // 画面の日付の行は、店頭受取からスマレジ取引へ移行した注文では「購入日」の1行だけ。正本は注文日と購入日の両方を挙げるので、両方を確かめる
    await 項目を確かめる(h,
      ["注文番号", "注文日", "レシートNo", "購入日", "購入内容", "商品金額合計", "クーポン名", "クーポン値引き", "免税額", "ポイント使用", "支払金額合計", "ポイント発生", "支払方法"],
      ["出荷日", "注文ステータス", "送料", "手数料", "送り主", "配送方法", "お届け先"], "非表示");
    expect.soft(await h.値(見出し.レシートNo), "レシートNo.").toBe("6070030000001");
    expect.soft(await h.値(見出し.クーポン名), "クーポン名").toBe("店頭割引券A");
    expect.soft(数字((await h.値(見出し.クーポン値引き)) ?? ""), "クーポン値引き").toBe("300");
    expect.soft(数字((await h.値(見出し.免税額)) ?? ""), "免税額").toBe("500");
  });
});

caseTest("IT-F06-07-011", async (ctx) => {
  const h = await 注文を開く(ctx, "011", "011");
  await ctx.expected(async () => {
    await 項目を確かめる(h,
      ["購入番号", "購入日", "レシートNo", "購入内容", "商品金額合計", "クーポン名", "クーポン値引き", "免税額", "ポイント使用", "支払金額合計", "ポイント発生", "支払方法"],
      ["注文番号", "注文日", "出荷日", "注文ステータス", "送料", "手数料", "送り主", "配送方法", "お届け先"], "非表示");
    expect.soft(await h.値(見出し.レシートNo), "レシートNo.").toBe("6070040000001");
    expect.soft(await h.値(見出し.クーポン名), "クーポン名").toBe("店頭割引券B");
    expect.soft(数字((await h.値(見出し.クーポン値引き)) ?? ""), "クーポン値引き").toBe("200");
    expect.soft(数字((await h.値(見出し.免税額)) ?? ""), "免税額").toBe("400");
    expect.soft((await h.値(見出し.支払方法)) ?? "", "スマレジ専用の支払方法が表示される（支払方法の名前は既存の支払方法マスタに読み替え）").not.toBe("");
  });
});

caseTest("IT-F06-07-012", async (ctx) => {
  const h = await 注文を開く(ctx, "012", "012");
  await ctx.expected(async () => {
    expect.soft((await h.見出しの一覧()).includes(見出し.商品金額合計), "商品金額合計は表示される（画面の作りの確認）").toBe(true);
    await 項目を確かめる(h, [], ["送料", "手数料"]);
  });
});

caseTest("IT-F06-07-013", async ({ page, step, expected }) => {
  await ログインする(page, "013");
  const h = new HistoryDetailPage(page);
  const 結果: { 種別: string; ボタン数: number }[] = [];
  await step(1, async () => {
    for (const [種別, キー] of [["EC", "013A"], ["店頭受取", "013B"], ["店頭受取からスマレジ取引", "013D"], ["スマレジ取引", "013E"]] as const) {
      await h.開く(注文(キー).ID);
      結果.push({ 種別, ボタン数: await h.再購入のボタン.count() });
    }
  });
  await expected(async () => {
    for (const r of 結果) expect.soft(r.ボタン数, `${r.種別} の購入履歴詳細に「この注文品をもう一度購入する」ボタンが表示されない`).toBe(0);
  });
});

caseTest("IT-F06-07-014", async ({ page, step, expected }) => {
  await ログインする(page, "014");
  const h = new HistoryDetailPage(page);
  const o = 注文("014");
  let 金額 = { 注文時単価: "", 数量: "", 商品金額合計: "", 送料: "", 手数料: "", 注文金額合計: "" };
  await step(1, async () => { 金額 = 注文の金額(o.番号); });
  let 現在価格 = "";
  await step(2, async () => { 現在価格 = 商品の現在価格(o.番号); });
  await step(3, async () => { await h.開く(o.ID); });
  await expected(async () => {
    expect.soft(Number(金額.注文時単価), "DBの注文時単価").toBe(1000);
    // 商品の現在価格は共有の商品なので1,200円には合わせられない。注文時単価と異なる現在価格のままでも、注文時の単価で表示される
    expect.soft(Number(現在価格), "DBの商品の現在価格（注文時単価と異なる）").not.toBe(1000);
    expect.soft((await h.明細())[0]?.合計 ?? "", "注文時単価1,000円×数量4 の明細の合計（現在価格で再集計されない）").toContain("4,000");
    expect.soft(数字((await h.値(見出し.商品金額合計)) ?? ""), "商品金額合計").toBe("4000");
    expect.soft(数字((await h.値(見出し.送料)) ?? ""), "送料").toBe("600");
    expect.soft(数字((await h.値(見出し.手数料)) ?? ""), "手数料").toBe("100");
    expect.soft((await h.値(見出し.注文金額合計)) ?? "", "注文金額合計と内税額").toMatch(/4,500[\s\S]*409/);
    expect.soft(Number(金額.注文金額合計), "DBの注文金額合計").toBe(4500);
  });
});

caseTest("IT-F06-07-015", async ({ page, step, expected }) => {
  await ログインする(page, "015");
  const h = new HistoryDetailPage(page);
  const o = 注文("015");
  let p = { 使用: "", 発生: "" };
  await step(1, async () => { p = 注文のポイント(o.番号); });
  await step(2, async () => { await h.開く(o.ID); });
  await expected(async () => {
    expect.soft([Number(p.使用), Number(p.発生)], "DBのポイント使用・ポイント発生").toEqual([0, 0]);
    for (const k of ["ポイント使用", "ポイント発生"] as const) {
      const v = (await h.値(見出し[k])) ?? "";
      expect.soft(数字(v), `${k} の数値`).toBe("0");
      expect.soft(v, `${k} が0ポイントとして表示される`).toContain("pt");
    }
  });
});

/** ポイント履歴画面で、注文の番号（またはレシート番号）のリンクを押し、別タブで開いた購入履歴詳細を確かめる */
function ポイント履歴から(番号: string, キー: string, リンクの文: () => string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await ログインする(page, 番号);
    const p = new PointHistoryPage(page);
    const o = 注文(キー);
    let popup: Page | undefined;
    await step(1, async () => { await p.開く(); });
    await step(2, async () => {
      [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 30_000 }), page.getByRole("link", { name: リンクの文(), exact: true }).first().click()]);
      await popup.waitForLoadState("load");
    });
    await expected(async () => {
      expect.soft(popup ? new URL(popup.url()).pathname : "", `注文ID ${o.ID} の購入履歴詳細画面へ遷移する`).toBe(詳細のパス(o.ID));
      expect.soft(popup ? await new HistoryDetailPage(popup).詳細画面である() : false, "購入履歴詳細画面が表示される").toBe(true);
    });
  };
}
caseTest("IT-F06-07-030", ポイント履歴から("030", "030", () => 注文("030").番号));
caseTest("IT-F06-07-031", ポイント履歴から("031", "031", () => "6070040000001"));

/** 注文商品情報の明細（数量と合計）を確かめる */
function 明細を確かめる(番号: string, キー: string, 期待: { 数量: string; 合計: string }[], 手順の数 = 2) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await ログインする(page, 番号);
    const h = new HistoryDetailPage(page);
    let 行: { 数量: string; 合計: string }[] = [];
    await step(1, async () => { await h.開く(注文(キー).ID); });
    if (手順の数 >= 2) await step(2, async () => { 行 = await h.明細(); });
    await expected(async () => {
      expect.soft(行.length, "明細の件数").toBe(期待.length);
      期待.forEach((e, i) => {
        expect.soft(行[i]?.数量, `${i + 1}件目の数量`).toBe(e.数量);
        expect.soft(行[i] ? 数字(行[i].合計) : "", `${i + 1}件目の合計`).toBe(数字(e.合計));
      });
    });
  };
}
caseTest("IT-F06-07-032", 明細を確かめる("032", "032", [{ 数量: "3", 合計: "3000" }, { 数量: "1", 合計: "1500" }]));
caseTest("IT-F06-07-033", 明細を確かめる("033", "033", [{ 数量: "4", 合計: "2000" }, { 数量: "2", 合計: "1400" }]));
caseTest("IT-F06-07-034", 明細を確かめる("034", "034", [{ 数量: "5", 合計: "1500" }, { 数量: "2", 合計: "800" }]));
caseTest("IT-F06-07-035", 明細を確かめる("035", "035", [{ 数量: "3", 合計: "750" }, { 数量: "6", 合計: "600" }]));
caseTest("IT-F06-07-041", 明細を確かめる("041", "041", [{ 数量: "1", 合計: "1000" }]));

/** 送り主・お届け先の欄を確かめる */
function 住所を確かめる(番号: string, 欄: "送り主" | "お届け先", 期待: { 郵便番号: string; 含む: string[] }) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await ログインする(page, 番号);
    const h = new HistoryDetailPage(page);
    let 郵便 = "", 住所 = "", 全体 = "";
    await step(1, async () => { await h.開く(注文(番号).ID); });
    await step(2, async () => {
      郵便 = 欄 === "送り主" ? await h.送り主の郵便番号() : await h.お届け先の郵便番号();
      住所 = 欄 === "送り主" ? await h.送り主の住所() : await h.お届け先の住所();
      全体 = 欄 === "送り主" ? await h.送り主の文() : await h.お届け先の文();
    });
    await expected(async () => {
      expect.soft(郵便, `${欄}の郵便番号`).toBe(期待.郵便番号);
      for (const w of 期待.含む) expect.soft(住所 + " " + 全体, `${欄}欄に「${w}」が表示される`).toContain(w);
    });
  };
}
caseTest("IT-F06-07-036", 住所を確かめる("036", "送り主", { 郵便番号: "〒150-0036", 含む: ["東京都", "渋谷区", "神南F0607-036号館", "送主F0607-036", "03-0607-0036"] }));
caseTest("IT-F06-07-037", 住所を確かめる("037", "お届け先", { 郵便番号: "〒220-0037", 含む: ["神奈川県", "横浜市", "みなとF0607-037館", "届先F0607-037", "045-0607-0037"] }));

caseTest("IT-F06-07-038", async ({ page, step, expected }) => {
  await ログインする(page, "038");
  const h = new HistoryDetailPage(page);
  let 見出しの文: string[] = [];
  let 行: { 名前: string; 数量: string; 合計: string }[] = [];
  await step(1, async () => { await h.開く(注文("038").ID); });
  await step(2, async () => { 見出しの文 = await h.明細の見出しの文(); 行 = await h.明細(); });
  await expected(async () => {
    // 画面の明細は「商品名・数量・合計(税込)」の3列。正本は3列目を「注文明細拡張」（空欄）と書く
    expect.soft(見出しの文, "お届け先の下の注文明細の列（商品名・数量・注文明細拡張）").toEqual(["商品名", "数量", "注文明細拡張"]);
    expect.soft(行.map((r) => r.数量), "数量（日本語商品A相当・English Product B相当の順）").toEqual(["4", "2"]);
    expect.soft(行.map((r) => r.合計), "どの行も注文明細拡張の欄が空欄").toEqual(["", ""]);
  });
});

caseTest("IT-F06-07-039", async ({ page, step, expected }) => {
  await ログインする(page, "039");
  const h = new HistoryDetailPage(page);
  let c = -1;
  await step(1, async () => { await h.開く(注文("039").ID); });
  await step(2, async () => { c = await h.領収書発行リンク.count(); });
  await expected(async () => { expect.soft(c, "領収書発行リンクが表示されない").toBe(0); });
});

/** 送り主・お届け先をそれぞれ国内／海外で確かめる */
type 欄の期待 = { 郵便番号: string; 含む: string[] };
function 両方の住所(番号: string, 送: 欄の期待, 届: 欄の期待) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    await ログインする(page, 番号);
    const h = new HistoryDetailPage(page);
    let 送の = { 郵便: "", 文: "" }, 届の = { 郵便: "", 文: "" };
    await step(1, async () => { await h.開く(注文(番号).ID); });
    await step(2, async () => { 送の = { 郵便: await h.送り主の郵便番号(), 文: await h.送り主の文() }; });
    await step(3, async () => { 届の = { 郵便: await h.お届け先の郵便番号(), 文: await h.お届け先の文() }; });
    await expected(async () => {
      expect.soft(送の.郵便, "送り主欄の郵便番号").toBe(送.郵便番号);
      for (const w of 送.含む) expect.soft(送の.文, `送り主欄に「${w}」が表示される`).toContain(w);
      expect.soft(届の.郵便, "お届け先欄の郵便番号").toBe(届.郵便番号);
      for (const w of 届.含む) expect.soft(届の.文, `お届け先欄に「${w}」が表示される`).toContain(w);
    });
  };
}
const 海外の期待 = (郵便番号: string): 欄の期待 => ({ 郵便番号, 含む: ["アメリカ合衆国"] });
caseTest("IT-F06-07-047", 両方の住所("047", 海外の期待("9000047"), 海外の期待("9100047")));
caseTest("IT-F06-07-048", 両方の住所("048", 海外の期待("9000048"), { 郵便番号: "〒220-0048", 含む: ["神奈川県", "横浜市", "みなとF0607-048館"] }));
caseTest("IT-F06-07-049", 両方の住所("049", { 郵便番号: "〒150-0049", 含む: ["東京都", "渋谷区", "神南F0607-049号館"] }, 海外の期待("9100049")));
caseTest("IT-F06-07-050", 両方の住所("050", { 郵便番号: "〒150-0050", 含む: ["東京都", "渋谷区", "神南F0607-050号館"] }, { 郵便番号: "〒220-0050", 含む: ["神奈川県", "横浜市", "みなとF0607-050館"] }));
