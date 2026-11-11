/**
 * F06-06 購入履歴一覧（続き）。正本: cases/F06-06_test_cases.tsv
 * 先の spec（f06-06.spec.ts）に無かったケースのうち、注文を画面とDBで整えて確かめるもの。シードは seeds/f06-06-orders.ts。
 * 実装しないケース: 007・008・009（注文を51件・12001件作る大量データ）、020〜022（再購入の要求を開発者ツールで取得して再送する。購入履歴一覧に再購入の要求を出す画面が無い）、
 *   028（受注一覧の一括操作領域に対応状況を変える選択欄が見つからない）。
 * 処理状態は、現行の画面では文字のラベルで表示される。BOステータスと表示画像の対応（別添資料）は正本に無いので、処理状態が表示されること（ラベルの文字または画像）を確かめ、
 * 表示された内容を注記に残す。
 */
import { Locator, test } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { CaseBody, CaseCtx, caseTest, expect } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { expectSaved } from "../../pages/admin/common";
import { 本店の店名 } from "../../pages/admin/m05_admin_member";
import { LoginPage } from "../../pages/front/f06_03_login";
import { HistoryListPage } from "../../pages/front/f06_06_history";
import { mailOf } from "../../seeds/f06-06";
import { 高松店名, 本店名, pw, レシートNo, 注文 } from "../../seeds/f06-06-orders";

const note = (type: string, m: string) => { test.info().annotations.push({ type, description: m }); };
const 画像の注記 = "処理状態は、現行の画面では文字のラベルで表示される。BOステータスと表示画像の対応（別添資料）は正本に無いので、処理状態が表示されること（ラベルの文字または画像がある）を確かめ、表示された内容を記録した";
const 商品の注記 = "シード表の商品名（結合商品Aなど）の商品は作らず、注文した既存の販売中の商品の名前で確かめる（共有の商品に試験の値を足さない）";
const 日付の注記 = "シード表の固定の値（注文ID・注文番号・会員ID）は、画面が振った値に読み替えて確かめる";

async function ログイン(c: CaseCtx, 前半: string, パスワード: string): Promise<void> {
  const l = new LoginPage(c.page);
  await l.ログイン画面を開く();
  await l.ログインする(mailOf(前半), パスワード);
}
function 履歴(c: CaseCtx) { return new HistoryListPage(c.page); }
function 状態の文(s: { 文: string; 画像: string[] }): string { return [s.文, ...s.画像].filter(Boolean).join(" / "); }
const 詳細のパス = (id: string) => `/ja/mypage/shopping_history_detail/${id}`;

// ---------------------------------------------------------------- 010 EC注文の表示項目
caseTest("IT-F06-06-010", async (c) => {
  note("手順の注記", 商品の注記);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  let 行!: Locator;
  const 番号 = () => notes.get("〔注文番号-F0606-010〕");
  await step(1, async () => { await ログイン(c, "display-f0606-010", pw("010")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { 行 = h.行(番号()); await expect(行).toHaveCount(1); });
  await expected(async () => {
    expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe("2026/1/10");
    expect.soft((await h.項目(行, "店舗")).文, "店舗").toBe("オンラインショップ");
    const 内容 = (await h.項目(行, "注文内容")).文;
    for (const 名 of 注文("010").商品名) expect.soft(内容, `注文内容に商品名「${名}」`).toContain(名);
    expect.soft((await h.項目(行, "注文金額合計")).文, "注文が保持する注文金額合計（9999円）").toContain("9,999");
    expect.soft((await h.項目(行, "支払方法")).文, "支払方法").toBe("クレジットカード");
    const s = await h.処理状態(行);
    note("手順の注記", `${画像の注記}。表示: ${状態の文(s)}`);
    expect.soft(s.表示, "処理状態が表示される").toBe(true);
  });
});

// ---------------------------------------------------------------- 011・039〜041 店頭受取注文の行（店頭受取受注）
function 店頭受取の行(前半: string, パスワード: string, n: string, 日: string | null): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`)); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const o = 注文(n);
      expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe(日 ?? notes.get(`〔注文日-F0606-${n}〕`));
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(o.店名);
      expect.soft(await h.注文番号のリンク(行).innerText(), "リンクとして表示された注文番号").toBe(o.番号);
      const s = await h.処理状態(行);
      note("手順の注記", `${画像の注記}。表示: ${状態の文(s)}`);
      expect.soft(s.表示, "処理状態が表示される").toBe(true);
    });
  };
}
caseTest("IT-F06-06-039", 店頭受取の行("cbf0606-039", "Passw0rd-CBF0606039", "039", null));
caseTest("IT-F06-06-040", 店頭受取の行("cbf0606-040", "Passw0rd-CBF0606040", "040", null));
caseTest("IT-F06-06-041", 店頭受取の行("cbf0606-041", "Passw0rd-CBF0606041", "041", null));

// ---------------------------------------------------------------- 031〜038・047・048 EC・スムーズ店頭受取の行
function オンライン店舗の行(n: string): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`)); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const 番号 = notes.get(`〔注文番号-F0606-${n}〕`);
      expect.soft((await h.項目(行, "注文日")).文, "注文日").toBe(notes.get(`〔注文日-F0606-${n}〕`));
      expect.soft((await h.項目(行, "店舗")).文, "店舗").toBe("オンラインショップ");
      const link = h.注文番号のリンク(行);
      expect.soft(await link.innerText(), "リンクとして表示された注文番号").toBe(番号);
      expect.soft(await link.getAttribute("href"), "注文番号のリンク先").toContain(詳細のパス(注文(n).ID));
      const s = await h.処理状態(行);
      note("手順の注記", `${画像の注記}。表示: ${状態の文(s)}`);
      expect.soft(s.表示, "処理状態が表示される").toBe(true);
    });
  };
}
caseTest("IT-F06-06-031", オンライン店舗の行("031"));
caseTest("IT-F06-06-032", オンライン店舗の行("032"));
caseTest("IT-F06-06-033", オンライン店舗の行("033"));
caseTest("IT-F06-06-034", オンライン店舗の行("034"));
caseTest("IT-F06-06-035", オンライン店舗の行("035"));
caseTest("IT-F06-06-036", オンライン店舗の行("036"));
caseTest("IT-F06-06-037", オンライン店舗の行("037"));
caseTest("IT-F06-06-038", オンライン店舗の行("038"));
caseTest("IT-F06-06-047", オンライン店舗の行("047"));
caseTest("IT-F06-06-048", オンライン店舗の行("048"));

// ---------------------------------------------------------------- 013・026・042 スマレジ取引だけの行
function スマレジ取引の行(n: string, 前半: string, パスワード: string, レシート: string, 購入日: string, 状態を見る: boolean): CaseBody {
  return async (c) => {
    note("手順の注記", `${日付の注記}。${商品の注記}`);
    const { step, expected } = c;
    const h = 履歴(c);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(レシート); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const o = 注文(n);
      if (!状態を見る) {
        const s = await h.処理状態(行);
        expect.soft(s.表示, "BOステータスに対応する処理状態の表示（画像）が表示されない").toBe(false);
        return;
      }
      expect.soft((await h.項目(行, "購入日")).文, "購入日").toBe(購入日);
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(o.店名);
      expect.soft((await h.項目(行, "レシートNo")).文, "レシート番号").toBe(レシート);
      const 内容 = (await h.項目(行, "購入内容")).文;
      for (const 名 of o.商品名) expect.soft(内容, `購入内容に商品名「${名}」`).toContain(名);
      expect.soft((await h.項目(行, "支払方法")).文, "支払方法").toBe("店頭支払");
      expect.soft((await h.項目(行, "注文番号")).有, "注文番号が表示されない").toBe(false);
      expect.soft((await h.処理状態(行)).表示, "処理状態が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-06-013", スマレジ取引の行("013", "display-f0606-013", pw("013"), "R060600000013", "2026/4/1", true));
caseTest("IT-F06-06-026", スマレジ取引の行("026", "smcancel-f0606-026", pw("026"), "R060600000026", "2026/6/1", false));
caseTest("IT-F06-06-042", スマレジ取引の行("042", "cbf0606-042", "Passw0rd-CBF0606042", "R0606CB0420", "2026/7/1", true));

// ---------------------------------------------------------------- 043〜046 店頭受取受注→スマレジ取引の行
function 統合の行(n: string, 元の数: number, 購入日: string): CaseBody {
  return async (c) => {
    note("手順の注記", `${日付の注記}。店頭受取注文の注文番号（OTC-F0606-CB… の固定の値）は、画面が振った注文番号で読み替える`);
    const { step, expected } = c;
    const h = 履歴(c);
    const レシート = レシートNo(n);
    let 行!: Locator;
    await step(1, async () => { await ログイン(c, `cbf0606-${n}`, `Passw0rd-CBF0606${n}`); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => { 行 = h.行(レシート); await expect(行).toHaveCount(1); });
    await expected(async () => {
      const 元 = Array.from({ length: 元の数 }, (_, i) => 注文(`${n}元${i + 1}`).番号);
      expect.soft(await h.注文の枠.count(), "表示される行は統合先1件だけ").toBe(1);
      expect.soft((await h.項目(行, "店舗")).文, "受取店舗名").toBe(注文(`${n}元1`).店名);
      expect.soft((await h.項目(行, "購入日")).文, "購入日（店頭受取データの最も若い注文日）").toBe(購入日);
      const 元番号 = await h.項目(行, "取引番号");
      expect.soft(元番号.有, "注文元番号の欄がある").toBe(true);
      expect.soft(元番号.文.split(/\s*,\s*/).sort(), "注文元番号（カンマ区切り）").toEqual([...元].sort());
      expect.soft(元番号.文.includes(",") || 元.length === 1, "複数の注文元番号はカンマ区切り").toBe(true);
      expect.soft(元番号.リンクあり, "注文元番号にリンクが設定されない").toBe(false);
      expect.soft((await h.項目(行, "支払方法")).文, "支払方法").toBe("店頭支払");
      expect.soft((await h.処理状態(行)).表示, "処理状態が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F06-06-043", 統合の行("043", 1, "2026/8/5"));
caseTest("IT-F06-06-044", 統合の行("044", 1, "2026/8/5"));
caseTest("IT-F06-06-045", 統合の行("045", 2, "2026/8/2"));
caseTest("IT-F06-06-046", 統合の行("046", 2, "2026/8/2"));

// ---------------------------------------------------------------- 014 9状態の処理状態
caseTest("IT-F06-06-014", async (c) => {
  note("手順の注記", `${画像の注記}。${日付の注記}`);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  const 結果: { n: string; 状態: string; 表示: boolean; 内容: string }[] = [];
  await step(1, async () => { await ログイン(c, "status-f0606-014", pw("014")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => {
    // 9件は1ページ（10件）に収まる
    for (let i = 1; i <= 9; i++) {
      const k = String(i).padStart(2, "0");
      const 行 = h.行(notes.get(`〔注文番号-F0606-014-${k}〕`));
      await expect(行, `注文 ${k} の行`).toHaveCount(1);
      const s = await h.処理状態(行);
      結果.push({ n: k, 状態: 注文(`014-${k}`).状態, 表示: s.表示, 内容: 状態の文(s) });
    }
  });
  await expected(async () => {
    for (const r of 結果) expect.soft(r.表示, `注文 ${r.n}（BOステータス ${r.状態}）の処理状態が表示される（表示: ${r.内容}）`).toBe(true);
    note("手順の注記", `表示された処理状態: ${結果.map((r) => `${r.n}=${r.状態}→${r.内容}`).join(" / ")}`);
  });
});

// ---------------------------------------------------------------- 015・016・030 注文番号・処理状態を押して詳細へ
function 押して詳細へ(n: string, 前半: string, パスワード: string, 押す: "注文番号" | "処理状態"): CaseBody {
  return async (c) => {
    note("手順の注記", 日付の注記);
    const { step, expected, notes } = c;
    const h = 履歴(c);
    await step(1, async () => { await ログイン(c, 前半, パスワード); });
    await step(2, async () => { await h.開く(); });
    await step(3, async () => {
      const 行 = h.行(notes.get(`〔注文番号-F0606-${n}〕`));
      await expect(行).toHaveCount(1);
      await h.押して遷移する(押す === "注文番号" ? h.注文番号のリンク(行) : h.処理状態のリンク(行));
    });
    await expected(async () => {
      expect.soft(h.path, "遷移した画面（注文購入履歴詳細）").toBe(詳細のパス(notes.get(`〔注文ID-F0606-${n}〕`)));
    });
  };
}

// ---------------------------------------------------------------- 017 「詳細を見る」で4種類の行から詳細へ
caseTest("IT-F06-06-017", async (c) => {
  note("手順の注記", `${日付の注記}。統合先の元の注文2件は、店頭受取注文として関連付けた画面が振った注文番号の注文`);
  const { step, expected, notes } = c;
  const h = 履歴(c);
  const 到着: { 行: string; 期待: string; 実際: string }[] = [];
  const 押す = async (名前: string, キー: string, 期待ID: string) => {
    const 行 = h.行(キー);
    await expect(行, `${名前}の行`).toHaveCount(1);
    await h.押して遷移する(h.詳細を見るボタン(行));
    到着.push({ 行: 名前, 期待: 詳細のパス(期待ID), 実際: h.path });
    await h.開く();
  };
  await step(1, async () => { await ログイン(c, "display-f0606-017", pw("017")); });
  await step(2, async () => { await h.開く(); });
  await step(3, async () => { await 押す("EC", notes.get("〔注文番号-F0606-017A〕"), notes.get("〔注文ID-F0606-017A〕")); });
  await step(4, async () => {
    await 押す("店頭受取受注", notes.get("〔注文番号-F0606-017B〕"), notes.get("〔注文ID-F0606-017B〕"));
    await 押す("店頭受取受注からスマレジ取引", "R060600000117", 注文("017統合先").ID);
    await 押す("スマレジ取引", "R060600000217", 注文("017単独").ID);
  });
  await expected(async () => {
    expect.soft(await h.注文の枠.count(), "表示される行は4件（統合の元の注文は個別に表示されない）").toBe(4);
    for (const r of 到着) expect.soft(r.実際, `${r.行}の行から遷移した画面`).toBe(r.期待);
  });
});

// ---------------------------------------------------------------- 027 管理画面の対応状況の変更が処理状態に反映される
caseTest("IT-F06-06-027", async (c) => {
  note("手順の注記", `${画像の注記}。ブラウザBの管理者は、試験の準備に使う既存の全権限の管理者で代える。${日付の注記}`);
  const { step, expected, browser, notes } = c;
  const h = 履歴(c);
  const adminCtx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(adminCtx);
    const ap = await adminCtx.newPage();
    ap.setDefaultTimeout(60_000);
    const edit = new OrderEditPage(ap);
    const 番号 = notes.get("〔注文番号-F0606-QF001〕");
    let 前 = "", 後 = "", 保存後 = "";
    await step(1, async () => { await ログイン(c, "qf-f0606-001", "Passw0rd-QF0606"); await h.開く(); });
    await step(2, async () => { 前 = 状態の文(await h.処理状態(h.行(番号))); });
    await step(3, async () => { await loginAdmin(ap, SETUP_ADMIN); await edit.openByOrderNo(番号, await 本店の店名(browser)); });
    await step(4, async () => { await edit.ステータスを選ぶ("入金済み"); await edit.ステータスを変更する(() => undefined); });
    await step(5, async () => { await expectSaved(ap, "受注ステータスの変更"); 保存後 = await edit.現在のステータス(); });
    await step(6, async () => { await h.開く(); 後 = 状態の文(await h.処理状態(h.行(番号))); });
    await expected(async () => {
      expect.soft(保存後, "管理画面の現在のステータス").toBe("入金済み");
      expect.soft(前, "手順2の処理状態（入金待ちの表示）").toContain("入金待ち");
      expect.soft(後, "手順6の処理状態（出荷準備の表示）").toContain("出荷準備");
    });
  } finally {
    await adminCtx.close();
  }
});

void 本店名; void 高松店名;
