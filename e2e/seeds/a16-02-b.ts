/**
 * A16-02 の 007・008 のシード（記録 review/A16-02_progress_2026-11-21_dev.md の 11/25 の節）。
 * - S-A16-02-NO-LANGUAGE: 言語コードXXの言語が無いことを数えて確かめるだけ。あれば止める（共有マスタなので、行の欄を空にする削除はしない）。
 */
import { 言語を探す } from "../db/a16_02";
import { defineSeed } from "../lib/seeds";

defineSeed("S-A16-02-NO-LANGUAGE", async ({ seed }) => {
  const 言語 = 言語を探す("XX");
  if (言語) throw new Error(`${seed.シードID}: 言語コードXXの言語が登録されている（前提は「存在しない」。共有マスタなので消さずに止める）`);
});
