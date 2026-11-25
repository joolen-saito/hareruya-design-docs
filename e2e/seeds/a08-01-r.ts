/**
 * A08-01 トップバナーIDのトップバナー情報を取得の 002・006 のシード（-r。2026-11-25）。正本: cases/A08-01_seed_data.tsv
 * 正本の外の補い（記録にも書く）:
 * - シード表の「残存の紐づけ・バナーを削除して登録する」は、ID 108012999・108016001 の固定IDを使わず、次のように読み替える。
 *   002: トップバナーID 108012999 のバナーが DB に無いことを読んで確かめる（あれば止める。消さない）。
 *   006: 表示タイプ0・言語の紐づけ0件のバナーを、画像URLの末尾に実行の印（?e2e=印）を付けて1行足す（番号は振られた番号に読み替える）。
 *   前の実行の同じ目印のバナーが残っていれば片づけてから足す（E2E が足した行だけ）。
 */
import { バナーを足す, バナーが無い, 前の実行のバナーを片づける } from "../db/a08_r";
import { defineSeed, reportSeedIssue } from "../lib/seeds";

export const 画像URL006 = "https://example.com/banner/a08-01-108016001.png";
export const リンク006 = "https://example.com/campaign/a08-01-108016001";

defineSeed("S-A08-01-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "APIベースURLは開発環境の API サーバー（ケースの「/topBanner/…」は同じ経路）。ログインしていない試験ブラウザから GET を送る");
});

defineSeed("S-A08-01-NOTFOUND-002", async ({ seed }) => {
  if (!バナーが無い("108012999")) throw new Error(`${seed.シードID}: トップバナーID 108012999 が DB にある（無いはず）。ほかの方の行かもしれないので消さずに止める`);
  reportSeedIssue(seed.シードID, "トップバナーID 108012999 のトップバナーが DB に無いことを読んで確かめた（シード表の「削除」は行わない）");
});

defineSeed("S-A08-01-LANG0-006", async ({ notes, seed }) => {
  const 片づけた = 前の実行のバナーを片づける(seed.シードID, 画像URL006);
  const b = バナーを足す(`${seed.シードID}: トップバナー`, { 画像URL: 画像URL006, リンク: リンク006, 表示タイプ: 0, 代替: "A08-01結合テスト006", 並び順: 108016001 });
  notes.set("〔トップバナーID-A0801-006〕", b.id);
  notes.set("〔画像URL-A0801-006〕", b.画像URL);
  reportSeedIssue(seed.シードID, `トップバナー（ID ${b.id}・表示タイプ0・言語の紐づけ0件）を、画像URLの末尾に実行の印を付けて DB で足した（画面に足す手段が無い。固定ID 108016001 は振られた番号 ${b.id} に読み替え）。前の実行の残り ${片づけた} 件を片づけた`);
});
