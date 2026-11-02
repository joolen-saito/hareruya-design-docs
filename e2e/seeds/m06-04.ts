/**
 * M06-04 買取ステータス変更 の画面シード。正本: cases/M06-04_seed_data.tsv
 *
 * 作るシード（画面だけで準備できる 047 が使うもの）:
 * - S-M06-04-QG-STORE: 店舗「QG店頭買取店舗」（支店URL qgstore）。あれば内容を確かめて使う。
 * - S-M06-04-QG-IT: メンバー管理で登録する試験管理者（qg0604it）。正本の「ITチームの所属」は、手元の所属の選択肢に無いので、先頭の所属で補った。
 *   権限はシステム管理者。QG店頭買取店舗を所属店舗・デフォルト検索表示店舗・編集可能店舗にした。
 * - S-M06-04-QG-SUMMARY（共有の設定）: 部門「QG買取集計部門」を登録し（あれば使い）、追加システム設定の固定価格商品部門IDをその部門のIDにする。
 *   今の値を控え、ケースが終わるたびに控えた値へ戻す（restoreFixedPriceSection）。
 * - S-M06-04-QG-ORDER-047: 会員「QG0604-002-会員」。正本は管理画面の会員登録（新規）で作ると定めるが、この環境の管理画面に会員の新規登録の画面が無いので、
 *   フロントの会員登録で作り、本登録のメールのURLを開いて本会員にした（依頼者決定 2026-10-31）。そのあと、フロントの店頭買取査定申込（会員としてログイン）で申込み、
 *   マイページの買取履歴一覧の買取番号を控える。メールの前半には実行ごとの印を付ける。
 *
 * DBでの準備が要るシード・MTGバイヤー（買取端末のアプリ）での査定が要るシードは作らない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore } from "../pages/admin/m04_24_store";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { customerIdByEmail } from "../pages/admin/m06_04_member";
import { OtcListPage } from "../pages/admin/m06_otc_list";
import { readFixedPriceSection, setFixedPriceSection } from "../pages/admin/m06_04_settings";
import { registerFrontMember } from "../pages/front/member_entry";
import { applyAsMember, PurchaseHistoryPage } from "../pages/front/m06_otc_buy";
import { storeInput } from "./m06-common";

export const QG_IT: Account = { loginId: "qg0604it", password: "Passw0rd-Qg0604It" };
export const QG_STORE = storeInput("QG店頭買取店舗", "キュージーテントウカイトリテンポ", "QG Store", "qgstore", "QGS");
export const QG_MEMBER_PASSWORD = "Passw0rd-QgMember";
/** 会員のメールアドレス（正本の qg0604-002@example.test の前半に実行の印を付けた値） */
export const qgMemberEmail = () => `${rc("qg0604-002")}@example.test`;
const SUMMARY_NAME = "QG買取集計部門";

defineSeed("S-M06-04-QG-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-M0604-QG共有〕", await ensureStore(page, QG_STORE, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-M06-04-QG-IT", { needs: ["S-M06-04-QG-STORE"] }, async ({ browser, notes }) => {
  const id = notes.get("〔店舗ID-M0604-QG共有〕");
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, {
    名前: "QG0604 IT担当者", ログインID: QG_IT.loginId, メールアドレス: "qg0604it@example.test", パスワード: QG_IT.password,
    権限: "システム管理者", 所属店舗ID: id, デフォルト検索表示店舗ID: id, 編集可能店舗ID: [id],
  }));
});

/** 追加システム設定の固定価格商品部門IDの、シードを作る前の値（ケースが終わるたびに戻す） */
let before: string | undefined;

defineSeed("S-M06-04-QG-SUMMARY", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const dept = new DepartmentPage(page);
    await dept.openNew();
    const found = (await dept.allRows()).filter((r) => r.部門名 === SUMMARY_NAME);
    if (found.length > 1) throw new Error(`部門「${SUMMARY_NAME}」が${found.length}件ある。どれを使うか決められない`);
    const id = found.length === 1 ? found[0].ID : await dept.register({ 部門名: SUMMARY_NAME, 部門コード: "9060490", 免税区分: "対象外", MTGBuyer表示フラグ: true }, `部門「${SUMMARY_NAME}」の登録`);
    notes.set("〔部門ID-M0604-QG共有〕", id);
    before = await readFixedPriceSection(page);
    reportSeedIssue(seed.シードID, `追加システム設定の固定価格商品部門IDのいまの値は「${before}」。ケースが終わったら戻す`);
    reportSeedIssue(seed.シードID, `固定価格商品部門IDを ${id} にした: ${await setFixedPriceSection(page, id)}`);
  });
});

/** ケースが終わるたびに、固定価格商品部門IDを控えた値へ戻す（正本: このシードを使うケースが終わるたびに控えた値へ戻す） */
export async function restoreFixedPriceSection(browser: Browser): Promise<string[]> {
  const issues: string[] = [];
  if (before === undefined) return issues;
  const value = before;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (value === "") return;
    // 戻しの保存が受け付けられないことが1度あった（保存の応答が入力欄のままで、成功の表示が出なかった）。読み込み直して1度だけやり直す
    try {
      issues.push(`固定価格商品部門IDを元の値 ${value} へ戻した: ${await setFixedPriceSection(page, value)}`);
    } catch (e) {
      issues.push(`固定価格商品部門IDを元の値へ戻す保存が1度で通らなかった（${(e as Error).message.split("\n")[0]}）。やり直した`);
      await page.waitForTimeout(2000);
      issues.push(`やり直して戻した: ${await setFixedPriceSection(page, value)}`);
    }
  });
  before = undefined;
  return issues;
}

defineSeed("S-M06-04-QG-ORDER-047", { needs: ["S-M06-04-QG-STORE"] }, async ({ browser, notes }) => {
  const email = qgMemberEmail();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: "QG0604-002-会員", 名: "試験", セイ: "キュージー", メイ: "シケン", メール: email, パスワード: QG_MEMBER_PASSWORD });
    // 会員登録の本登録で会員ログインの状態になっていることがあるので、別のセッションで申込む
  } finally {
    await context.close();
  }
  const context2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context2);
    const page = await context2.newPage();
    page.setDefaultTimeout(60_000);
    await applyAsMember(page, QG_STORE.支店URL, { メール: email, パスワード: QG_MEMBER_PASSWORD }, { 姓: "QG0604-002-会員", 名: "試験", セイ: "キュージー", メイ: "シケン" });
    const history = new PurchaseHistoryPage(page);
    await history.openList();
    const no = await history.最新の買取番号();
    notes.set("〔買取番号-M0604-QG002〕", no);
    // 管理画面の一覧に同じ番号の買取があること（店舗は QG店頭買取店舗、ステータスは査定前）を確かめる
  } finally {
    await context2.close();
  }
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const customerId = await customerIdByEmail(page, email);
    if (!customerId) throw new Error(`会員 ${email} が会員一覧に出ない`);
    notes.set("〔会員ID-M0604-QG002〕", customerId);
    const list = new OtcListPage(page);
    await list.open();
    await list.日時を空にする();
    await list.買取店舗を選ぶ("");
    await list.査定IDを入れる(notes.get("〔買取番号-M0604-QG002〕"));
    await list.検索する();
    const rows = await list.行();
    if (rows.length !== 1 || rows[0].ステータス !== "査定前" || rows[0].買取店舗 !== QG_STORE.店名) {
      throw new Error(`QG0604-002-会員の買取が「査定前」の1件でない（${JSON.stringify(rows)}）`);
    }
  });
});
