/**
 * M06-02 古物台帳入力用CSV出力 の画面シード。正本: cases/M06-02_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10「既存データか、画面で作ったデータに読み替えてよい。画面で作れない部分は、E2E が作った実行の印つきのデータに限りDBへ書いてよい」）で、次のように作る。
 * - 管理者: メンバー管理で登録する（権限はシステム管理者。所属・編集可能・デフォルト検索表示店舗は買取店舗A）。
 * - 買取: フロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付ける。査定IDは画面が振った値に読み替える（正本は決め打ち）。
 *   店舗ID 1 は共有の店舗なので使わず、買取店舗A（M06-01 の試験店舗）で代える。
 * - ステータス（買取成立）・申込日・買取成立日・買取明細・個別入力商品・身分証・適格請求書発行事業者の区分は、実行の印つきの買取にだけ、DBで設定する／足す（db/m06_02.ts・db/m06_05.ts・db/m06_04_prep.ts）。
 *   買取明細・個別入力商品は商品の紐づけなし（数量だけ）。国は申込で選んだ値のまま（国を使うケースの期待結果は無い）。
 * 作らないシード: DOMESTIC-003（職業マスタに「会社員」が無く、共有のマスタは書き換えない）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { 買取を整える } from "../db/m06_04_prep";
import { 受注ID, 申込日時と更新日時を設定する } from "../db/m06_05";
import { 事業者区分を設定する, 個別入力商品を数量で足す, 買取明細を数量で足す, 身分証を設定する } from "../db/m06_02";
import { 支店URL } from "./m06-01";
import { 申込を行う, 査定IDを読む, 申込者の } from "./m06-common";

export const M0602_ADMIN: Account = { loginId: "m0602_admin", password: "Passw0rd!M0602" };
const L_A = "〔店舗ID-M0601-共有A〕";

defineSeed("S-M06-02-ADM", { needs: ["S-M06-01-SHOPS"] }, async ({ browser, notes }) => {
  const a = notes.get(L_A);
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "M06-02試験管理者", ログインID: M0602_ADMIN.loginId, メールアドレス: "m0602_admin@example.com", パスワード: M0602_ADMIN.password,
    権限: "システム管理者", 所属店舗ID: a, デフォルト検索表示店舗ID: a, 編集可能店舗ID: [a],
  }));
});

type 整え = { 明細?: number[]; 個別?: number[]; 身分証?: string; 事業者?: boolean };

const 共通の注記 = [
  "買取はフロントの店頭買取査定申込（会員登録なし）で買取店舗Aに申込み、申込者の姓・名に実行の印を付けた。査定IDは画面が振った値に読み替えた（正本は決め打ち）。店舗ID 1 は共有の店舗なので、買取店舗Aで代えた",
  "ステータス（買取成立）・申込日（2025-04-06）・買取成立日（2026-05-11）・買取明細・個別入力商品・身分証・適格請求書発行事業者の区分は、実行の印つきの買取にだけDBで設定した／足した（買取明細・個別入力商品は商品の紐づけなしで数量だけ）",
];

/** 同じ申込者の姓で件数ぶん申込み（古い順）、各買取をDBで整える。査定IDを古い順で返す */
async function 買取群を作る(browser: Browser, 姓の元: string, 件数: number, 指定: (i: number) => 整え): Promise<string[]> {
  const 姓 = rc(姓の元);
  await 申込を行う(browser, 支店URL("A"), Array.from({ length: 件数 }, () => 申込者の(姓, rc(`${姓の元}太郎`), "カイトリシケン", "イチロウ")));
  const ids = await 査定IDを読む(browser, 姓, 件数);
  ids.forEach((id, i) => {
    const v = 指定(i);
    const 注文 = 受注ID(id);
    買取を整える(注文, RUN_MARK, { 状態: "買取成立", 成立日: "2026-05-11 10:00:00", 合計金額: null, キャンセル日: null });
    申込日時と更新日時を設定する(id, { 申込: "2025-04-06 10:00:00" });
    for (const q of v.明細 ?? [1]) 買取明細を数量で足す(注文, q);
    (v.個別 ?? []).forEach((q, k) => 個別入力商品を数量で足す(注文, `個別入力商品${k + 1}`, q));
    if (v.身分証) 身分証を設定する(注文, v.身分証);
    if (v.事業者 !== undefined) 事業者区分を設定する(注文, v.事業者);
  });
  return ids;
}

const NEEDS = { needs: ["S-M06-02-ADM"] };
type Build = Parameters<typeof defineSeed>[2];

/** 1件の買取を作り、査定IDを〔査定ID-M0602-番号〕で控えるシード */
const 一件のシード = (no: string, v: 整え, 注記: string[] = []): Build => async ({ browser, notes, seed }) => {
  const [id] = await 買取群を作る(browser, `M0602CASE${no}`, 1, () => v);
  notes.set(`〔査定ID-M0602-${no}〕`, id);
  for (const m of [...共通の注記, ...注記]) reportSeedIssue(seed.シードID, m);
};

defineSeed("S-M06-02-DOMESTIC-001", NEEDS, 一件のシード("001", {}));
defineSeed("S-M06-02-DOMESTIC-005", NEEDS, 一件のシード("005", { 明細: [2, 3], 個別: [4, 1] }));
defineSeed("S-M06-02-DOMESTIC-007", NEEDS, 一件のシード("007", { 身分証: "自動車運転免許証" }));
defineSeed("S-M06-02-DPQTY-015", NEEDS, 一件のシード("015", { 明細: [1] }));
defineSeed("S-M06-02-DPQTY-016", NEEDS, 一件のシード("016", { 明細: [2, 3] }));
defineSeed("S-M06-02-DPQTY-017", NEEDS, 一件のシード("017", { 明細: [], 個別: [2, 4] }));
defineSeed("S-M06-02-CBNOTEXIST-020", NEEDS, 一件のシード("020", {}));

// 012: 3件（申込の古い順に 001・002・003）
defineSeed("S-M06-02-SELECTION-012", NEEDS, async ({ browser, notes, seed }) => {
  const ids = await 買取群を作る(browser, "M0602CASE012", 3, () => ({}));
  ids.forEach((id, i) => notes.set(`〔査定ID-M0602-012-${i + 1}〕`, id));
  for (const m of [...共通の注記, "3件の申込者姓は同じ（実行の印つき）。第2注文の国（アメリカ合衆国）は設定せず、申込のままにした（期待結果は国を確かめない）"]) reportSeedIssue(seed.シードID, m);
});

// 013: 身分証の種別が違う7件
const 身分証7 = ["パスポート", "健康保険被保険者証", "外国人登録証明書", "住民基本台帳カード", "学生証、会社員証", "身体障害者手帳", "マイナンバーカード"];
defineSeed("S-M06-02-IDTYPES-013", NEEDS, async ({ browser, notes, seed }) => {
  const ids = await 買取群を作る(browser, "M0602CASE013", 7, (i) => ({ 身分証: 身分証7[i] }));
  ids.forEach((id, i) => notes.set(`〔査定ID-M0602-013-${i + 1}〕`, id));
  for (const m of [...共通の注記, "身分証は身分証マスタの既存の行を名前で指した（マスタは変えない）。7件の申込者姓は同じ（実行の印つき）"]) reportSeedIssue(seed.シードID, m);
});

// 014: 事業者と事業者でない
defineSeed("S-M06-02-BUSINESS-014", NEEDS, async ({ browser, notes, seed }) => {
  const ids = await 買取群を作る(browser, "M0602CASE014", 2, (i) => ({ 事業者: i === 0 }));
  ids.forEach((id, i) => notes.set(`〔査定ID-M0602-014-${i + 1}〕`, id));
  for (const m of [...共通の注記, "事業者の注文は、適格請求書発行事業者の区分だけを事業者にした（事業者番号の登録情報は足していない。事業者番号は期待結果で確かめない）"]) reportSeedIssue(seed.シードID, m);
});

// 018・019: 11件
const 十一件のシード = (no: string): Build => async ({ browser, notes, seed }) => {
  const ids = await 買取群を作る(browser, `M0602CB${no}`, 11, () => ({}));
  ids.forEach((id, i) => notes.set(`〔査定ID-M0602-${no}-${i + 1}〕`, id));
  for (const m of [...共通の注記, "11件は申込の古い順に第1〜第11注文（IDが大きいほど新しい）。申込者姓は同じ（実行の印つき）で、ほかに部分一致する買取は無い"]) reportSeedIssue(seed.シードID, m);
};
defineSeed("S-M06-02-CBPAGEKEPT-018", NEEDS, 十一件のシード("018"));
defineSeed("S-M06-02-CBPAGENONE-019", NEEDS, 十一件のシード("019"));
