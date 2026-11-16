/**
 * M15-05 デッキ編集（更新・複製・削除・検索ポップアップ・候補の入力）のシードの作り方（画面操作）。正本: cases/M15-05_seed_data.tsv
 *
 * - 共有マスタ（フォーマット・カード・アーキタイプ・デッキタグ）は seeds/m15-05-b.ts の共有シード（S-M15-05-FMT など）を使う。
 * - デッキの名前は「M1505-NNN」に実行の印を付けた語を前半に置く（rc）。値の文字数を確かめるケース（083・084）の更新後の値には印を付けない。
 * - 店舗「M1505-107-店舗甲」などは作らず、使い回す店舗の表から店舗IDで選ぶ（依頼者 2026-11-15「店舗は作るのもう禁止」）。
 *   店舗甲 = 店舗ID 221、店舗乙 = 4973（同じケースで両方使う107の2店は別の店舗）、M1505-123-店舗 = 店舗ID 2、M1505-126-店舗 = 店舗ID 3（元からある店舗。店舗の設定は書き換えない）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { RUN_MARK, rcFixed } from "../lib/run_marker";
import { ensureM05Admin, 本店の店名 } from "../pages/admin/m05_admin_member";
import { ensureMemberFixed as ensureMember } from "../pages/admin/member";
import { 店舗IDで選ぶ, 表の店舗 } from "../pages/admin/store_pick";
import { イベントと日程を用意する, デッキを登録する, デッキ登録内容 } from "../pages/admin/m15_deck";
import { 名 } from "../pages/admin/m15_05_master";
import { M1505_ADMIN } from "./m15-05";
import { 語, 最終更新者を付け替える } from "./m15-05-b";

export const M1505_EVT107: Account = { loginId: "m1505_evt107", password: M1505_ADMIN.password };
export const M1505_EVT126: Account = { loginId: "m1505_evt126", password: M1505_ADMIN.password };

/** 最終更新者を確かめる管理者。決まった名前で1度だけ作って使い回す（前の実行の残りのデッキは、シードで最終更新者を付け替える） */
export const M1505_U098: Account = { loginId: rcFixed("m1505_u098").toLowerCase(), password: M1505_ADMIN.password };

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>, 管理者: Account = SETUP_ADMIN) =>
  withAdminSession(browser, 管理者, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

const 標準 = () => ({ フォーマット: 名("標準"), アーキタイプ: 名("型甲") });
const マスタ = ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-ARC"];
const カードつき = ["S-M15-05-ADM", "S-M15-05-FMT", "S-M15-05-CARD", "S-M15-05-ARC"];

function デッキのシード(seedId: string, defs: { key: string; デッキ名: string; 内容?: Partial<デッキ登録内容> }[], needs: string[] = マスタ): void {
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (p) => {
      for (const d of defs) notes.set(`〔デッキID-M1505-${d.key}〕`, await デッキを登録する(p, { デッキ名: d.デッキ名, ...標準(), ...d.内容 }, issue));
    });
  });
}
const 通常 = (n: string, 内容: Partial<デッキ登録内容> = {}) => [{ key: n, デッキ名: `${語(n)}-デッキ`, 内容 }];

// 現行フォーマット検査用（現行フォーマットは管理画面の登録で偽になる）。登録済みカードなし
デッキのシード("S-M15-05-DECKW-076", 通常("076"));
for (const n of ["077", "080", "081", "082", "083", "084", "085", "087", "088", "092", "093", "094", "095", "096", "097", "098", "100", "101", "102", "106", "114", "115", "118"]) {
  デッキのシード(`S-M15-05-DECK-${n}`, 通常(n));
}
デッキのシード("S-M15-05-DECK-078", 通常("078", { メイン: `4 ${名("カードA")}`, サイド: `3 ${名("カードB")}` }), カードつき);
デッキのシード("S-M15-05-DECK-079", 通常("079", { 成績: `${語("079")}-成績`, 順位: "3", 参加人数: "64", 引用元URL: "https://example.com/M1505-079" }));
デッキのシード("S-M15-05-DECK-089", 通常("089", { 成績: `${語("089")}-成績`, 順位: "3", メイン: `4 ${名("カードA")}`, サイド: `3 ${名("カードB")}`, 統率: `1 ${名("カードA")}` }), カードつき);
デッキのシード("S-M15-05-DECK-091", 通常("091", { 成績: `${語("091")}-成績`, 順位: "3", メイン: `4 ${名("カードA")}` }), カードつき);
デッキのシード("S-M15-05-DECK-103", 通常("103", { メイン: `4 ${名("カードA")}`, サイド: `3 ${名("カードB")}` }), カードつき);
デッキのシード("S-M15-05-DECK2-099", [
  { key: "099A", デッキ名: `${語("099")}-対象` }, { key: "099B", デッキ名: `${語("099")}-残す` },
]);
// シード表は、番号順の先頭〔デッキID-M1505-108A〕と末尾〔デッキID-M1505-108L〕を控えると定める（間の10件は控えない）。ケースは先頭（01）を A で引く
defineSeed("S-M15-05-DECK12-108", { needs: マスタ }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-DECK12-108", m);
  await 管理画面(browser, async (p) => {
    for (let i = 0; i < 12; i++) {
      const nn = String(i + 1).padStart(2, "0");
      const id = await デッキを登録する(p, { デッキ名: `${語("108")}-${nn}`, ...標準() }, issue);
      if (i === 0) notes.set("〔デッキID-M1505-108A〕", id);
      if (i === 11) notes.set("〔デッキID-M1505-108L〕", id);
    }
  });
});

defineSeed("S-M15-05-ADM2-098", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: M1505_U098.loginId, account: M1505_U098, メール: `${M1505_U098.loginId}@example.test` });
  await 最終更新者を付け替える(browser, M1505_U098, (m) => reportSeedIssue("S-M15-05-ADM2-098", m));
});

// ---- 新規登録の入力だけで成り立つもの（登録前の状態） ----
for (const n of ["112", "135"]) defineSeed(`S-M15-05-NEWREQ-${n}`, { needs: ["S-M15-05-ADM"] }, async () => { /* 作るものは無い（登録前の状態） */ });
for (const n of ["120", "121", "122"]) defineSeed(`S-M15-05-SESS-${n}`, async () => { /* ケースごとの新しいブラウザの状態で成り立つ */ });

// ---- 店舗・イベント ----
export const 店舗名 = { 甲: 表の店舗("221").店名, 乙: 表の店舗("4973").店名, S123: 表の店舗("2").店名, S126: 表の店舗("3").店名 } as const;

/** 新しい店舗でイベントを登録できる管理者（イベント登録の店舗の選択肢は、管理者が編集できる店舗だけ。共有の試験管理者の権限は変えない）を、メンバー管理の画面で登録する */
async function イベント管理者を用意する(browser: Browser, 管理者: Account, 名前: string, 店舗: string[]): Promise<void> {
  const 本店 = await 本店の店名(browser);
  await 管理画面(browser, async (p) => {
    await ensureMember(p, { 名前, 所属店舗: 本店, ログインID: 管理者.loginId, メールアドレス: `${管理者.loginId}@example.test`, パスワード: 管理者.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店, ...店舗] });
  });
}

defineSeed("S-M15-05-EVT-107", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-EVT-107", m);
  await 管理画面(browser, async (p) => {
    await 店舗IDで選ぶ(p, "221", "M1505-107-店舗甲", issue);
    await 店舗IDで選ぶ(p, "4973", "M1505-107-店舗乙", issue);
  });
  await イベント管理者を用意する(browser, M1505_EVT107, "M15-05イベント試験管理者107", [店舗名.甲, 店舗名.乙]);
  await 管理画面(browser, async (p) => {
    const A = await イベントと日程を用意する(p, { 名日: `${語("107")}-甲大会`, 名英: `${語("107")}-AlphaCup`, 開始時間: "2026-03-10 10:00", 店舗: 店舗名.甲 }, issue);
    const B = await イベントと日程を用意する(p, { 名日: `${語("107")}-乙大会`, 名英: `${語("107")}-BetaCup`, 開始時間: "2026-03-12 10:00", 店舗: 店舗名.乙 }, issue);
    notes.setExtra("〔イベントID-M1505-107-A〕", A.イベントID); // 店舗甲のイベントA
    notes.setExtra("〔イベントID-M1505-107-B〕", B.イベントID); // 店舗乙のイベントB（店舗甲の検索結果に出ないこと）
  }, M1505_EVT107);
});
defineSeed("S-M15-05-STORE-123", { needs: ["S-M15-05-ADM"] }, async ({ browser }) => {
  await 管理画面(browser, async (p) => { await 店舗IDで選ぶ(p, "2", "M1505-123-店舗", (m) => reportSeedIssue("S-M15-05-STORE-123", m)); });
});
defineSeed("S-M15-05-EVT-126", { needs: ["S-M15-05-ADM"] }, async ({ browser, notes }) => {
  const issue = (m: string) => reportSeedIssue("S-M15-05-EVT-126", m);
  await 管理画面(browser, async (p) => { await 店舗IDで選ぶ(p, "3", "M1505-126-店舗", issue); });
  await イベント管理者を用意する(browser, M1505_EVT126, "M15-05イベント試験管理者126", [店舗名.S126]);
  await 管理画面(browser, async (p) => {
    const ev = await イベントと日程を用意する(p, { 名日: `${語("126")}-甲大会`, 名英: `${語("126")}-AlphaCup`, 開始時間: "2026-03-10 10:00", 店舗: 店舗名.S126 }, issue);
    notes.set("〔イベントID-M1505-126〕", ev.イベントID);
  }, M1505_EVT126);
});
