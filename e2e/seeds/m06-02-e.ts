/**
 * M06-02 古物台帳入力用CSV出力 の追加シード（2026-11-21）。正本: cases/M06-02_seed_data.tsv
 *
 * S-M06-02-DOMESTIC-003: seeds/m06-02.ts と同じ作り方（フロントの店頭買取査定申込 → 実行の印つきの買取にだけ DB で設定）。
 * - 店舗ID 1（共有の店舗）は買取店舗Aで代える。店頭買取注文DBレコードID 60200301・査定ID AS-M0602-001-003 は、画面が振った値に読み替える。
 * - 職業「会社員」は、職業マスタに無ければ画面（職業マスタ）で足す（あるものは変えない）。職業・適格請求書発行事業者・事業者番号は申込の画面で指定する（pages/front/m06_otc_buy_e.ts）。
 * - 買取合計金額 12500 円・ステータス買取成立は DB で設定する。CSVダウンロード対象のチェックなしは、チェックを付けない状態のまま。
 */
import { SETUP_ADMIN } from "../config/env";
import { 買取を整える } from "../db/m06_04_prep";
import { 受注ID, 申込日時と更新日時を設定する } from "../db/m06_05";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureJob } from "../pages/admin/f06_masters";
import { defineSeed } from "./current_seed";
import { 支店URL } from "./m06-01";
import { 職業と事業者番号を指定して申込む } from "../pages/front/m06_otc_buy_e";
import { 査定IDを読む, 申込者の } from "./m06-common";
import "./m06-02";

defineSeed("S-M06-02-DOMESTIC-003", { needs: ["S-M06-02-ADM"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 姓 = rc("M0602CASE003");
  const 足した = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return ensureJob(page, "会社員");
  });
  issue(`職業マスタの「会社員」は${足した ? "無かったので、画面（職業マスタ）で足した" : "既にあるので、そのまま使った"}`);
  // 職業と適格請求書発行事業者（登録番号）は、申込の画面で指定する（DBで書かない）
  await 職業と事業者番号を指定して申込む(browser, 支店URL("A"), 申込者の(姓, rc("M0602CASE003太郎"), "カイトリシケン", "イチロウ"), { 職業: "会社員", 事業者番号: "T1234567890003" });
  const [id] = await 査定IDを読む(browser, 姓, 1);
  const 注文 = 受注ID(id);
  買取を整える(注文, RUN_MARK, { 状態: "買取成立", 成立日: "2026-05-11 10:00:00", 合計金額: 12500, キャンセル日: null });
  申込日時と更新日時を設定する(id, { 申込: "2025-04-06 10:00:00" });
  notes.setExtra("〔査定ID-M0602-003〕", id);
  notes.setExtra("〔申込者の姓-M0602-003〕", 姓);
  issue("買取はフロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付けた。査定ID（正本は AS-M0602-001-003）は画面が振った値に読み替えた。店舗ID 1（共有の店舗）は買取店舗Aで代えた");
  issue("職業（会社員）と適格請求書発行事業者の区分（事業者）・事業者番号（T1234567890003）は、申込の画面で指定した。DBで、買取のステータスを買取成立・買取成立日を2026-05-11・買取合計金額を12500円にした（実行の印つきの買取にだけ書いた）");
});
