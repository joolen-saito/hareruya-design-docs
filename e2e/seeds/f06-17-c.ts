/**
 * F06-17 大会デッキ登録確認〜完了 の連携ケース（037・039〜043）のシード（画面操作）。正本: cases/F06-17_seed_data.tsv
 * 既存の seeds/f06-17.ts・f06-17-b.ts は変えない。
 *
 * - 連携店・連携形式・カード・店舗を編集できる管理者は共有シード S-F06-17-PE-REF が作る（実行の印つき。管理者のログインIDは実行の印つき）。
 * - 会員は、フロントの新規会員登録で作り、MTG Companion登録本名(英語)は管理画面の会員編集で入れる。メールの前半・大会名・カード名には実行の印を付ける。
 * - 大会は、デッキ登録あり・締切 2099-12-31 23:59・受付なし・公開。開始は 2099-12-20 10:00（041〜043 は 2026-01-01 10:00）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 会員の選手ID } from "../db/f06_16";
import { rc } from "../lib/run_marker";
import { defineSeed, SeedCtx } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 会員を用意する, 試験会員, 大会を登録する } from "../pages/admin/f06_16_setup";
import { 連携の用意を作る } from "../pages/admin/f06_pe_setup";

export const 店名 = "連携店F06-17";
export const 形式名 = "連携形式F06-17";
export let 管理者: Account = { loginId: "", password: "" };
export let カード: { 日: string; 英: string }[] = [];
export const 会員一覧C = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧C = new Map<string, { 大会名: string; 大会名英: string; イベントID: string; 日程ID: string }>();

const label = (項目: string, 呼び名: string): string => `〔${項目}-F0617-${呼び名}〕`;

defineSeed("S-F06-17-PE-REF", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const r = await 連携の用意を作る(page, {
      店名, 通番: "f0617pe", 管理者の通番: "F0617PE", 形式: { 名: 形式名, 英名: "F0617LinkFormat", コード: "X7G", 並び順: "9707", メイン: ["1", "60"], サイド: ["0", "15"] },
      カード: [{ 日: "連携稲妻", 英: "Link Bolt" }, { 日: "連携島", 英: "Link Island" }, { 日: "連携否認", 英: "Link Negate" }],
    }, (m) => { void seed; console.warn(m); });
    notes.set("〔店舗ID-F0617-共有〕", r.店舗ID);
    notes.set("〔フォーマットID-F0617-共有〕", r.フォーマットID);
    管理者 = r.管理者;
    カード = r.カード;
  });
});

type 作り方 = { n: string; 英字姓: string; 大会名: string; 大会名英: string; 開始: string };

async function 作る(ctx: SeedCtx, p: 作り方): Promise<void> {
  const { browser, notes } = ctx;
  const 会員 = await 会員を用意する(browser, { ベース: `pe-f0617-${p.n}`, 姓: "F06-17", 名: `F0617PE${p.n}`, セイ: "レンケイ", メイ: "テスト", 英字名: { 姓: p.英字姓, 名: "TARO" } });
  const 選手ID = 会員の選手ID(会員.会員ID);
  if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
  会員一覧C.set(p.n, { ...会員, 選手ID });
  notes.set(label("会員ID", p.n), 会員.会員ID);
  const 名 = rc(p.大会名), 英 = rc(p.大会名英);
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名, 英名: 英, 店舗: 店名, フォーマット: [形式名], 日程: { 開始: p.開始, デッキ登録: true, 締切: "2099-12-31 23:59", 終了する: false } });
  });
  大会一覧C.set(p.n, { 大会名: 名, 大会名英: 英, ...大 });
  notes.set(label("イベントID", p.n), 大.イベントID);
  notes.set(label("イベント詳細ID", p.n), 大.日程ID);
}

const def = (seedId: string, p: 作り方): void => { defineSeed(seedId, { needs: ["S-F06-17-PE-REF"] }, (ctx) => 作る(ctx, p)); };
const 通常 = "2099-12-20 10:00", 過去 = "2026-01-01 10:00";
def("S-F06-17-PE-CASE-037", { n: "001", 英字姓: "ALPHA", 大会名: "連携デッキ大会-F0617-PE001", 大会名英: "Link Deck Cup F06-17 F0617PE001", 開始: 通常 });
def("S-F06-17-PE-CASE-039", { n: "003", 英字姓: "CHARLIE", 大会名: "連携デッキ大会-F0617-PE003", 大会名英: "Link Deck Cup F06-17 F0617PE003", 開始: 通常 });
def("S-F06-17-PE-CASE-040", { n: "004", 英字姓: "DELTA", 大会名: "連携デッキ大会-F0617-PE004", 大会名英: "Link Deck Cup F06-17 F0617PE004", 開始: 通常 });
def("S-F06-17-PE-CASE-041", { n: "005", 英字姓: "ECHO", 大会名: "連携デッキ大会M15-F0617-PE005", 大会名英: "Link Deck Cup M15 F06-17 F0617PE005", 開始: 過去 });
def("S-F06-17-PE-CASE-042", { n: "006", 英字姓: "FOXTROT", 大会名: "連携デッキ大会M15-F0617-PE006", 大会名英: "Link Deck Cup M15 F06-17 F0617PE006", 開始: 過去 });
def("S-F06-17-PE-CASE-043", { n: "007", 英字姓: "GOLF", 大会名: "連携デッキ大会M15-F0617-PE007", 大会名英: "Link Deck Cup M15 F06-17 F0617PE007", 開始: 過去 });
