// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * M15-02 デッキCSV出力（管理画面）のシードの作り方（画面操作）。正本: cases/M15-02_seed_data.tsv
 *
 * シード表と違えたところ（解釈）:
 * - 試験管理者（m1502_admin）: メンバー管理で登録する。権限はデッキ管理を操作できる「システム管理者」（正本は権限の名前を定めない。M15-01・M15-04 と同じ部品）。
 * - 参照データ（REF）: シード表は、フォーマットID 1・2、カードID 8708・6140、カード画像ID 173271 を記載の値へ DB で戻すと定める。
 *   DB は書き換えず、画面で記載どおりかを確かめる（フォーマット詳細のフォーマット名(英)、カード詳細のカード名(英)、
 *   デッキ新規登録画面の代表カード検索の画像IDの行）。違えば止める（判定は条件付き）。
 *   アーキタイプ「青白コントロール」「バーン」は決め打ちの識別の値なので、実行の印を付けて登録する（「青白コントロール」→「青白コントロール-印」、
 *   名(英)も同じ）。開発用のデータに同じ名前のアーキタイプがあっても、デッキの登録で取り違えないため。ケースの期待結果の「青白コントロール」も、
 *   同じ印を付けた値として読む。
 * - CSV出力文字コード設定（CONFIG）: 管理画面に項目の無いアプリの設定で、変えるにはアプリの設定ファイルとコンテナの起こし直しが要る（E2E ではしない）。
 *   設定を読み、UTF-8 であることを確かめるだけにする（違えば止める）。UTF-8 のケース（014・023）だけを実装した。SJIS-win のケース（015・024）は実装しない。
 * - ダウンロード先（DLDIR）: 試験用ブラウザのダウンロードは Playwright が受ける。受けたファイルを、この機能の専用のディレクトリ（OS の一時ディレクトリの下）
 *   へ保存する。作るときに中のファイルを消して0件であることを確かめる。ケース（013）も、始めに0件であることを確かめる。
 * - 存在しないデッキID（NOTFOUND-007・008、CBPARTUTF8-023 の 159999007・159999008・159999023）: シード表は、あれば DB で消すと定める。
 *   消さずに、デッキ編集の画面を開いて「無い」（404）ことを確かめる。あれば止める（判定は条件付き）。
 * - 「任意の値」のフォーマット・アーキタイプは、アーキタイプのあるフォーマットの先頭と、そのアーキタイプの先頭（M15-01 の部品）。
 * - イベント開催日の秒を DB で設定する指定（ENCODING-014）: 画面で入る 2026/08/31 14:05 のまま（秒は 00）。ケース 014 はイベント開催日を確かめない。
 * - デッキ名・イベント名はシード表の値のまま（ケースはデッキIDで検索し、名前を検索に使わない）。
 *
 * 作らないシード（ケースを実装しない）:
 * - S-M15-02-RICH-009・S-M15-02-MIXED-022（イベント開催日の秒を DB で設定する。ケースが秒まで確かめる）
 * - S-M15-02-SPARSE-010・S-M15-02-MIXED-022（フォーマット・アーキタイプ・代表カード画像を未設定にするのは DB でだけできる。画面では必須）
 * - S-M15-02-ENCODING-015・S-M15-02-CBPARTSJIS-024（CSV出力文字コード設定を SJIS-win へ変える必要がある。上記 CONFIG）
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Browser, Page } from "@playwright/test";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { デッキを登録する, デッキ登録内容 } from "../pages/admin/m15_deck";
import { デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import { アーキタイプを登録する } from "../pages/admin/m15_09_archetype_edit";
import { カードの英語名, デッキ編集の応答, フォーマットの名前, 代表カードを画像IDで選ぶ, 代表カードつきでデッキを登録する } from "../pages/admin/m15_02_deck_csv_export";

export const M1502_ADMIN: Account = { loginId: "m1502_admin", password: "Passw0rd!M1502" };

/** 共有の参照データ（シード表の記載） */
export const 参照 = {
  StandardのID: "1", ModernのID: "2",
  SolRingのID: "8708", LightningBoltのID: "6140", LightningBoltの画像ID: "173271",
};
/** アーキタイプの名前（実行の印つき）。期待結果の「青白コントロール」「バーン」も、この値として読む */
export const 青白コントロール = () => rc("青白コントロール");
export const バーン = () => rc("バーン");

/** ケース 013 のダウンロード先（この機能の専用のディレクトリ） */
export const ダウンロード先 = path.join(os.tmpdir(), "e2e-m1502-downloads");

const 管理画面 = <T>(browser: Browser, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, M1502_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

/** フォーマット名(英)が記載どおりのフォーマットの名(日)（選択肢の表示）を読む。違えば止める */
async function フォーマットの選択肢(page: Page, id: string, 名英: string): Promise<string> {
  const f = await フォーマットの名前(page, id);
  if (!f) throw new Error(`フォーマットID ${id} のフォーマットが無い（シード表は DB で記載の値へ戻すと定める。E2E は DB を書き換えない）`);
  if (f.名英 !== 名英) throw new Error(`フォーマットID ${id} のフォーマット名(英)が「${f.名英}」で、記載の「${名英}」でない（E2E は DB を書き換えない）`);
  return f.名日;
}
let Standardの名日: string | null = null;
async function Standard(page: Page): Promise<string> {
  return (Standardの名日 ??= await フォーマットの選択肢(page, 参照.StandardのID, "Standard"));
}

defineSeed("S-M15-02-REF", { needs: ["S-M15-02-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-02-REF";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const std = await Standard(page);
    const mod = await フォーマットの選択肢(page, 参照.ModernのID, "Modern");
    for (const [id, 名] of [[参照.SolRingのID, "Sol Ring"], [参照.LightningBoltのID, "Lightning Bolt"]] as const) {
      const n = await カードの英語名(page, id);
      if (n !== 名) throw new Error(`カードID ${id} のカード名(英)が「${n ?? "（カードが無い）"}」で、記載の「${名}」でない（E2E は DB を書き換えない）`);
    }
    await page.goto(adminUrl("/deck/new"));
    const e = new デッキ編集画面(page);
    await e.読み込みを待つ();
    const 行 = await 代表カードを画像IDで選ぶ(e, "Lightning Bolt", 参照.LightningBoltの画像ID, false);
    if (!行.includes("Lightning Bolt")) throw new Error(`カード画像ID ${参照.LightningBoltの画像ID} の行のカード名が「${行}」で、記載の Lightning Bolt でない`);
    issue(`参照データは DB で戻さず、画面で記載どおりであることを確かめた（フォーマットID 1「${std}」/Standard、2「${mod}」/Modern、カードID 8708 Sol Ring、6140 Lightning Bolt、カード画像ID 173271「${行}」）`);
    notes.set("〔アーキタイプID-M1502-共有A〕", await アーキタイプを登録する(page, { 名日: 青白コントロール(), 名英: rc("M15-02 UW Control"), 公開状態: "公開", フォーマット: std }, issue));
    notes.set("〔アーキタイプID-M1502-共有B〕", await アーキタイプを登録する(page, { 名日: バーン(), 名英: rc("M15-02 Burn"), 公開状態: "公開", フォーマット: mod }, issue));
    issue("アーキタイプ「青白コントロール」「バーン」は、実行の印を付けた名前で登録した（開発用のデータの同じ名前と取り違えないため）");
  });
});

defineSeed("S-M15-02-CONFIG", async () => {
  reportSeedIssue("S-M15-02-CONFIG", "CSV出力文字コード設定は画面で変えられない（アプリの設定ファイル）。E2E は変えず、この環境ではアプリの設定を読まないので、既定の UTF-8 とみなした（実装したケースの前提。出力の文字コードの表記は結果で確かめる）");
});

// ---- ケース専用のデッキ ----

const 公開 = (名日 = "M15-02イベント", 名英 = "M15-02 Event"): Partial<デッキ登録内容> => ({ 公開状態: "公開", イベント名日: 名日, イベント名英: 名英, 開催日: "2026-09-01T10:00" });

/** 任意のフォーマット・アーキタイプのデッキを登録して控える */
function defineDecksSeed(seedId: string, decks: { 控え: string; デッキ名: string; 内容: Partial<デッキ登録内容> }[], 無いID?: string): void {
  defineSeed(seedId, { needs: ["S-M15-02-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 管理画面(browser, async (page) => {
      for (const d of decks) notes.set(d.控え, await デッキを登録する(page, { デッキ名: d.デッキ名, デッキタイプ: "event", ...d.内容 }, issue));
      if (無いID) await 無いことを確かめる(page, 無いID, issue);
    });
  });
}

async function 無いことを確かめる(page: Page, id: string, issue: (m: string) => void): Promise<void> {
  const st = await デッキ編集の応答(page, id);
  if (st !== 404) throw new Error(`デッキID ${id} のデッキ編集の画面の応答が ${st}（無いはずのデッキがある。E2E は DB で消さない）`);
  issue(`デッキID ${id} は DB で消さず、デッキ編集の画面が 404 で「無い」ことを確かめた`);
}

defineDecksSeed("S-M15-02-DATA-001", [{ 控え: "〔デッキID-M1502-001〕", デッキ名: "M15-02デッキ-001", 内容: 公開() }]);
defineDecksSeed("S-M15-02-SELECTION-002", [
  { 控え: "〔デッキID-M1502-002A〕", デッキ名: "M15-02選択対象甲002", 内容: 公開() },
  { 控え: "〔デッキID-M1502-002B〕", デッキ名: "M15-02選択対象乙002", 内容: { 公開状態: "非公開" } },
  { 控え: "〔デッキID-M1502-002C〕", デッキ名: "M15-02非選択対象-002", 内容: 公開() },
]);
defineDecksSeed("S-M15-02-NOSELECT-004", [{ 控え: "〔デッキID-M1502-004〕", デッキ名: "M15-02デッキ-004", 内容: 公開() }]);
defineDecksSeed("S-M15-02-NOSELECT-005", [{ 控え: "〔デッキID-M1502-005〕", デッキ名: "M15-02デッキ-005", 内容: 公開() }]);
defineDecksSeed("S-M15-02-NOSELECT-006", [{ 控え: "〔デッキID-M1502-006〕", デッキ名: "M15-02デッキ-006", 内容: 公開() }]);
defineDecksSeed("S-M15-02-NOTFOUND-007", [{ 控え: "〔デッキID-M1502-007〕", デッキ名: "M15-02変更元デッキ-007", 内容: 公開() }], "159999007");
defineDecksSeed("S-M15-02-NOTFOUND-008", [{ 控え: "〔デッキID-M1502-008〕", デッキ名: "M15-02変更元デッキ-008", 内容: 公開() }], "159999008");
defineDecksSeed("S-M15-02-RECORDS-012", [
  { 控え: "〔デッキID-M1502-012A〕", デッキ名: "M15-02レコード甲012", 内容: 公開() },
  { 控え: "〔デッキID-M1502-012B〕", デッキ名: "M15-02レコード乙012", 内容: { 公開状態: "非公開" } },
  { 控え: "〔デッキID-M1502-012C〕", デッキ名: "M15-02レコード丙012", 内容: { 公開状態: "限定公開" } },
]);
defineDecksSeed("S-M15-02-FILENAME-013", [{ 控え: "〔デッキID-M1502-013〕", デッキ名: "M15-02ファイル名確認-013", 内容: 公開() }]);
defineDecksSeed("S-M15-02-TOKEN-017", [{ 控え: "〔デッキID-M1502-017〕", デッキ名: "M15-02トークン確認-017", 内容: 公開() }]);
defineDecksSeed("S-M15-02-MESSAGE-018", [{ 控え: "〔デッキID-M1502-018〕", デッキ名: "M15-02メッセージ確認-018", 内容: 公開() }]);

defineSeed("S-M15-02-ENCODING-014", { needs: ["S-M15-02-ADM", "S-M15-02-REF"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-02-ENCODING-014";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    notes.set("〔デッキID-M1502-014〕", await 代表カードつきでデッキを登録する(page, {
      デッキ名: "M15-02日本語デッキ-014", デッキ種別: "event", フォーマット: await Standard(page), アーキタイプ: 青白コントロール(), 公開状態: "公開",
      イベント名日: "M15-02イベント", イベント名英: "M15-02 Event", 開催日: "2026/08/31 14:05",
      統率: "1 Sol Ring", メイン: "4 Lightning Bolt\n56 Island", サイド: "2 Negate\n13 Plains",
    }, { 語: "Lightning Bolt", 画像ID: 参照.LightningBoltの画像ID }, issue));
  });
  issue("イベント開催日の秒（06）は DB で設定せず、画面で入る 2026/08/31 14:05 のまま（このケースはイベント開催日を確かめない）");
});

defineSeed("S-M15-02-UNSAVED-016", { needs: ["S-M15-02-ADM", "S-M15-02-REF"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-02-UNSAVED-016";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    notes.set("〔デッキID-M1502-016〕", await デッキを登録する(page, {
      デッキ名: "M15-02未保存値確認-016", デッキタイプ: "event", フォーマット: await Standard(page), アーキタイプ: 青白コントロール(), ...公開(),
    }, issue));
  });
});

defineSeed("S-M15-02-CBPARTUTF8-023", { needs: ["S-M15-02-ADM", "S-M15-02-REF"] }, async ({ browser, notes }) => {
  const seedId = "S-M15-02-CBPARTUTF8-023";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await 管理画面(browser, async (page) => {
    const std = await Standard(page);
    notes.set("〔デッキID-M1502-023A〕", await デッキを登録する(page, {
      デッキ名: "M1502-CB023-存在デッキ甲", デッキタイプ: "event", フォーマット: std, アーキタイプ: 青白コントロール(),
      ...公開("M1502-CB023-イベント", "M1502-CB023-Event"), メイン: "4 Lightning Bolt",
    }, issue));
    notes.set("〔デッキID-M1502-023B〕", await デッキを登録する(page, {
      デッキ名: "M1502-CB023-存在デッキ乙", デッキタイプ: "event", フォーマット: std, アーキタイプ: 青白コントロール(), 公開状態: "非公開", メイン: "3 Sol Ring",
    }, issue));
    await 無いことを確かめる(page, "159999023", issue);
  });
});
