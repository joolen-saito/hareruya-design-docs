/**
 * M06-04 買取ステータス変更 のうち、買取集計・金額・明細・査定合計金額が要るケース。正本: cases/M06-04_test_cases.tsv
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: 画面で作った印つきの買取に、DBで値・明細・集計の行を入れたシード（seeds/m06-04-summary.ts）で流す。
 *
 * 実装しないケース: 025（買取金額・販売金額・税額の保持）。税額に当たる項目が店頭買取のデータに無く（アプリのエンティティで確かめた）、
 * 税額を確かめられないまま「変わらない」だけを見ると正本の期待結果を弱めることになるので実装しない。
 *
 * 正本の「その日の受注と集計を全件退避して削除し、終了時に戻す」は行わない（共有のデータを消さない）。読み替えはシードの報告と手順の注記に残す。
 * 買取集計の確認は、買取店舗A・Bの買取集計データだけを読む（読み替えた範囲）。
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 買取の日付, 買取集計, 集計の行, 店頭買取の状態 } from "../../db/m06_04";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { Notes } from "../../lib/notes";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { SummaryPage } from "../../pages/admin/m06_09_summary";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { OtcOrderDetailPage, OtcStatusChangePage, 経理払い出し済の確認 } from "../../pages/admin/m06_04_status";
import { OtcDetailPage, OtcListPage } from "../../pages/admin/m06_otc_list";
import { PurchaseHistoryPage } from "../../pages/front/m06_otc_buy";
import { STORE_A } from "../../seeds/m06-01";
import { QG_IT, QG_MEMBER_PASSWORD } from "../../seeds/m06-04";
import { M0604_ACCOUNT, M0604_IT_A, 読み替えた買取 } from "../../seeds/m06-04-status";
import { M0604_RF, 今日の日 } from "../../seeds/m06-04-summary";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 退避の注記 = "正本の「その日の受注と集計を全件退避して削除し、終了時に戻す」は行わない（共有のデータを消さない）。印つきの買取だけで確かめられるよう、その日の買取店舗A・Bの買取集計だけを読んだ（その日に集計対象の実データの買取が無いことをシードで確かめてある）";
const 決め打ち注記 = "決め打ちの査定ID・日は、シードの読み替え（画面が振った番号に読み替え、買取成立日などはDBで入れた）";
const 当日の注記 = "買取成立日・買取キャンセル日・入庫日時は、保存した日（実行当日）を日本時間の日付で確かめた。実行当日の買取集計は、買取店舗A・Bの分だけ読んだ";

const 店A = (notes: Notes) => notes.get("〔店舗ID-M0604-共有A〕");
const 店B = (notes: Notes) => notes.get("〔店舗ID-M0604-共有B〕");
const カード = (notes: Notes) => notes.get("〔部門ID-M0604-共有カード〕");
const サプライ = (notes: Notes) => notes.get("〔部門ID-M0604-共有サプライ〕");

type 期待の行 = { 店: "A" | "B"; 部門: "カード" | "サプライ"; 買取: number; 販売: number };
const 行にする = (notes: Notes, 行: 期待の行[]): 集計の行[] => 行.map((r) => ({
  店舗ID: r.店 === "A" ? 店A(notes) : 店B(notes), 部門ID: r.部門 === "カード" ? カード(notes) : サプライ(notes), 買取金額: r.買取, 販売金額: r.販売,
}));
const 並べ替え = (rows: 集計の行[]) => [...rows].sort((a, b) => (a.店舗ID + "/" + a.部門ID).localeCompare(b.店舗ID + "/" + b.部門ID, "en", { numeric: true }));
const 読む = (notes: Notes, 日: string) => 並べ替え(買取集計(日, [店A(notes), 店B(notes)]));

/** 変更画面を開く（開けたことを確かめる） */
async function 変更画面を開く(page: Page, 受注ID: string): Promise<OtcStatusChangePage> {
  const s = new OtcStatusChangePage(page);
  expect(await s.open(受注ID), "ステータス変更画面の応答").toBeLessThan(400);
  expect(await s.開いている(受注ID), "ステータス変更画面が開いた").toBe(true);
  return s;
}

function 保存の結果を残す(r: { sent: boolean; 応答の状態: number | null; 止めた理由: string }, url: string): void {
  note(r.sent ? `保存の送信の応答 ${r.応答の状態}。保存のあとの画面 ${new URL(url).pathname}` : `ブラウザの入力チェックが保存の送信を止めた（${r.止めた理由}）`);
}

type 変更の定め = {
  /** 正本の決め打ちの査定ID（シードが読み替えた買取）か、控えた店頭買取受注ID（呼び名）を返す関数 */
  固定: string | ((notes: Notes) => string);
  変更後: string;
  日: string;
  期待: 期待の行[];
  /** DBで確かめる買取のステータス（正本が定めるとき） */
  ステータス?: string;
  /** 確かめる日付（成立日は 当日 か YYYY-MM-DD） */
  日付?: { 成立日?: string; キャンセル日?: "当日"; 入庫日?: "当日" };
  注記?: string;
};

/**
 * 正本: 1. ステータス変更画面を開く／2. 変更後のステータスを選ぶ／3. 保存／4. DBで買取集計データ（と、買取のステータス・日付）を確認する。
 * 026〜029・043・044・052・053・065〜067・069 が同じ形。
 */
function ステータスを変えて集計をDBで見る(d: 変更の定め): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const 受注ID = typeof d.固定 === "function" ? d.固定(notes) : 読み替えた買取(d.固定).受注ID;
    const 前 = 読む(notes, d.日);
    await loginAdmin(page, M0604_IT_A);
    let s: OtcStatusChangePage | undefined;
    let 後: 集計の行[] = [];
    let 状態: ReturnType<typeof 店頭買取の状態> | undefined;
    let 日付: ReturnType<typeof 買取の日付> | undefined;
    await step(1, async () => { s = await 変更画面を開く(page, 受注ID); });
    await step(2, async () => { await s!.選ぶ(d.変更後); });
    await step(3, async () => { 保存の結果を残す(await s!.保存を押す(), page.url()); });
    await step(4, async () => {
      後 = 読む(notes, d.日);
      状態 = 店頭買取の状態(受注ID);
      日付 = 買取の日付(受注ID);
    });
    await expected(async () => {
      expect.soft(後, `${d.日} の買取集計データ（買取店舗A・B。変更の前は ${JSON.stringify(前)}）`).toEqual(並べ替え(行にする(notes, d.期待)));
      if (d.ステータス) expect.soft(状態!.ステータス, "保存のあとのステータス").toBe(d.ステータス);
      if (d.日付?.成立日) expect.soft(日付!.成立日, "買取成立日").toBe(d.日付.成立日 === "当日" ? 今日の日() : d.日付.成立日);
      if (d.日付?.キャンセル日) expect.soft(日付!.キャンセル日, "買取キャンセル日（保存した日）").toBe(今日の日());
      if (d.日付?.入庫日) expect.soft(日付!.入庫日, "入庫日時（保存した日）").toBe(今日の日());
    });
    note(退避の注記);
    note(`保存のあとのステータスは「${状態!.ステータス}」・買取成立日は ${日付!.成立日時 ?? "空"}`);
    if (d.注記) note(d.注記);
  };
}

caseTest("IT-M06-04-026", ステータスを変えて集計をDBで見る({
  固定: "600410026", 変更後: "入庫待ち", 日: "2026-08-20",
  期待: [{ 店: "A", 部門: "カード", 買取: 1500, 販売: 2700 }, { 店: "B", 部門: "サプライ", 買取: 400, 販売: 800 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-027", ステータスを変えて集計をDBで見る({
  固定: "600420027", 変更後: "未登録在庫あり", 日: "2026-08-21", 期待: [{ 店: "A", 部門: "カード", 買取: 900, 販売: 1300 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-028", ステータスを変えて集計をDBで見る({
  固定: "600430028", 変更後: "管理者取消", 日: "2026-08-22", 期待: [{ 店: "A", 部門: "カード", 買取: 250, 販売: 400 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-029", ステータスを変えて集計をDBで見る({
  固定: "600440029", 変更後: "査定中", 日: "2026-08-23", 期待: [{ 店: "A", 部門: "カード", 買取: 999, 販売: 999 }],
  注記: `${決め打ち注記}。期待結果の「作り直されない」は、検知値の行（買取999円・販売999円）が同じ1件のまま残ることで確かめた`,
}));
caseTest("IT-M06-04-043", ステータスを変えて集計をDBで見る({
  固定: "600450043", 変更後: "買取成立", 日: "2026-08-24", 期待: [{ 店: "A", 部門: "カード", 買取: 850, 販売: 1300 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-044", ステータスを変えて集計をDBで見る({
  固定: "600460044", 変更後: "入庫済み", 日: "2026-08-25", 期待: [{ 店: "A", 部門: "カード", 買取: 850, 販売: 1350 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-052", ステータスを変えて集計をDBで見る({
  固定: "600520052", 変更後: "管理者取消", 日: "2026-07-14", 期待: [],
  注記: `${決め打ち注記}。期待結果の「0件」は、買取店舗A・Bの2026-07-14の買取集計データが0件であること`,
}));
caseTest("IT-M06-04-053", ステータスを変えて集計をDBで見る({
  固定: "600530053", 変更後: "管理者取消", 日: "2026-07-13", 期待: [{ 店: "A", 部門: "カード", 買取: 999, 販売: 999 }], 注記: 決め打ち注記,
}));
caseTest("IT-M06-04-065", ステータスを変えて集計をDBで見る({
  固定: (n) => n.get("〔店頭買取受注ID-M0604-065〕"), 変更後: "買取成立", 日: 今日の日(),
  期待: [{ 店: "A", 部門: "カード", 買取: 400, 販売: 650 }], ステータス: "買取成立", 日付: { 成立日: "当日" }, 注記: 当日の注記,
}));
caseTest("IT-M06-04-066", ステータスを変えて集計をDBで見る({
  固定: "8806601", 変更後: "買取キャンセル", 日: "2027-03-11", 期待: [{ 店: "A", 部門: "カード", 買取: 250, 販売: 400 }],
  ステータス: "買取キャンセル", 日付: { キャンセル日: "当日" }, 注記: 当日の注記,
}));
caseTest("IT-M06-04-067", ステータスを変えて集計をDBで見る({
  固定: "8806701", 変更後: "経理払い出し待ち", 日: "2027-03-12", 期待: [{ 店: "A", 部門: "カード", 買取: 350, 販売: 500 }], ステータス: "経理払い出し待ち",
}));
caseTest("IT-M06-04-069", ステータスを変えて集計をDBで見る({
  固定: "8806901", 変更後: "入庫済み", 日: "2027-03-14", 期待: [{ 店: "A", 部門: "カード", 買取: 850, 販売: 1350 }],
  ステータス: "入庫済み", 日付: { 入庫日: "当日" }, 注記: 当日の注記,
}));

/**
 * 正本: 1. 経理権限のメンバーで買取詳細を開く／2. 「経理払い出し済み」を押す／3. 確認のOK／4. DBで買取集計データ（と、買取のステータス）を確認する。
 * 051・072。
 */
function 経理払い出し済で集計をDBで見る(d: { 受注: (notes: Notes) => string; 日: string; 期待: 期待の行[]; ステータス?: string; 成立日時?: string; 注記?: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const 受注ID = d.受注(notes);
    const 前 = 読む(notes, d.日);
    await loginAdmin(page, M0604_ACCOUNT);
    const detail = new OtcOrderDetailPage(page);
    let ask: 経理払い出し済の確認 | undefined;
    let 後: 集計の行[] = [];
    let 状態: ReturnType<typeof 店頭買取の状態> | undefined;
    let 日付: ReturnType<typeof 買取の日付> | undefined;
    await step(1, async () => { expect(await detail.open(受注ID), "買取詳細の応答").toBeLessThan(400); });
    await step(2, async () => { ask = await detail.経理払い出し済を押す(); });
    await step(3, async () => {
      if (!ask!.ダイアログ) note("確認のダイアログが出なかった（押したまま送信された）");
      const r = await ask!.確認に答える(true);
      note(`確認のダイアログ「${ask!.ダイアログ?.message() ?? "なし"}」でOK。送信の応答 ${r?.status() ?? "なし"}・上部のメッセージ「${(await detail.上部のメッセージ()).join(" / ")}」`);
    });
    await step(4, async () => {
      後 = 読む(notes, d.日);
      状態 = 店頭買取の状態(受注ID);
      日付 = 買取の日付(受注ID);
    });
    await expected(async () => {
      expect.soft(後, `${d.日} の買取集計データ（買取店舗A・B。押す前は ${JSON.stringify(前)}）`).toEqual(並べ替え(行にする(notes, d.期待)));
      if (d.ステータス) expect.soft(状態!.ステータス, "押したあとのステータス").toBe(d.ステータス);
      if (d.成立日時) expect.soft(日付!.成立日時, "買取成立日（書き換わらない）").toBe(d.成立日時);
    });
    note(退避の注記);
    note(`押したあとのステータスは「${状態!.ステータス}」・買取成立日は ${日付!.成立日時 ?? "空"}`);
    if (d.注記) note(d.注記);
  };
}

caseTest("IT-M06-04-051", 経理払い出し済で集計をDBで見る({
  受注: () => 読み替えた買取("600510051").受注ID, 日: 今日の日(), 期待: [{ 店: "A", 部門: "カード", 買取: 900, 販売: 1400 }],
  注記: `${決め打ち注記}。当日は日本時間の実行当日（${今日の日()}）`,
}));
caseTest("IT-M06-04-072", 経理払い出し済で集計をDBで見る({
  受注: (n) => n.get("〔店頭買取受注ID-M0604-072〕"), 日: "2027-03-17", 期待: [{ 店: "A", 部門: "カード", 買取: 620, 販売: 1000 }],
  ステータス: "買取成立", 成立日時: "2027-03-17 10:00:00",
}));

// ======================================================================
// 046 買取履歴一覧の処理状態と買取金額合計（査定合計金額45678円）
// ======================================================================

caseTest("IT-M06-04-046", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔買取番号-M0604-QG001〕");
  const email = `${rc("qg0604-001")}@example.test`;
  const contextB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(contextB);
    const pageB = await contextB.newPage();
    pageB.setDefaultTimeout(60_000);
    const a = new PurchaseHistoryPage(page);
    const list = new OtcListPage(pageB);
    let 行2 = { 処理状態: "", 買取金額合計: "" };
    let 行5 = { 処理状態: "", 買取金額合計: "" };
    await step(1, async () => {
      await frontLogin(page, { メール: email, パスワード: QG_MEMBER_PASSWORD });
      await a.openList();
    });
    await step(2, async () => { 行2 = await a.一覧の行(no); });
    await step(3, async () => {
      await loginAdmin(pageB, QG_IT);
      await list.open();
      await list.日時を空にする();
      await list.買取店舗を選ぶ("");
      await list.査定IDを入れる(no);
      await list.検索する();
      await list.詳細を開く(no);
    });
    await step(4, async () => { await new OtcDetailPage(pageB).ステータスを変える("経理払い出し待ち"); });
    await step(5, async () => {
      await a.openList();
      行5 = await a.一覧の行(no);
    });
    await expected(async () => {
      expect.soft(行2.処理状態, "手順2の処理状態").toContain("受付完了");
      expect.soft(行2.買取金額合計.replace(/[^0-9]/g, ""), "手順2の買取金額合計（表示されない）").toBe("");
      expect.soft(行5.処理状態, "手順5の処理状態").toContain("振込待ち");
      expect.soft(行5.買取金額合計.replace(/[^0-9]/g, ""), `手順5の買取金額合計（表示は「${行5.買取金額合計}」）`).toBe("45678");
    });
    note("査定金額合計45678円は画面で指定できないので、シードがDBで買取の査定合計金額に入れた。会員はフロントの会員登録（本登録のメール）で作った（管理画面に会員の新規登録の画面が無い）");
  } finally {
    await contextB.close();
  }
});

// ======================================================================
// 054・055 買取集計データ画面の、部門別の集計（MTGバイヤーでの査定は、DBの個別入力商品に読み替え）
// ======================================================================

const 空の案内 = "集計データがありませんでした";
const MTG注記 = "MTGバイヤー（買取端末のアプリ）での査定は、シードがDBで個別入力商品・査定合計金額・ステータスを入れて置き換えた。東京店舗は買取店舗Aに読み替えた";

async function 集計を検索する(page: Page, 日: string, 部門名: string): Promise<void> {
  const s = new SummaryPage(page);
  await s.open();
  await s.集計日を入れる(日, 日);
  await s.部門を選ぶ(部門名);
  await s.買取店舗を選ぶ(STORE_A.店名);
  await s.検索する();
}

type 画面の集計 = {
  期間全体: { 部門コード: string; 部門: string; 買取金額: number; 販売金額: number }[];
  日別: { 集計日: string; 部門コード: string; 部門: string; 買取金額: number; 販売金額: number }[];
  期間全体の文: string;
  日別の文: string;
};
async function 集計を読む(page: Page): Promise<画面の集計> {
  const s = new SummaryPage(page);
  return { 期間全体: await s.期間全体の行(), 日別: await s.日別の行(), 期間全体の文: await s.期間全体の文(), 日別の文: await s.日別の文() };
}

/** 054: 買取成立にすると、部門の集計に買取金額が出る */
caseTest("IT-M06-04-054", async ({ page, step, expected }) => {
  const 部門名 = "RF0604-001部門";
  const 部門コード = "9060401";
  const 受注ID = 読み替えた買取("RF001").受注ID;
  let 当日 = "";
  let 前: 画面の集計 | undefined;
  let 後: 画面の集計 | undefined;
  await loginAdmin(page, M0604_RF);
  const detail = new OtcOrderDetailPage(page);
  const change = new OtcStatusChangePage(page);
  await step(1, async () => { 当日 = 今日の日(); note(`実行日の日付（日本時間）は ${当日}`); });
  await step(2, async () => { await new SummaryPage(page).open(); });
  await step(3, async () => { await 集計を検索する(page, 当日, 部門名); });
  await step(4, async () => { 前 = await 集計を読む(page); });
  await step(5, async () => { expect(await detail.open(受注ID), "買取詳細の応答").toBeLessThan(400); });
  await step(6, async () => { await detail.ステータス変更を押す(); });
  await step(7, async () => { await change.選ぶ("買取成立"); });
  await step(8, async () => { 保存の結果を残す(await change.保存を押す(), page.url()); });
  await step(9, async () => { await new SummaryPage(page).open(); });
  await step(10, async () => { await 集計を検索する(page, 当日, 部門名); });
  await step(11, async () => { 後 = await 集計を読む(page); });
  await expected(async () => {
    expect.soft(前!.期間全体.length, "手順4の期間全体の集計の行数").toBe(0);
    expect.soft(前!.期間全体の文, "手順4の期間全体の案内文").toContain(空の案内);
    expect.soft(前!.日別.length, "手順4の日別の集計の行数").toBe(0);
    expect.soft(前!.日別の文, "手順4の日別の案内文").toContain(空の案内);
    expect.soft(後!.期間全体.filter((r) => r.部門コード === 部門コード && r.部門 === 部門名).map((r) => r.買取金額), "手順11の期間全体の集計の、部門コード9060401の行の買取金額").toEqual([1000]);
    expect.soft(後!.日別.filter((r) => r.部門コード === 部門コード && r.部門 === 部門名).map((r) => r.買取金額), "手順11の日別の集計の、部門コード9060401の行の買取金額").toEqual([1000]);
  });
  note(MTG注記);
  note(`保存のあとのステータスは「${店頭買取の状態(受注ID).ステータス}」（アプリは買取成立の保存で続けて未登録在庫ありにする）`);
});

/** 055: 管理者取消にすると、部門の集計から消える */
caseTest("IT-M06-04-055", async ({ page, step, expected }) => {
  const 部門名 = "RF0604-002部門";
  const 部門コード = "9060402";
  const 受注ID = 読み替えた買取("RF002").受注ID;
  let 当日 = "";
  let 前: 画面の集計 | undefined;
  let 後: 画面の集計 | undefined;
  await loginAdmin(page, M0604_RF);
  const detail = new OtcOrderDetailPage(page);
  const change = new OtcStatusChangePage(page);
  await step(1, async () => { 当日 = 今日の日(); note(`実行日の日付（日本時間）は ${当日}`); });
  await step(2, async () => { await new SummaryPage(page).open(); });
  await step(3, async () => { await 集計を検索する(page, 当日, 部門名); });
  await step(4, async () => { 前 = await 集計を読む(page); });
  await step(5, async () => { expect(await detail.open(受注ID), "買取詳細の応答").toBeLessThan(400); });
  await step(6, async () => { await detail.ステータス変更を押す(); });
  await step(7, async () => { await change.選ぶ("管理者取消"); });
  await step(8, async () => { 保存の結果を残す(await change.保存を押す(), page.url()); });
  await step(9, async () => { await new SummaryPage(page).open(); });
  await step(10, async () => { await 集計を検索する(page, 当日, 部門名); });
  await step(11, async () => { 後 = await 集計を読む(page); });
  await expected(async () => {
    expect.soft(前!.期間全体.filter((r) => r.部門コード === 部門コード).map((r) => r.買取金額), "手順4の期間全体の集計の、部門コード9060402の行の買取金額").toEqual([1000]);
    expect.soft(前!.日別.filter((r) => r.部門コード === 部門コード).map((r) => r.買取金額), "手順4の日別の集計の、部門コード9060402の行の買取金額").toEqual([1000]);
    expect.soft(後!.期間全体.filter((r) => r.部門コード === 部門コード).length, "手順11の期間全体の集計の、部門コード9060402の行数").toBe(0);
    expect.soft(後!.期間全体の文, "手順11の期間全体の案内文").toContain(空の案内);
    expect.soft(後!.日別.filter((r) => r.部門コード === 部門コード).length, "手順11の日別の集計の、部門コード9060402の行数").toBe(0);
    expect.soft(後!.日別の文, "手順11の日別の案内文").toContain(空の案内);
  });
  note(MTG注記);
  note("手順1〜4の前の状態（買取成立）は、シードがステータス変更画面で「買取成立」にして作った（アプリの仕様で続けて未登録在庫ありになる）");
});
