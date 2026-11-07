/**
 * F06-16 大会デッキ登録編集 の連携ケース（063）のシード（画面操作）。正本: cases/F06-16_seed_data.tsv
 * 既存の seeds/f06-16.ts・f06-16-b.ts は変えない。連携店・連携形式・カード・管理者は共有シード S-F06-16-PE-REF が（実行の印つきで）作る。
 */
import { SETUP_ADMIN } from "../config/env";
import { 会員の選手ID } from "../db/f06_16";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 会員を用意する, 試験会員, 大会を登録する } from "../pages/admin/f06_16_setup";
import { 連携の用意を作る } from "../pages/admin/f06_pe_setup";

export const 店名 = "連携店F0616";
export const 形式名 = "連携形式F0616";
export let 管理者: Account = { loginId: "", password: "" };
export let カード: { 日: string; 英: string }[] = [];
export const 会員一覧P = new Map<string, 試験会員 & { 選手ID: string }>();
export const 大会一覧P = new Map<string, { 大会名: string; 大会名英: string; イベントID: string; 日程ID: string }>();

defineSeed("S-F06-16-PE-REF", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const r = await 連携の用意を作る(page, {
      店名, 通番: "f0616pe", 管理者の通番: "F0616PE", 形式: { 名: 形式名, 英名: "F0616LinkFormat", コード: "X6P", 並び順: "9605", メイン: ["1", "60"], サイド: ["0", "15"] },
      カード: [{ 日: "上書稲妻", 英: "Overwrite Bolt" }, { 日: "上書島", 英: "Overwrite Island" }],
    }, (m) => { void seed; console.warn(m); });
    notes.set("〔店舗ID-F0616-共有〕", r.店舗ID);
    notes.set("〔フォーマットID-F0616-共有〕", r.フォーマットID);
    管理者 = r.管理者;
    カード = r.カード;
  });
});

defineSeed("S-F06-16-PE-CASE-063", { needs: ["S-F06-16-PE-REF"] }, async ({ browser, notes }) => {
  const 会員 = await 会員を用意する(browser, { ベース: "pe-f0616-001", 姓: "F0616", 名: "F0616PE001", セイ: "レンケイ", メイ: "テスト", 英字名: { 姓: "OMEGA", 名: "TARO" } });
  const 選手ID = 会員の選手ID(会員.会員ID);
  if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
  会員一覧P.set("001", { ...会員, 選手ID });
  notes.set("〔会員ID-F0616-001〕", 会員.会員ID);
  const 名 = rc("連携上書大会-F0616-PE001"), 英 = rc("Link Overwrite Cup F0616 F0616PE001");
  const 大 = await withAdminSession(browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名, 英名: 英, 店舗: 店名, フォーマット: [形式名], 日程: { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-31 23:59", 終了する: false } });
  });
  大会一覧P.set("001", { 大会名: 名, 大会名英: 英, ...大 });
  notes.set("〔イベントID-F0616-001〕", 大.イベントID);
  notes.set("〔イベント詳細ID-F0616-001〕", 大.日程ID);
});
