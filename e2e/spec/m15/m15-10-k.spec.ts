// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-10 アーキタイプ登録CSV（管理画面）。正本: cases/M15-10_test_cases.tsv
 *
 * - 正本の「CSVファイルのアップロード」ボタンは、画面では「CSVファイルをアップロード」。「検索する >」は「検索する」（M15-08 と同じ）。
 * - 「…csvを選択する」は、画面の「ファイルを選択」を押し、開いたファイル選択でシードが試験端末に保存したファイルを選ぶ。
 * - 「OS標準のファイル選択ウィンドウ」は、ブラウザが開こうとしたファイル選択を Playwright が受け取ったことで確かめる（自動の試験では OS の窓は出ない）。
 * - 「開発者ツールで…」は、画面の要素をスクリプトで消す・書き換える。
 * - 代表カード名「Test Card」「Test Card M1510-037-A」、041・046 のキー、034〜036 の名前は実行の印つき（seeds/m15-10.ts の冒頭）。
 *
 * 実装しないケース:
 * - 007: シード S-M15-10-UPDATE-BLANK-007 の記事「ART-1」との紐付けが DB での準備
 */
import { Page, test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { loginAdmin, Account } from "../../lib/session";
import { アーキタイプ, アーキタイプの記録, キーのアーキタイプ, 日本語名のアーキタイプ, 語を含む日本語名 } from "../../db/m15_10_archetype_k";
import { ArchetypeSearchPage, CSV取り込みのパス, pathOf } from "../../pages/admin/m15_08_archetype_search";
import {
  ArchetypeCsvPage, CSVアップロードのパス, アップロードの結果, アーキタイプの選択肢を探す, デッキ一覧を開く, 取込ファイル, 完了の文, 編集画面の表示, 題名,
} from "../../pages/admin/m15_10_archetype_csv";
import { M1510_ADMIN, M1510L_ADMIN, キー041, キー046, テストカード, テストカード037, 連携 } from "../../seeds/m15-10-k";
import "../../seeds/m15-10-k";
import "../../seeds/m15-10"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const P = "Pioneer";
const 題名の文 = "アーキタイプ登録CSVアップロード";
const 並べる = (a: string[]) => [...a].sort();

async function ログイン(page: Page, who: Account = M1510_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, who);
}

/** アップロードの結果を注記に残す（画面のメッセージ・応答） */
async function 結果を残す(c: ArchetypeCsvPage, r: アップロードの結果): Promise<void> {
  if (!r.送った) note("「CSVファイルをアップロード」を押したが、画面が移らなかった");
  const ok = await c.完了メッセージの文();
  const ng = await c.エラーの文();
  note(`アップロードの応答 ${r.応答 ?? "なし"}・移った画面 ${pathOf(r.url)}${ok.length ? `・完了のメッセージ「${ok.join(" / ")}」` : ""}${ng.length ? `・エラー「${ng.join(" / ")}」` : ""}`);
}

/**
 * 手順1〜3（開く・選ぶ・アップロード）と、手順4（DBで確認）がある型。手順4で読んだ値を期待結果で確かめる
 */
function 取込んでDBを見る<T>(ファイル: string, 読む: (ctx: CaseCtx) => T, 確かめる: (v: T, ctx: CaseCtx) => 確かめ[]) {
  return async (ctx: CaseCtx) => {
    const { page, step, expected } = ctx;
    await ログイン(page);
    const c = new ArchetypeCsvPage(page);
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { await c.ファイルを選ぶ(取込ファイル(ファイル)); });
    await step(3, async () => { await 結果を残す(c, await c.アップロードを押す()); });
    let v: T | undefined;
    await step(4, async () => { v = 読む(ctx); });
    await expected(async () => {
      for (const x of 確かめる(v as T, ctx)) expect.soft(x.実際, x.項目).toEqual(x.期待);
    });
  };
}

/** 手順1〜3だけ（画面を見る）型 */
function 取込んで画面を見る(ファイル: string, 確かめる: (c: ArchetypeCsvPage) => Promise<確かめ[]>) {
  return async ({ page, step, expected }: CaseCtx) => {
    await ログイン(page);
    const c = new ArchetypeCsvPage(page);
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { await c.ファイルを選ぶ(取込ファイル(ファイル)); });
    await step(3, async () => { const r = await c.アップロードを押す(); await 結果を残す(c, r); });
    await expected(async () => {
      for (const x of await 確かめる(c)) expect.soft(x.実際, x.項目).toEqual(x.期待);
    });
  };
}

/** 期待結果の確かめ1つ（項目・実際・期待）。期待結果の中で expect.soft(実際, 項目).toEqual(期待) にする */
type 確かめ = { 項目: string; 実際: unknown; 期待: unknown };
const k = (項目: string, 実際: unknown, 期待: unknown): 確かめ => ({ 項目, 実際, 期待 });
const 色 = (rec: アーキタイプの記録 | null | undefined, want: string[], what: string): 確かめ => k(`${what}のカラー`, 並べる(rec?.カラー ?? []), 並べる(want));

caseTest("IT-M15-10-010", 取込んでDBを見る("representative-card.csv",
  () => キーのアーキタイプ("代表カード試験JP", "Representative Test EN", P),
  (rows, { notes }) => [
    k("「代表カード試験JP」の削除されていないアーキタイプの件数", rows.length, 1),
    k(`「代表カード試験JP」の代表カード画像（カード名「${テストカード}」）`, rows[0]?.代表カード画像ID, notes.get("〔画像ID-M1510-共有C〕")),
  ]));

caseTest("IT-M15-10-011", 取込んでDBを見る("representative-unknown.csv",
  () => キーのアーキタイプ("代表未解決JP", "Representative Unknown EN", P),
  (rows) => [
    k("「代表未解決JP」の削除されていないアーキタイプの件数（新規登録）", rows.length, 1),
    k("「代表未解決JP」の代表カード画像（未設定は空）", rows[0]?.代表カード画像ID, ""),
  ]));

caseTest("IT-M15-10-012", 取込んでDBを見る("update-blank-012.csv",
  ({ notes }) => アーキタイプ(notes.get("〔アーキタイプID-M1510-012〕")),
  (rec, { notes }) => [k(`ID ${notes.get("〔アーキタイプID-M1510-012〕")} の代表カード画像`, rec?.代表カード画像ID, notes.get("〔画像ID-M1510-共有A〕"))]));

// ---------------------------------------------------------------------------
// 連携（034〜036）
// ---------------------------------------------------------------------------

/** 連携の手順1〜4（ログイン・開く・選んでアップロード・完了の確認） */
async function 連携で取り込む({ page, step }: CaseCtx, ファイル: string): Promise<void> {
  const c = new ArchetypeCsvPage(page);
  await step(1, async () => { await ログイン(page, M1510L_ADMIN); });
  await step(2, async () => { await c.開く(); });
  await step(3, async () => {
    await c.ファイルを選ぶ(取込ファイル(ファイル));
    await 結果を残す(c, await c.アップロードを押す());
  });
  await step(4, async () => {
    expect.soft(await c.完了メッセージの文(), "登録完了のメッセージ").toContain(完了の文);
    expect(pathOf(page.url()), "戻った画面のアドレス（アーキタイプ登録CSVアップロード画面）").toBe(CSVアップロードのパス());
  });
}

// ---------------------------------------------------------------------------
// 代表カード・混在・重ね取込（037〜040）
// ---------------------------------------------------------------------------

caseTest("IT-M15-10-037", 取込んでDBを見る("language-filter-037.csv",
  () => キーのアーキタイプ("代表言語試験JP-M1510-037", "Language Filter EN-M1510-037", P),
  (rows, { notes }) => [
    k("「代表言語試験JP-M1510-037」の削除されていないアーキタイプの件数", rows.length, 1),
    k(`代表カード画像（カード名「${テストカード037}」。フランス語版 ${notes.get("〔画像ID-M1510-037B〕")} は除外）`, rows[0]?.代表カード画像ID, notes.get("〔画像ID-M1510-037A〕")),
  ]));

caseTest("IT-M15-10-039", 取込んでDBを見る("dpm1510-039-replace.csv",
  ({ notes }) => アーキタイプ(notes.get("〔アーキタイプID-M1510-039〕")),
  (rec, { notes }) => [k(`ID ${notes.get("〔アーキタイプID-M1510-039〕")} の代表カード画像`, rec?.代表カード画像ID, notes.get("〔画像ID-M1510-共有C〕"))]));

/** 043〜045: 削除済みのIDと、同じキーの削除されていないアーキタイプを読む */
const 削除済みの読み = (n: string) => ({ notes }: CaseCtx) => ({
  id: notes.get(`〔アーキタイプID-M1510-${n}〕`),
  rec: アーキタイプ(notes.get(`〔アーキタイプID-M1510-${n}〕`)),
  keys: キーのアーキタイプ(`削除済JP-M1510-CB${n}`, `Deleted EN-M1510-CB${n}`, P),
});
/** 削除済みのIDは削除済みのまま、別のIDで1件新規登録され、その中身 */
const 削除済みの確かめ = (画像: string, カラー: string[], v: ReturnType<ReturnType<typeof 削除済みの読み>>): 確かめ[] => [
  k(`削除済みの ID ${v.id} が削除済みのまま`, v.rec?.削除済み, true),
  k("同じキーの削除されていないアーキタイプの件数", v.keys.length, 1),
  k(`新しく登録されたアーキタイプのIDが ${v.id} と別`, v.keys.length > 0 && v.keys[0].ID !== v.id, true),
  k("新しく登録されたアーキタイプの公開状態", v.keys[0]?.公開状態, "公開"),
  k("新しく登録されたアーキタイプの代表カード画像（未設定は空）", v.keys[0]?.代表カード画像ID, 画像),
  色(v.keys[0], カラー, "新しく登録されたアーキタイプ"),
];
caseTest("IT-M15-10-043", 取込んでDBを見る("m1510-cb043.csv", 削除済みの読み("043"), (v) => 削除済みの確かめ("", [], v)));
caseTest("IT-M15-10-044", 取込んでDBを見る("m1510-cb044.csv", 削除済みの読み("044"), (v, { notes }) => 削除済みの確かめ(notes.get("〔画像ID-M1510-共有C〕"), ["緑", "黒"], v)));

caseTest("IT-M15-10-046", 取込んでDBを見る("m1510-cb046.csv",
  () => キーのアーキタイプ(キー046.名日, キー046.名英, P, true),
  (rows, { notes }) => [
    k("キーが一致するアーキタイプ（削除済みを含む）の件数", rows.length, 1),
    k("そのアーキタイプが削除済みか", rows[0]?.削除済み, false),
    k("公開状態", rows[0]?.公開状態, "公開"),
    k("代表カード画像", rows[0]?.代表カード画像ID, notes.get("〔画像ID-M1510-共有C〕")),
    色(rows[0], ["青", "白"], "そのアーキタイプ"),
  ]));
