/**
 * A06-03 店頭買取受注詳細更新（MTGBuyer の API の PUT /api/admin/otcBuyOrder/{受注ID}.json）のシード。正本: cases/A06-03_seed_data.tsv
 * 書いたケース: 005・007・008・026・027・029・031・041・043・057・065〜071。
 *
 * シードでの解釈（正本の外の補い）:
 * - 管理者（共有A・共有B）: A06-05 と同じ決まった印つきの管理者をメンバー登録画面で1度だけ作って使い回す（seeds/a06-05.ts）。
 *   有効なトークンは管理者のログイン API で受け取る。署名の鍵・送信元IPの許可は書き換えない。
 * - 店頭買取ステータスは固定のマスタ。DB へ投入せず、あることだけを確かめる。
 * - 部門: 決まった印の「A06-03試験部門」を部門登録画面で1度だけ登録して使い回す。
 * - 受注: 試験支店のフロントの店頭買取査定申込（会員登録なし）で作り、ステータスはステータス変更画面で変える（買取成立だけ DB）。
 *   担当者（共有B）・合計金額 0 は E2E の受注にだけ DB で書く。ステータス履歴は画面の変更で付いた件数が開始時の件数（正本の固定の履歴ID・日時は作らない。
 *   確かめは、送る前の件数との差で見る）。
 * - 商品・商品規格: グッズ商品CSV登録で作る（在庫は入れない）。商品規格ID・商品コードは控える。
 * - 043・057 の更新前の関連レコード（正本は注文詳細・個別入力商品・実在庫・実在庫履歴を固定のIDで置く）: 画面で作れない注文詳細・実在庫は置かず、
 *   個別入力商品1件だけ E2E の受注に DB で足し、送る前と後の全部の関連レコードを比べて「変わらない」を確かめる。
 */
import { SETUP_ADMIN } from "../config/env";
import { 査定IDの受注ID, 申込番号の査定ID } from "../db/a06";
import { 受注に書く, 受注の今 } from "../db/a06_05";
import { 未登録の個別入力商品を足す } from "../db/m06_03";
import { 受注がある } from "../db/a06_03";
import { 部門IDの部門の数, 部門コードの部門の数 } from "../db/a06";
import { 部門を名前で探す } from "../db/m06_08_prep";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { ensureMemberFixed } from "../pages/admin/member";
import { OtcStatusChangePage } from "../pages/admin/m06_04_status";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { A0605_ADM, A0605_OTHER, ステータス名 } from "./a06-05";
import { カード商品を作る } from "./a06-buying";
import { 申込を行う, 申込者の } from "./m06-common";
import { 店頭買取ステータスの名称 } from "../db/a06";

export const A0603_ADM = A0605_ADM;
const 部門名 = rcFixed("A06-03試験部門");

defineSeed("S-A06-03-STATUSES", async ({ seed }) => {
  const 違う = Object.entries(ステータス名).map(([id, 名]) => [id, 名, 店頭買取ステータスの名称(id)] as const).filter(([, 名, 今]) => 今 !== 名);
  if (違う.length) throw new Error(`${seed.シードID}: 店頭買取ステータスのマスタがシード表と違う（書き換えない）: ${違う.map(([id, 名, 今]) => `ID ${id} はシード表「${名}」・DB「${今 ?? "無い"}」`).join("／")}`);
  reportSeedIssue(seed.シードID, "店頭買取ステータスは画面で作れない固定のマスタ。DB へ投入せず、ある値をそのまま使った（あることを DB で確かめた）");
});

const 管理者のシード = (a: typeof A0605_ADM, 呼び名: string): SeedBuilder => async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).試験支店;
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("A06-03試験店舗", 店名, 試験支店ID));
    notes.set(呼び名, await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: a.メール, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, (m) => reportSeedIssue(seed.シードID, m)));
  });
  reportSeedIssue(seed.シードID, "管理者は決まった印つきの名前・ログインID（A06-05 と同じ管理者を使い回す）で1度だけメンバー登録画面から作った。所属・権限は任意の値（システム管理者）。署名の鍵・送信元IPの許可は書き換えない");
};
defineSeed("S-A06-03-ADM", 管理者のシード(A0605_ADM, "〔管理者ID-A0603-共有A〕"));
defineSeed("S-A06-03-OTHER-ADM", 管理者のシード(A0605_OTHER, "〔管理者ID-A0603-共有B〕"));

defineSeed("S-A06-03-SECTIONS", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    let 部門ID = 部門を名前で探す(部門名)[0]?.部門ID;
    if (!部門ID) {
      let code = 906030;
      while (部門コードの部門の数(String(code)) > 0) code++;
      const d = new DepartmentPage(page);
      await d.openNew();
      部門ID = await d.register({ 部門名, 部門コード: String(code), 免税区分: "対象外", MTGBuyer表示フラグ: true }, `${seed.シードID}: 部門の登録`);
      issue(`部門「${部門名}」（部門コード ${code}）を部門登録画面で登録した（決まった印で1度だけ。シード表の部門コード 9060301 が使われていることがあるので、空いている値にした）`);
    } else issue(`部門「${部門名}」（部門ID ${部門ID}）を使い回した`);
    notes.set("〔部門ID-A0603-共有〕", 部門ID);
    if (部門IDの部門の数(部門ID) !== 1) throw new Error(`${seed.シードID}: 部門ID ${部門ID} の部門が 1 件でない`);
  });
});

type 作り = { 状況: "6" | "1" | "2" | "8"; 個別を足す?: boolean };

/** 商品を作り、試験支店のフロントで申込んだ店頭買取の受注を、状況・担当者（共有B）・合計金額0にする */
function 受注のシード(seedId: string, 番号: string, 作り: 作り): void {
  defineSeed(seedId, { needs: ["S-A06-03-ADM", "S-A06-03-OTHER-ADM", "S-A06-03-SECTIONS"] }, async ({ browser, notes, seed }) => {
    const 姓 = rc(`A0603-${番号}`);
    const p = await カード商品を作る(browser, seed.シードID, { 商品コード: `A0603-${番号}`, 商品名日: `A0603試験商品${番号}`, 商品名英: `A0603 Test Product ${番号}`, 基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0 });
    // 商品ID・商品規格IDは、シード表が控えると定めるシードだけ控える（定めないシードで控えると「シード表に無い呼び名」で止まる）
    if ((seed["状態・属性"] + seed.投入方法).includes(`〔商品ID-A0603-${番号}〕`)) notes.set(`〔商品ID-A0603-${番号}〕`, p.商品ID);
    if ((seed["状態・属性"] + seed.投入方法).includes(`〔商品規格ID-A0603-${番号}〕`)) notes.set(`〔商品規格ID-A0603-${番号}〕`, p.規格ID);
    const [申込] = await 申込を行う(browser, 試験支店.支店URL, [申込者の(姓, `査定${番号}`, "ゼンテイ", "ジュチュウ")]);
    const 査定ID = 申込番号の査定ID(申込);
    const 受注ID = 査定IDの受注ID(査定ID);
    if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
    notes.set(`〔査定ID-A0603-${番号}〕`, 査定ID);
    // 受注ID はシード表が控えると定めるシードだけ控える（定めないシードで控えると「シード表に無い呼び名」で止まる。ケースは査定IDから引く）
    if ((seed["状態・属性"] + seed.投入方法).includes(`〔受注ID-A0603-${番号}〕`)) notes.set(`〔受注ID-A0603-${番号}〕`, 受注ID);
    // 部門は共有のシード(S-A06-03-SECTIONS)が作る。シード表がこのシードにも部門の控えを定めるときだけ、その部門IDを控える
    if ((seed["状態・属性"] + seed.投入方法).includes("〔部門ID-A0603-共有〕") && !notes.get("〔部門ID-A0603-共有〕")) {
      const 部門ID = 部門を名前で探す(部門名)[0]?.部門ID;
      if (!部門ID) throw new Error(`${seed.シードID}: 共有の部門「${部門名}」が無い`);
      notes.set("〔部門ID-A0603-共有〕", 部門ID);
    }
    if (作り.状況 !== "1") {
      await withAdminSession(browser, A0605_ADM, async (page) => {
        const s = new OtcStatusChangePage(page);
        const r0 = await s.open(受注ID);
        if (r0 >= 400) throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータス変更画面の応答 ${r0}`);
        await s.選ぶ(ステータス名[作り.状況]);
        const r = await s.保存を押す();
        if (!r.sent) throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータス変更の「保存」が送られない（${r.止めた理由}）`);
      });
    }
    受注に書く(受注ID, 姓, { 査定担当者ID: notes.get("〔管理者ID-A0603-共有B〕"), ステータスID: 作り.状況 === "1" ? "1" : undefined, 金額: 0 });
    if (作り.個別を足す) 未登録の個別入力商品を足す(受注ID, `旧個別入力商品${番号}`, 1, 200, 300);
    const 今 = 受注の今(受注ID);
    if (今?.ステータスID !== 作り.状況) throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータスが ${今?.ステータスID}（求めるのは ${作り.状況}）`);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 試験支店のフロントで申込んだ（査定ID ${査定ID}・受注ID ${受注ID}・申込者の姓に実行の印）。ステータスは${作り.状況 === "1" ? "DB で買取成立" : `ステータス変更画面で「${ステータス名[作り.状況]}」`}にし、担当者（共有B）・合計金額0を E2E の受注にだけ DB で書いた。正本の固定のステータス履歴ID・日時・注文詳細・実在庫は作らない（開始時のステータス履歴は申込と画面の変更で付いた件数。確かめは送る前の件数との差）。商品 ${p.商品コード}（商品規格ID ${p.規格ID}）はグッズ商品CSV登録で作った`);
  });
}
受注のシード("S-A06-03-CASE-005", "005", { 状況: "6" });
受注のシード("S-A06-03-CASE-007", "007", { 状況: "6" });
受注のシード("S-A06-03-CASE-008", "008", { 状況: "6" });
受注のシード("S-A06-03-CASE-026", "026", { 状況: "6" });
受注のシード("S-A06-03-CASE-027", "027", { 状況: "6" });
受注のシード("S-A06-03-CASE-031", "031", { 状況: "6" });
受注のシード("S-A06-03-CASE-041", "041", { 状況: "6" });
受注のシード("S-A06-03-CASE-043", "043", { 状況: "6", 個別を足す: true });
受注のシード("S-A06-03-MIXERR-057", "057", { 状況: "6", 個別を足す: true });
受注のシード("S-A06-03-CBSEIRITSU-065", "065", { 状況: "6" });
受注のシード("S-A06-03-CBSEIRITSUDUP-066", "066", { 状況: "1" });
受注のシード("S-A06-03-CBCANCELDUP-067", "067", { 状況: "2" });
受注のシード("S-A06-03-CBCANCELMIX-068", "068", { 状況: "6" });
受注のシード("S-A06-03-CBCANCELTXN-069", "069", { 状況: "6" });
受注のシード("S-A06-03-CBOTHERTXN-070", "070", { 状況: "6" });
受注のシード("S-A06-03-CBOTHERMIX-071", "071", { 状況: "8" });

/** 存在しない受注（699999029）: 0件であることを数えるだけ（あれば止める。消さない）。商品と規格だけ用意する */
defineSeed("S-A06-03-CASE-029", async ({ browser, notes, seed }) => {
  if (受注がある("699999029")) throw new Error(`${seed.シードID}: 受注ID 699999029 がある（不存在の前提を満たせない。消さない）`);
  const p = await カード商品を作る(browser, seed.シードID, { 商品コード: "A0603-029", 商品名日: "A0603試験商品029", 商品名英: "A0603 Test Product 029", 基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 0 });
  notes.set("〔商品ID-A0603-029〕", p.商品ID);
  notes.set("〔商品規格ID-A0603-029〕", p.規格ID);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 受注ID 699999029 が無いことを DB で数えて確かめた（あれば止める）。商品 ${p.商品コード}（商品規格ID ${p.規格ID}）を作った`);
});
