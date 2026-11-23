/**
 * M05-09 納品書印刷（日本語）の追加分（001・009・014・015・022・045・049・061〜063）。正本: cases/M05-09_test_cases.tsv
 * 2026-11-23 追加。流せない一覧（DB への直接の設定）から外したケース。判定済みのケース（m05-09.spec.ts）の指紋を変えないため、別のファイルに書く。
 * 画面で作れない状態（支店の受注・スマレジの受注・配送先なし・配送方法なし・ゲスト受注・商品規格なしの明細）は、E2E の受注の行だけ DB で書き足した
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」・2026-11-23「DB の直接の設定で流せるものは流す」）。
 * 045 は共有の設定（本店の適格請求書発行事業者登録番号）をケースの開始時に書き換え、終わるたびに元の値へ戻して DB で確かめる（023 と同じ。単独で流す）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 流す前の登録番号, 登録番号 } from "../../db/m05_09";
import { SlipOrderListPage, SlipStandbyPage, 納品書のページ, 納品書を読む, 登録番号を設定する } from "../../pages/admin/m05_09_delivery_slips";
import { M0509_ADMIN, 作ったものの, 会員のメール } from "../../seeds/m05-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 受注のページ = (pages: 納品書のページ[], 注文番号: string) => pages.filter((p) => p.注文番号 === 注文番号);
const 全部の行 = (pages: 納品書のページ[]) => pages.flatMap((p) => p.明細);
const 本店 = "1", 試験支店 = "1574";

const 支店の補い = "シード表の「支店の受注」は、試験会員が本店のフロントで注文した受注の、受注と配送先の店舗を DB で試験支店（1574）にして読み替えた（E2E の行だけ）。手順1の検索では店舗の欄で本店と試験支店を選んだ";
const スマレジの補い = (名: string, 番号: string) => `シード表のスマレジの受注（${名}）は、試験会員がフロントで注文した受注のスマレジ取引IDを DB で印つきの値にして読み替えた（スマレジの取引通知で作られる受注は画面で作れない）。注文番号は画面が振った ${番号}（注文番号の欄は11文字までで「${名}」は入らない）`;
const ゲストの補い = (名: string, 番号: string) => `シード表のゲスト受注（${名}）は、試験会員がフロントで注文した受注から、DB で会員の紐付けを外して読み替えた（E2E の行だけ）。注文番号は画面が振った ${番号}`;

type 選び方 = (ctx: CaseCtx) => string[];
/** 呼び名（〔注文番号-…〕）か、シードが作った何件目の受注か */
const 呼び名で = (...names: string[]): 選び方 => (ctx) => names.map((n) => ctx.notes.get(n));
const 何件目 = (seed: string, ...i: number[]): 選び方 => () => i.map((k) => 作ったものの(seed).注文番号[k]);

/** 受注情報検索 一覧(検索結果)で受注を選んで納品書を開き、読む（手順1〜3） */
function 一覧から(検索語: string, 選ぶ: 選び方, check: (pages: 納品書のページ[], ctx: CaseCtx, 選んだ: string[]) => void | Promise<void>,
  opt: { 店舗?: string[]; 補い?: (string | (() => string))[]; 開始時?: (ctx: CaseCtx) => Promise<void>; 終了時?: (ctx: CaseCtx) => Promise<void> } = {}) {
  return async (ctx: CaseCtx): Promise<void> => {
    try { await 本体(ctx); } finally { if (opt.終了時) await opt.終了時(ctx); }
  };
  async function 本体(ctx: CaseCtx): Promise<void> {
    const { page, step, expected } = ctx;
    if (opt.開始時) await opt.開始時(ctx);
    await loginAdmin(page, M0509_ADMIN);
    const l = new SlipOrderListPage(page);
    let popup!: Page; let pages: 納品書のページ[] = [];
    const 選んだ = 選ぶ(ctx);
    await step(1, async () => {
      await l.会員の受注を出す(検索語, opt.店舗);
      note(`受注情報検索を、ケースの試験会員のメールアドレス（${検索語}）で絞り、全ての対応状況を選んで検索した${opt.店舗 ? `（店舗の欄は店舗ID ${opt.店舗.join("・")}）` : ""}（検索結果: ${(await l.結果の注文番号()).join("・")}）`);
    });
    await step(2, async () => { for (const n of 選んだ) await l.受注を選ぶ(n); });
    await step(3, async () => { popup = await l.納品書印刷を押す(); pages = await 納品書を読む(popup); note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`); });
    await expected(async () => {
      for (const m of opt.補い ?? []) supplement(typeof m === "function" ? m() : m);
      expect.soft(popup.url(), "納品書印刷（日本語）の窓が開いた").toMatch(/\/order\/print\/delivery_slips\/ja/);
      await check(pages, ctx, 選んだ);
    });
  }
}

/** 選んだ受注の納品書だけが、受注ごとに1件ずつ、この順に出る */
const だけが出る = (pages: 納品書のページ[], want: string[]) => {
  const 出た = [...new Set(pages.map((p) => p.注文番号))];
  expect.soft(出た, `納品書が出た注文番号（${want.join("・")} の順に、受注ごとに1件ずつ）`).toEqual(want);
  for (const n of want) expect.soft(受注のページ(pages, n).length, `注文番号 ${n} の納品書のページ数（明細1件なので1ページ）`).toBe(1);
};

// 001: 本店・支店・スマレジの受注を選んで、受注ごとに1件ずつ続けて出る
caseTest("IT-M05-09-001", 一覧から("m0509-001-", (ctx) => [...呼び名で("〔注文番号-M0509-001A〕", "〔注文番号-M0509-001B〕")(ctx), ...何件目("S-M05-09-CHANNELS-001", 2)(ctx)],
  (pages, _ctx, 選んだ) => だけが出る(pages, 選んだ), {
    店舗: [本店, 試験支店],
    補い: [
      "2人の試験会員（A・B）の受注を1つの検索結果に出すため、2人のメールアドレスに共通する先頭（m0509-001-）で検索した。前の実行の 001 の受注も検索結果に出るが、選ぶのはこの実行の受注だけ",
      支店の補い, () => スマレジの補い("JP-SMAREGI-001-001", 作ったものの("S-M05-09-CHANNELS-001").注文番号[2]),
    ],
  }));

// 009: 出荷指示リスト編集で、配送先なし・配送方法なしの受注を含めて選ぶと、配送先と配送方法を持つ受注だけが出る
caseTest("IT-M05-09-009", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0509_ADMIN);
  const s = new SlipStandbyPage(page);
  const v = 作ったものの("S-M05-09-RELATIONS-009");
  const 呼び名 = ["〔注文番号-M0509-009A〕", "〔注文番号-M0509-009B〕", "〔注文番号-M0509-009C〕"];
  let pages: 納品書のページ[] = []; let url = "";
  await step(1, async () => { expect(await s.詳細を開く(v.出荷指示リストID), "出荷指示リスト編集画面の応答").toBeLessThan(400); });
  await step(2, async () => { await s.受注を選ぶ(呼び名.map((n) => v.受注ID[v.注文番号.indexOf(ctx.notes.get(n))])); });
  await step(3, async () => { const popup = await s.納品書印刷を押す(); url = popup.url(); pages = await 納品書を読む(popup); note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`); });
  await expected(async () => {
    supplement("配送先を持たない受注（009B）は、出荷指示リストを生成したあとに DB で配送先を受注から外し、配送方法を持たない受注（009C）は DB で配送先の配送方法を外して作った（E2E の行だけ。画面では作れない）");
    expect.soft(url, "納品書印刷（日本語）の窓が開いた").toMatch(/\/standby\/\d+\/print\/delivery\/ja/);
    const 出た = [...new Set(pages.map((p) => p.注文番号))];
    expect.soft(出た, "納品書が出た注文番号（〔注文番号-M0509-009A〕だけ）").toEqual([ctx.notes.get("〔注文番号-M0509-009A〕")]);
    for (const n of ["〔注文番号-M0509-009B〕", "〔注文番号-M0509-009C〕"]) expect.soft(出た.includes(ctx.notes.get(n)), `${n}（${ctx.notes.get(n)}）の納品書は出ない`).toBe(false);
  });
});

// 014・062: 配送先2件・数量2と3の受注。2件とも選ぶ（014）・1件だけ選ぶ（062）と、納品書が1回だけ出て、商品数は受注の合計5
const 二件の配送先の補い = "2件目の配送先は、シード表の「受注情報編集の出荷情報の追加（出荷登録画面）」が開発環境でシステムエラーになり開けないため、E2E の受注の配送先を写して DB で足し、数量3の明細をそこへ移した（E2E の行だけ）";
caseTest("IT-M05-09-014", 一覧から(会員のメール("014"), 呼び名で("〔注文番号-M0509-014〕"), (pages, _ctx, 選んだ) => {
  expect.soft(pages.map((p) => p.注文番号), `注文番号 ${選んだ[0]} の納品書が1回だけ出た`).toEqual([選んだ[0]]);
  expect.soft((pages[0]?.合計の数量 ?? "").replace(/\s/g, ""), `商品数が受注単位の数量合計5（表示: ${pages[0]?.合計の数量}）`).toBe("5/5");
}, { 補い: [二件の配送先の補い, "手順2は、検索結果の〔注文番号-M0509-014〕の行（配送先ごとに1行）を2行とも選んだ"] }));
caseTest("IT-M05-09-062", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0509_ADMIN);
  const l = new SlipOrderListPage(page);
  const 注文番号 = ctx.notes.get("〔注文番号-M0509-CB062〕"), A = ctx.notes.get("〔配送先ID-M0509-CB062A〕");
  let pages: 納品書のページ[] = []; let popup!: Page;
  await step(1, async () => {
    await l.会員の受注を出す(会員のメール("062"));
    note(`受注情報検索を、ケースの試験会員のメールアドレス（${会員のメール("062")}）で絞り、全ての対応状況を選んで検索した（検索結果: ${(await l.結果の注文番号()).join("・")}）`);
  });
  await step(2, async () => {
    const box = page.locator(`#check_${A}`);
    await expect(box, `配送先ID ${A} の行のチェックボックス`).toHaveCount(1);
    await box.evaluate((n) => { const i = n as HTMLInputElement; if (!i.checked) { i.checked = true; i.dispatchEvent(new Event("change", { bubbles: true })); } });
    expect(await l.行の選択(注文番号).evaluateAll((ns) => ns.filter((x) => (x as HTMLInputElement).checked).length), "選んだのは〔配送先ID-M0509-CB062A〕の1件だけ").toBe(1);
  });
  await step(3, async () => { popup = await l.納品書印刷を押す(); pages = await 納品書を読む(popup); note(`納品書の注文番号（ページごと）: ${pages.map((p) => `${p.注文番号}(${p.ページ})`).join("・") || "なし"}`); });
  await expected(async () => {
    supplement(二件の配送先の補い);
    expect.soft(popup.url(), "納品書印刷（日本語）の窓が開いた").toMatch(/\/order\/print\/delivery_slips\/ja/);
    expect.soft(pages.map((p) => p.注文番号), `注文番号 ${注文番号} の納品書が1回だけ出た`).toEqual([注文番号]);
    expect.soft((pages[0]?.合計の数量 ?? "").replace(/\s/g, ""), `商品数が受注の合計5（表示: ${pages[0]?.合計の数量}）`).toBe("5/5");
  });
});

// 015: 選択をすべて外して押すと、納品書が1件も出ない
caseTest("IT-M05-09-015", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0509_ADMIN);
  const l = new SlipOrderListPage(page);
  const v = 作ったものの("S-M05-09-CHANNELS-015");
  const 検索語 = "m0509-015-";
  let 警告 = ""; let 窓: Page | null = null; let 選択の数 = -1;
  await step(1, async () => {
    await l.会員の受注を出す(検索語, [本店, 試験支店]);
    const 出た = await l.結果の注文番号();
    note(`受注情報検索を、ケースの試験会員のメールアドレスに共通する先頭（${検索語}）で絞り、全ての対応状況・店舗ID ${本店}・${試験支店} で検索した（検索結果: ${出た.join("・")}）`);
    for (const n of v.注文番号) expect.soft(出た.includes(n), `検索結果に注文番号 ${n} がある`).toBe(true);
  });
  await step(2, async () => {
    const boxes = page.locator('input[type="checkbox"][id^="check_"]');
    await boxes.evaluateAll((ns) => ns.forEach((n) => { const i = n as HTMLInputElement; if (i.checked) { i.checked = false; i.dispatchEvent(new Event("change", { bubbles: true })); } }));
    選択の数 = await boxes.evaluateAll((ns) => ns.filter((x) => (x as HTMLInputElement).checked).length);
    expect(選択の数, "受注の選択がすべて外れている").toBe(0);
  });
  await step(3, async () => {
    page.once("dialog", async (d) => { 警告 = d.message(); await d.accept(); });
    const popupP = page.waitForEvent("popup", { timeout: 15_000 }).then((p) => p, () => null);
    await page.locator("#printDeliverySlipsJp").click();
    窓 = await popupP;
    note(`押した結果: 警告「${警告 || "なし"}」・新しい窓 ${窓 ? (窓 as Page).url() : "開かない"}`);
  });
  await expected(async () => {
    supplement(`シード表のスマレジの受注（JP-SMAREGI-001-015）は、試験会員がフロントで注文した受注のスマレジ取引IDを DB で印つきの値にして読み替えた（注文番号は画面が振った ${v.注文番号[2] ?? "（未作成）"}）`);
    supplement(支店の補い);
    const ページ数 = 窓 ? (await 納品書を読む(窓 as Page)).length : 0;
    expect.soft(ページ数, "納品書が1件も表示されない").toBe(0);
  });
});

// 022: 本店の受注と支店の受注の納品書で、会社の欄が同じ
caseTest("IT-M05-09-022", 一覧から("m0509-022-", 呼び名で("〔注文番号-M0509-022A〕", "〔注文番号-M0509-022B〕"), (pages, _ctx, 選んだ) => {
  const a = 受注のページ(pages, 選んだ[0])[0], b = 受注のページ(pages, 選んだ[1])[0];
  expect.soft(!!a && !!b, "2件の納品書が出た").toBe(true);
  note(`会社の欄: 本店の受注「${(a?.会社 ?? []).join(" / ")}」・支店の受注「${(b?.会社 ?? []).join(" / ")}」`);
  expect.soft((a?.会社 ?? []).length, "会社の欄がある").toBeGreaterThan(0);
  expect.soft(b?.会社 ?? ["（支店の受注の納品書が無い）"], "会社名・郵便番号・住所・建物名・電話番号・URL・メールアドレスが2件で同じ").toEqual(a?.会社 ?? ["（本店の受注の納品書が無い）"]);
}, {
  店舗: [本店, 試験支店],
  補い: [
    "2人の試験会員（A・B）の受注を1つの検索結果に出すため、2人のメールアドレスに共通する先頭（m0509-022-）で検索した",
    支店の補い, "注文者・配送先・金額・商品が異なる受注は、2人目の受注の注文者とお届け先を受注情報編集で大阪府の別の住所・氏名にし、商品を価格の違う別の商品にして作った",
  ],
}));

// 045: 支店の受注の納品書の登録番号に、本店の設定値が出る（共有の設定を書き換える。023 と同じ戻し方）
let 元の登録番号: string | null = null;
async function 登録番号を別の窓で設定する(ctx: CaseCtx, 値: string): Promise<void> {
  await withAdminSession(ctx.browser, M0509_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 登録番号を設定する(p, 値, note); });
}
caseTest("IT-M05-09-045", 一覧から(会員のメール("045"), 呼び名で("〔注文番号-M0509-045〕"), (pages) => {
  expect.soft(pages.length, "納品書が出た").toBe(1);
  expect.soft(pages[0]?.会社.find((s) => s.startsWith("登録番号")) ?? "（登録番号の行が無い）", "支店の受注の納品書の会社の適格請求書発行事業者登録番号").toBe("登録番号:T1234567890123");
}, {
  店舗: [試験支店],
  補い: [支店の補い.replace("本店と試験支店", "試験支店")],
  開始時: async (ctx) => {
    const 元 = 登録番号();
    if (元 !== 流す前の登録番号) throw new Error(`本店の適格請求書発行事業者登録番号が流す前の値（${流す前の登録番号}）でなく「${元 || "空"}」。前の回が戻し損ねたので、書き換えずに止める`);
    元の登録番号 = 流す前の登録番号;
    await 登録番号を別の窓で設定する(ctx, "T1234567890123");
    note(`事前準備③: 本店の適格請求書発行事業者登録番号を、元の値（${元の登録番号 || "空"}）から T1234567890123 にした（終わったら戻す）`);
  },
  終了時: async (ctx) => {
    if (元の登録番号 === null) return;
    const 元 = 流す前の登録番号;
    if (登録番号() !== 元) await 登録番号を別の窓で設定する(ctx, 元);
    expect(登録番号(), "共有の設定（本店の適格請求書発行事業者登録番号）を元の値へ戻せた").toBe(元);
    元の登録番号 = null;
  },
}));

// 049・063: ゲスト受注の納品書（送り主の会員番号に「非会員」）
function ゲストの確かめ(名: string, 出る: string, 出ない?: string) {
  return (pages: 納品書のページ[], _ctx: CaseCtx, 選んだ: string[]) => {
    const p = 受注のページ(pages, 選んだ[0])[0];
    expect.soft(!!p, `${名}（注文番号 ${選んだ[0]}）の日本語納品書が出た`).toBe(true);
    expect.soft(p?.送り主.find((s) => s.startsWith("会員番号")) ?? "（会員番号の行が無い）", "送り主の会員番号").toBe("会員番号 非会員");
    const names = 全部の行(pages).map((r) => r.商品名);
    note(`納品書の商品情報の行: ${names.join("・") || "なし"}`);
    expect.soft(names.some((n) => n.includes(rc(出る))), `商品情報に商品 ${出る} の行がある`).toBe(true);
    if (出ない) expect.soft(names.some((n) => n.includes(rc(出ない))), `商品情報に商品 ${出ない} の行が無い`).toBe(false);
  };
}
function ゲストの補い一式(seed: string, 名: string, 出ない?: string): (string | (() => string))[] {
  return [
    () => ゲストの補い(名, 作ったものの(seed).注文番号[0]),
    "受注情報検索は、会員を外したあとも受注に残るメールアドレスで絞った",
    ...(出ない ? [`商品規格を持たない明細（${出ない}）は、DB で明細の商品規格の紐付けを外して作った（E2E の行だけ。画面では作れない）`] : []),
  ];
}
caseTest("IT-M05-09-049", 一覧から(会員のメール("049"), 何件目("S-M05-09-CBGUEST-049", 0), ゲストの確かめ("GUEST-M0509-CB049", "M0509-CB049-OK", "M0509-CB049-NG"),
  { 補い: ゲストの補い一式("S-M05-09-CBGUEST-049", "GUEST-M0509-CB049", "M0509-CB049-NG") }));
caseTest("IT-M05-09-063", 一覧から(会員のメール("063"), 何件目("S-M05-09-CBGUESTOK-063", 0), ゲストの確かめ("GUEST-M0509-CB063", "M0509-CB063-OK"),
  { 補い: ゲストの補い一式("S-M05-09-CBGUESTOK-063", "GUEST-M0509-CB063") }));

// 061: 配送先1件・数量2の明細1行の受注を1回だけ選ぶと、納品書が1回だけ出て商品数が「2 / 2」
caseTest("IT-M05-09-061", 一覧から(会員のメール("061"), 呼び名で("〔注文番号-M0509-CB061〕"), (pages, _ctx, 選んだ) => {
  expect.soft(pages.map((p) => p.注文番号), `注文番号 ${選んだ[0]} の納品書が1回だけ出た`).toEqual([選んだ[0]]);
  expect.soft((pages[0]?.合計の数量 ?? "").replace(/\s/g, ""), `商品数（表示: ${pages[0]?.合計の数量}）`).toBe("2/2");
}));
