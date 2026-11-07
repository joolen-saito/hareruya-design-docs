/**
 * F06-17 大会デッキ登録確認〜完了 のシード（画面操作）。正本: cases/F06-17_seed_data.tsv
 *
 * - 店舗「晴れる屋テスト店」・フォーマット6件は共有シード S-F06-17-REF が「あれば使い、無ければ作る」。カードは実行ごとに（名前に実行の印を付けて）作る。
 *   画像ありのカードはカードCSV（画像URLを入れる）、画像なしカードはカード新規登録画面（詳細情報を足さない）で登録する。
 * - 会員は、フロントの新規会員登録で作り（依頼者決定 2026-10-31）、英字名 TEST TARO は管理画面の会員編集で入れる。メール・大会名にも実行の印を付ける。
 * - 日程は、開始 2099-12-20 10:00・デッキ登録あり・締切 2099-12-31 23:59・終了しない・受付なし・公開。
 * - 作った大会デッキは、会員でログインして画面から提出する。
 * - 会員のDCIナンバーは管理画面の会員編集画面に項目が無いので入れない（ケースが確かめるのは「保持されない」「表示されない」）。
 */
import { SETUP_ADMIN } from "../config/env";
import { カードID, 会員の選手ID } from "../db/f06_16";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 試験店舗を登録する, 試験店舗の管理者を用意する } from "../pages/admin/f07_01_setup";
import { 会員を用意する, 会員の指定, 試験会員, 大会を登録する, 日程の指定 } from "../pages/admin/f06_16_setup";
import { カード名, フォーマット一覧17, フォーマットを用意する17, 画像ありカードを取り込む, 英名, 店名17 } from "../pages/admin/f06_17_setup";
import { カードを登録する } from "../pages/admin/m14_card";
import { DeckEditPage } from "../pages/front/f06_16_deck_entry";
import { frontLogin } from "../pages/admin/m04_19_order_shortage";

export const 会員一覧 = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧 = new Map<string, { 大会名: string; イベントID: string; 日程ID: string }>();
export const 提出したデッキ = new Map<string, string>();
export const フォーマットID = new Map<string, string>();
export let 管理者: Account = { loginId: "", password: "" };

const label = (項目: string, 呼び名: string): string => `〔${項目}-F0617-${呼び名}〕`;
const 符号 = "ABCDEF";

defineSeed("S-F06-17-REF", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    notes.set("〔店舗ID-F0617-共有〕", await 試験店舗を登録する(page, 店名17, "f0617", issue));
    管理者 = await 試験店舗の管理者を用意する(page, "F0617", [店名17]);
    for (const [i, f] of フォーマット一覧17.entries()) {
      const id = await フォーマットを用意する17(page, f);
      フォーマットID.set(f.名, id);
      notes.set(`〔フォーマットID-F0617-共有${符号[i]}〕`, id);
    }
    const E = (k: string) => 英名(k, RUN_MARK);
    const [std, modern, , , , err] = フォーマット一覧17.map((f) => f.英名);
    await 画像ありカードを取り込む(page, [
      { 日: カード名.通常A(), 英: E("NormalA"), 使用可: [std, modern, err] },
      { 日: カード名.通常B(), 英: E("NormalB"), 使用可: [std] },
      { 日: カード名.旧(), 英: E("OldCard"), 使用可: [std] },
      { 日: カード名.禁止B(), 英: E("BanB"), 使用可: [], 禁止: [err] },
      { 日: カード名.制限R(), 英: E("LimitR"), 使用可: [], 制限: [err] },
      { 日: カード名.範囲外O(), 英: E("OutO"), 使用可: [] },
    ], `f0617-${RUN_MARK.toLowerCase()}`, issue);
    await カードを登録する(page, { カード名日: カード名.画像なし(), カード名英: E("NoImage"), 点数で見たマナ: "0", リーガリティ: [{ フォーマット: フォーマット一覧17[0].名, リーガリティ: "使用可" }], 詳細: false }, "F06-17 画像なしカード", issue);
    for (const [名, 呼び名] of [["NormalA", "A"], ["NormalB", "B"], ["OldCard", "C"], ["NoImage", "D"], ["BanB", "E"], ["LimitR", "F"], ["OutO", "G"]] as const) {
      notes.set(`〔カードID-F0617-共有${呼び名}〕`, カードID(E(名)));
    }
  });
});

const SD = ["スタンダード試験"];
const 既定の日程: 日程の指定 = { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-31 23:59", 終了する: false };

export type 作り方 = {
  n: string; 大会名: string; フォーマット?: string[]; 日程?: Partial<日程の指定>; 会員?: Partial<会員の指定>;
  /** 別の大会（日程）をもう1つ作る（送信先を書き換えるケース用） */
  大会B?: { 大会名: string; フォーマット: string[]; 日程: Partial<日程の指定> };
  /** 会員でログインして提出しておく（デッキIDを 提出したデッキ に控える） */
  提出済み?: { フォーマット?: string; メイン: string; サイド: string };
  /** 提出済みのデッキを、別の会員（選手）が所有するデッキとして作る */
  別会員で提出?: boolean;
};

async function 提出する(ctx: SeedCtx, 会員: 試験会員, 日程ID: string, v: { フォーマット?: string; メイン: string; サイド: string }): Promise<string> {
  const context = await ctx.browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(120_000);
    await frontLogin(page, 会員);
    const e = new DeckEditPage(page);
    await e.開く(日程ID);
    if (v.フォーマット && (await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ(v.フォーマット);
    await e.入力する("メイン", v.メイン);
    await e.入力する("サイド", v.サイド);
    const r = await e.提出する();
    if (!r.送信) throw new Error("大会デッキの提出が送信されない");
    const id = /\/deckentry\/(\d+)\/check/.exec(page.url())?.[1];
    if (!id) throw new Error(`大会デッキを提出したが完了画面へ移らない（${page.url()}）`);
    return id;
  } finally {
    await context.close();
  }
}

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const { browser, notes } = ctx;
  const 会員 = await 会員を用意する(browser, { ベース: `f0617-${p.n}`, 英字名: { 姓: "TEST", 名: "TARO" }, ...p.会員 });
  const 選手ID = 会員の選手ID(会員.会員ID);
  if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
  会員一覧.set(p.n, { ...会員, 選手ID });
  notes.set(label("会員ID", p.n), 会員.会員ID);
  notes.set(label("選手ID", p.n), 選手ID);
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const a = await 大会を登録する(page, { 名: p.大会名, 店舗: 店名17, フォーマット: p.フォーマット ?? SD, 日程: { ...既定の日程, ...p.日程 } });
    const b = p.大会B ? await 大会を登録する(page, { 名: p.大会B.大会名, 店舗: 店名17, フォーマット: p.大会B.フォーマット, 日程: { ...既定の日程, ...p.大会B.日程 } }) : undefined;
    return { a, b };
  });
  大会一覧.set(p.n, { 大会名: p.大会名, ...大.a });
  const aの呼び名 = p.大会B ? `${p.n}A` : p.n;
  notes.set(label("イベントID", aの呼び名), 大.a.イベントID);
  notes.set(label("イベント詳細ID", aの呼び名), 大.a.日程ID);
  if (大.b && p.大会B) {
    大会一覧.set(`${p.n}B`, { 大会名: p.大会B.大会名, ...大.b });
    notes.set(label("イベントID", `${p.n}B`), 大.b.イベントID);
    notes.set(label("イベント詳細ID", `${p.n}B`), 大.b.日程ID);
  }
  if (p.提出済み) {
    const id = await 提出する(ctx, 会員, 大.a.日程ID, p.提出済み);
    提出したデッキ.set(p.n, id);
    notes.set(label("デッキID", p.n), id);
  }
}

const defineCaseSeed = (seedId: string, p: Omit<作り方, "大会名"> & { 大会名?: string }): void => {
  defineSeed(seedId, { needs: ["S-F06-17-REF"] }, (ctx) => 作る(ctx, { ...p, 大会名: rc(p.大会名 ?? `F06-17単一形式大会-${p.n}`) }));
};
const 提出内容 = () => ({ メイン: `1 ${カード名.通常A()}`, サイド: `1 ${カード名.通常B()}` });

defineCaseSeed("S-F06-17-CASE-001", { n: "001" });
defineCaseSeed("S-F06-17-CASE-003", { n: "003" });
defineCaseSeed("S-F06-17-CASE-007", { n: "007", 会員: { 姓: "ヤマダ", 名: "ハナコ", セイ: "ヤマダ", メイ: "ハナコ", 英字名: undefined } });
defineCaseSeed("S-F06-17-CASE-008", { n: "008" });
defineCaseSeed("S-F06-17-CASE-009", { n: "009" });
defineCaseSeed("S-F06-17-CASE-014", { n: "014", 大会名: "F06-17送信元大会-014A", 大会B: { 大会名: rc("F06-17期限超過大会-014B"), フォーマット: ["期限超過試験形式"], 日程: { 締切: "2000-01-01 00:00" } } });
defineCaseSeed("S-F06-17-CASE-015", { n: "015", フォーマット: ["エラー試験形式"] });
defineCaseSeed("S-F06-17-CASE-016", { n: "016", フォーマット: ["エラー試験形式"] });
defineCaseSeed("S-F06-17-CASE-017", { n: "017", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-018", { n: "018", 大会名: "F06-17複数形式大会-018", フォーマット: ["スタンダード試験", "モダン試験"], 提出済み: { フォーマット: "モダン試験", メイン: `1 ${カード名.通常A()}`, サイド: "" } });
defineCaseSeed("S-F06-17-CASE-019", { n: "019", 提出済み: { フォーマット: "スタンダード試験", メイン: `1 ${カード名.画像なし()}`, サイド: "" } });
defineCaseSeed("S-F06-17-CASE-020", { n: "020", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-021", { n: "021", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-022", { n: "022", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-023", { n: "023", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-024", { n: "024", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-029", { n: "029", 提出済み: { フォーマット: "スタンダード試験", ...提出内容() } });
defineCaseSeed("S-F06-17-CASE-030", { n: "030" });

// 027: ログイン会員（A）と、別の選手（B）のデッキ。デッキは B の会員でログインして提出する
defineSeed("S-F06-17-CASE-027", { needs: ["S-F06-17-REF"] }, async (ctx) => {
  const { browser, notes } = ctx;
  const a = await 会員を用意する(browser, { ベース: "f0617-027a", 英字名: { 姓: "TEST", 名: "TARO" } });
  const b = await 会員を用意する(browser, { ベース: "f0617-027b", 英字名: { 姓: "TEST", 名: "TARO" } });
  const 選手A = 会員の選手ID(a.会員ID), 選手B = 会員の選手ID(b.会員ID);
  if (!選手A || !選手B) throw new Error("会員の選手が見つからない");
  会員一覧.set("027", { ...a, 選手ID: 選手A });
  notes.set(label("会員ID", "027A"), a.会員ID); notes.set(label("会員ID", "027B"), b.会員ID);
  notes.set(label("選手ID", "027A"), 選手A); notes.set(label("選手ID", "027B"), 選手B);
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名: rc("F06-17単一形式大会-027"), 店舗: 店名17, フォーマット: SD, 日程: 既定の日程 });
  });
  大会一覧.set("027", { 大会名: rc("F06-17単一形式大会-027"), ...大 });
  notes.set(label("イベントID", "027"), 大.イベントID); notes.set(label("イベント詳細ID", "027"), 大.日程ID);
  const id = await 提出する(ctx, b, 大.日程ID, { フォーマット: "スタンダード試験", ...提出内容() });
  提出したデッキ.set("027", id);
  notes.set(label("デッキID", "027"), id);
});
