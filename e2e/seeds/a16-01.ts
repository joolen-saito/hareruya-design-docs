/**
 * A16-01 トップバナー情報取得（GET /topBanner/{バナーID}）のシード。正本: cases/A16-01_seed_data.tsv
 * 005 だけを書いた。使うシードは S-A16-01-ENV（接続先の設定）だけ。
 * シードでの解釈（正本の外の補い）: 共有の開発環境では接続先を書き換えず、環境に設定済みの値を使う（A16-02 の ENV と同じ）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";

defineSeed("S-A16-01-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有の開発環境では接続先を書き換えず、環境に設定済みの値を使った（試験ブラウザから公開APIへ認証情報なしで GET を送る）");
});
