/**
 * M06-04 買取ステータス変更 の追加シード（2026-11-21）。正本: cases/M06-04_seed_data.tsv
 *
 * S-M06-04-BASE-025（金額保持データ）:
 * - 買取は、フロントの店頭買取査定申込（会員登録なし）で買取店舗Aへ申込み、画面が振った査定ID・店頭買取受注IDを控える（seeds/m06-04-status.ts と同じ作り方）。
 * - 買取金額 1000 円・販売金額 1500 円は、画面で指定できないので、実行の印つきの買取にだけ DB で足す
 *   （買取の査定合計金額を 1000 円にし、買取明細を1件〔買取金額1000・販売金額1500〕足す。部門は既存の部門の先頭。db/m06_04_prep.ts を通す）。
 * - 税額 100 円は、新しいアプリの店頭買取に税額を持つ項目が無く、設定も確かめもできない（読み替え。ケースにも注記を残す）。
 * - ステータス変更履歴 0 件は DB で消さず、申込で入った「査定前」の履歴のまま（金額の保持を確かめるケースなので、履歴の件数は期待結果に関わらない）。
 */
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import * as prep from "../db/m06_04_prep";
import { 部門のID } from "../db/m06_03";
import { defineSeed } from "./current_seed";
import { 店舗Aで申込む } from "./m06-04-status";

defineSeed("S-M06-04-BASE-025", { needs: ["S-M06-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const 名 = rc("BASE025");
  const r = await 店舗Aで申込む(browser, seed.シードID, "M0604", 名);
  const 部門 = 部門のID("0");
  prep.買取を整える(r.受注ID, 名, { 状態: "査定前", 成立日: null, 合計金額: 1000 });
  prep.明細を足す(r.受注ID, 名, { 部門ID: 部門.ID, 買取金額: 1000, 販売金額: 1500 });
  notes.set("〔店頭買取受注ID-M0604-025〕", r.受注ID);
  notes.set("〔査定ID-M0604-025〕", r.査定ID);
  reportSeedIssue(seed.シードID, `買取金額1000円・販売金額1500円は画面で指定できないので、実行の印つきの買取（店頭買取受注ID ${r.受注ID}）にだけ DB で足した（査定合計金額1000円・買取明細1件〔買取1000円・販売1500円・部門ID ${部門.ID}（既存の部門の先頭）〕）`);
  reportSeedIssue(seed.シードID, "税額100円は、新しいアプリの店頭買取に税額を持つ項目が無いので設定できない（読み替え）。ステータス変更履歴は、申込で入った「査定前」の1件のまま");
});
