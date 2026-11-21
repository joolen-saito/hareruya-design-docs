/**
 * M14-10 フォーマット詳細(登録・編集・削除) のシードの作り方（画面操作）その6。正本: cases/M14-10_seed_data.tsv（IT-M14-10-030 の分だけ）
 *
 * 読み替え（シードの注記に残す）:
 *  - 名前（フォーマット・カード・アーキタイプ・デッキ・カードセット）は、実行の印を付けた。
 *  - 「ARENA対応のカードセット」は、既存（人が作った）のカードセットを書き換えず、この実行で画面から登録した印つきのカードセットを使った。
 *    カードセットを ARENA 対応にする入力欄は管理画面に無いので、そのカードセット1件だけを DB で ARENA 対応にした（db/m14_10_f_write.ts）。
 *  - シード表の「MTG ARENAで導入済は未選択」は、フォーマット登録で何も選ばないことで満たした。
 */
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { カードセットをARENA対応にする } from "../db/m14_10_f_write";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { カードセットを登録する } from "../pages/admin/m14_08_cardset";
import { CardEditPage } from "../pages/admin/m14_04_card_edit";
import { 必須 } from "./m14-04";
import { 公開デッキを作る } from "./m14-10-d";

/** カードセット欄に、画面で登録したカードセット（番号で指定）を選んでカードを登録し、カードIDを返す */
async function カードを登録する(page: Page, v: { 日: string; 英: string; カードセットID: string }, what: string): Promise<string> {
  const e = new CardEditPage(page);
  await e.openNew();
  await e.基本情報を入れる({ カード名日: v.日, カード名英: v.英, 点数で見たマナ: "0" });
  const det = await e.詳細情報を追加する();
  await e.必須を入れる(det, 必須);
  await det.locator('select[name$="[cardset]"]').selectOption(v.カードセットID);
  const r = await e.登録を押す();
  const m = /\/card\/(\d+)\/edit/.exec(r.url);
  if (!r.sent || !m) throw new Error(`${what}: カード「${v.日}」を登録できない（${r.url} ${(await e.通知()).join(" / ")}）`);
  return m[1];
}

defineSeed("S-M14-10-DOWNSTREAM-030", { needs: ["S-M14-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 名日 = rc("連携確認フォーマット-030");
    const id = await フォーマットを登録する(page, { 名日, 名英: rc("Integration Link Format-030"), 並び順: "70", メタ日数: "14", チェック: { ArenaLegalFlg: false } }, seed.シードID);
    notes.set("〔フォーマットID-M1410-030〕", id);
    const セット名 = rc("連携確認ARENA対応セット-030");
    const セットID = await カードセットを登録する(page, { 名日: セット名, 名英: セット名, 略称: rc("ARN030"), リリース日: "2026-10-01" }, seed.シードID);
    await カードを登録する(page, { 日: rc("日英カード-030"), 英: rc("Bilingual Card-030"), カードセットID: セットID }, seed.シードID);
    カードセットをARENA対応にする(セットID, `${seed.シードID}: カードに収録したカードセットをARENA対応にするため`);
    await 公開デッキを作る(page, "030", { id, 名日 }, issue, `4 ${rc("日英カード-030")}`);
    issue(`名前は実行の印を付けた（${名日}・${rc("日英カード-030")}・${rc("Bilingual Card-030")}・${セット名}）。ARENA対応のカードセットは、この実行で登録した印つきのカードセット（ID ${セットID}）1件だけを DB で ARENA 対応にした`);
    issue("アーキタイプは「連携確認アーキタイプ-030」（実行の印つき）を画面で登録した。デッキの開催日は実行日の3日前");
  });
});
