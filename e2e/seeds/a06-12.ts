/**
 * A06-12 固定価格部門取得（MTGBuyer の API）のシード。値はシード表（A06-12_seed_data.tsv）のとおり。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-A06-12-AUTH の署名の鍵・送信元IPの許可は、共有の開発環境では書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。
 *   試験店舗「A06-12試験店舗」は、試験店舗の使い回し（2026-11-13 依頼者決定）で試験支店に読み替えた。
 *   パスワード「ZxA0612c001」は11文字でメンバー登録の入力チェック（12文字以上）を通らない。シード表は DB へ直接設定すると定めるが、
 *   メンバーのパスワードを DB で書かず、末尾に「X」を足した12文字（ZxA0612c001X）で画面から登録した。
 * - S-A06-12-SETTING の固定価格試験部門は、決まった印（-E2E）を付けた名前で1度だけ部門登録画面から登録し、使い回す。
 *   部門ID 61299 は、あれば止める（消さない）。
 *   追加システム設定の固定価格商品部門ID（全員が使う1件だけの設定）は、書き換える前に今の値を控え、ケースの終わりに控えた値へ画面で戻す
 *   （lib/shared_restore.ts。戻ったかは DB の値で確かめる）。夜の回で1本だけで流す。
 *   2026-11-17（hareruya-design-docs-39 の指摘で直した）:
 *   - 流す前の値が決まった値「29」（lib/shared_option_marker.ts の 決まった設定値）であることを DB で確かめ、違えば書き換えずに止める
 *     （前の回が戻せずに試験部門のIDが残っていると、それを元の値として控えてしまうため）。戻す先も、控えた値でなく決まった値にする。
 *   - 書き換える前に印（.runs/shared_option_marker.json）を置き、起動の終わり（lib/teardown_shared_thresholds.ts）でも決まった値へ戻す
 *     （時間切れでブラウザが閉じ、ケースの finally の戻しが動かなくても戻るように。M04-33・34 の閾値と同じ形）。
 *   「 61299 」（前後の空白）・設定なしの状態は、画面で指定できず、全員が使う設定の行を DB で書き換えることになるので作らない（003・004 は書いていない）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 固定価格商品部門IDの設定, 部門IDの部門の数, 部門コードの部門の数 } from "../db/a06";
import { 部門を名前で探す } from "../db/m06_08_prep";
import { rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { 決まった設定値, 設定の印を置く } from "../lib/shared_option_marker";
import { Account, withAdminSession } from "../lib/session";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { AddSystemPage } from "../pages/admin/m10_16_add_system";
import { ensureMemberFixed } from "../pages/admin/member";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";

export const A0612_ADM: Account & { 名前: string } = { loginId: rcFixed("a0612_admin").toLowerCase(), password: "ZxA0612c001X", 名前: rcFixed("A06-12試験担当") };
const 部門名 = rcFixed("固定価格試験部門");

defineSeed("S-A06-12-AUTH", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).試験支店;
    issue(店舗読み替えの注記("A06-12試験店舗", 店名, 試験支店ID));
    notes.set("〔店舗ID-A0612-共有〕", 試験支店ID);
    notes.set("〔管理者ID-A0612-共有〕", await ensureMemberFixed(page, {
      名前: A0612_ADM.名前, 所属店舗: 店名, ログインID: A0612_ADM.loginId, メールアドレス: `${A0612_ADM.loginId}@example.test`, パスワード: A0612_ADM.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, issue));
  });
  issue("署名の鍵・送信元IPの許可は書き換えず、環境に設定済みの値を使う（IP 許可リストには触れない）。パスワードは11文字の「ZxA0612c001」が入力チェックを通らないので、DB で書かず、末尾に X を足した12文字で画面から登録した");
});

defineSeed("S-A06-12-SETTING", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  if (部門IDの部門の数("61299") !== 0) throw new Error(`${seed.シードID}: 部門ID 61299 がある（不存在の前提を満たせない。消さない）`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 固定価格試験部門（決まった印）を1度だけ登録して使い回す
    let 部門ID = 部門を名前で探す(部門名)[0]?.部門ID;
    if (!部門ID) {
      let code = 961200;
      while (部門コードの部門の数(String(code)) > 0) code++;
      const d = new DepartmentPage(page);
      await d.openNew();
      部門ID = await d.register({ 部門名, 部門コード: String(code), 免税区分: "対象外", MTGBuyer表示フラグ: false }, `${seed.シードID}: 固定価格試験部門の登録`);
      issue(`固定価格試験部門「${部門名}」（部門コード ${code}）を部門登録画面で登録した（決まった印で1度だけ）`);
    } else issue(`固定価格試験部門「${部門名}」（部門ID ${部門ID}）を使い回した`);
    notes.set("〔部門ID-A0612-共有〕", 部門ID);
    // 追加システム設定の固定価格商品部門ID（全員が使う設定）: 決まった値であることを確かめ、ケースの終わりに画面で決まった値へ戻す
    const 前 = 固定価格商品部門IDの設定();
    if (前 === null) throw new Error(`${seed.シードID}: 追加システム設定に固定価格商品部門IDの行が無い（画面からは足せない。書き換えない）`);
    const 決まった値 = 決まった設定値.固定価格商品部門ID;
    if (前.trim() !== 決まった値) throw new Error(`${seed.シードID}: 追加システム設定の固定価格商品部門IDが決まった値「${決まった値}」でなく「${前}」（前の回が戻せていない、またはほかの方が変えた。書き換えずに止める）`);
    const 入れる = async (値: string) => withAdminSession(browser, SETUP_ADMIN, async (p) => {
      const a = new AddSystemPage(p);
      await a.開く();
      await a.入れる("固定価格商品部門ID", 値);
      const r = await a.登録する();
      if (!r.送った) throw new Error(`追加システム設定の登録が送られない（${r.止めた項目.join(" / ")}）`);
    });
    registerRestore("追加システム設定の固定価格商品部門ID", { 前 }, async () => { await 入れる(決まった値); }, async () => (固定価格商品部門IDの設定() ?? "").trim() === 決まった値);
    設定の印を置く("固定価格商品部門ID");
    await 入れる(部門ID);
    const 今 = 固定価格商品部門IDの設定();
    if (今 !== 部門ID) throw new Error(`${seed.シードID}: 固定価格商品部門IDを ${部門ID} にしたが、DB の値が ${今}`);
    issue(`追加システム設定の固定価格商品部門IDを、決まった値「${前}」であることを確かめてから ${部門ID} に画面で変えた（ケースの終わりと起動の終わりに「${決まった値}」へ戻す）`);
  });
});
