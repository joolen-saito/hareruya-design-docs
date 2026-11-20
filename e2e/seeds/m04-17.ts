/**
 * M04-17 在庫履歴検索一覧の画面シード。正本: cases/M04-17_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（017・020・023・026・031・036・037・055・012・016）が使うシードだけ。
 * - S-M04-17-ADM: 試験管理者。デフォルト検索表示店舗は「本店」。
 *   「本店」は S-M04-17-MASTER が店舗登録画面で登録する店舗で、ADM の作り方には店舗の用意が書かれていない。
 *   試験店舗の使い回し（2026-11-13 依頼者決定。pages/admin/reuse_store.ts）で店舗は作らず、正本の「本店」は「試験支店」で読み替える
 *   （前に名前「本店」で探して使っていた店舗は M04-24 が作ったもので、片付ける一覧に入った）。
 *   S-M04-17-MASTER そのもの（A店舗・支店A・スマレジ実店舗・カテゴリ・カードセット・所属・メンバー）は作らない。
 * - 商品・在庫変動履歴のシード: グッズ商品CSV登録で商品を作り、在庫検索一覧から在庫編集で入庫を登録し、
 *   登録したメンバーとは別の、承認権限のあるメンバーが在庫編集承認一覧で承認する。
 *   登録は試験管理者、承認は試験用の承認者（正本は名前を定めていない。「M04-17試験承認者」として、あれば使い無ければメンバー管理で登録する）。
 *   グッズ商品CSV登録は、雛形のダウンロードで列を確かめ、本店を含む開店中の店舗ごとに在庫区分「EC-CUBE」「スマレジ」の在庫が作られる。
 * - 商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める（流し直すかは依頼者が決める）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember, MemberInput } from "../pages/admin/member";
import { StockHistoryPage } from "../pages/admin/m04_17_stock_history";
import {
  approveRows, changeClassPrices, expectNoProductCodes, GoodsLine, pendingApprovalRows, PendingRow,
  readSupplyGoodsCategoryId, registerStockIn, uploadGoodsLines,
} from "../pages/admin/m04_17_seed_ops";
import { 試験支店, 試験支店の店舗ID, 店名の読み替え } from "../pages/admin/reuse_store";
import { 履歴の値を書き足す } from "../db/m04_17_w";
import { 在庫変動履歴の登録日時を書き足す } from "../db/m04_17_x";

// 2026-11-13 試験店舗の使い回しで所属の店舗が試験支店に変わったので、前の試験管理者（M04-24 の「本店」の所属）とは別の決まった名前で作る
export const M0417_ADMIN: Account = { loginId: rcFixed("m0417_admin").toLowerCase(), password: "Passw0rd!M0417" };
const ADMIN_NAME = rcFixed("M04-17試験管理者");
const APPROVER: Account = { loginId: rcFixed("m0417_approver").toLowerCase(), password: "Passw0rd!M0417R" };
const APPROVER_NAME = rcFixed("M04-17試験承認者");
/** 正本の「本店」（店舗登録画面で登録する店舗）。試験店舗の使い回しで「試験支店」に読み替える */
export const 正本のMAIN_SHOP = "本店";
export const MAIN_SHOP: string = 試験支店.店名;
const STOCK_IN_REASON = "M0417試験入庫";

/** 本店に所属し、本店を編集でき、デフォルト検索表示店舗が本店のシステム管理者（在庫編集・在庫編集承認ができる） */
const mainShopMember = (名前: string, account: Account, メールアドレス: string): MemberInput => ({
  名前, 所属店舗: MAIN_SHOP, ログインID: account.loginId, メールアドレス, パスワード: account.password,
  権限: "システム管理者", デフォルト検索表示店舗: MAIN_SHOP, 編集可能店舗: [MAIN_SHOP],
});

defineSeed("S-M04-17-ADM", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    試験支店の店舗ID();
    issue(店名の読み替え(正本のMAIN_SHOP, MAIN_SHOP));
    await ensureMember(page, mainShopMember(ADMIN_NAME, M0417_ADMIN, `${M0417_ADMIN.loginId}@example.test`));
  });
  // ログインでき、在庫履歴検索一覧の店舗の初期値がデフォルト検索表示店舗の「本店」であること
  await withAdminSession(browser, M0417_ADMIN, async (page) => {
    const history = new StockHistoryPage(page);
    await history.open();
    expect(await history.selectedShops(), "試験管理者の在庫履歴検索一覧の店舗の初期値（デフォルト検索表示店舗）").toEqual([MAIN_SHOP]);
  });
});

/** 承認する管理者は、ワーカーの中で1回だけ用意する */
let approverReady = false;
async function ensureApprover(browser: Browser): Promise<void> {
  if (approverReady) return;
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMember(page, mainShopMember(APPROVER_NAME, APPROVER, `${APPROVER.loginId}@example.test`)));
  approverReady = true;
}

/** 在庫編集の1件。承認する が false の行は承認・却下をしない（入庫承認待ちのまま） */
/**
 * 商品コードに付ける実行ごとの印（案A。2026-10-28 依頼者決定）。固定の商品コードで作ると、前の実行の商品が残って「前の実行から残っている」で止まる
 * （共有の開発環境では、残った商品を消せない）。検索語（キーワード）の前方一致が前の実行の商品に当たらないよう「検索語＋印＋枝番」の形にする。
 * ケースは商品コードの書式・文字数・重複を確かめない。商品名は変えない（変えるのはコードが商品名を兼ねるものだけ）。
 */
export const mk = (検索語: string, 枝番 = ""): string => `${rc(検索語)}${枝番}`;

type StockIn = { 商品コード: string; 在庫変動理由?: string; 在庫増減数?: string; 承認する: boolean };

const goods = (商品コード: string, 商品名: string, 価格 = "100", 買取価格 = "10"): GoodsLine =>
  ({ 商品コード, 商品名, 基準価格: 価格, 販売価格: 価格, 買取価格 });
const approved = (商品コード: string, 在庫変動理由 = STOCK_IN_REASON): StockIn => ({ 商品コード, 在庫変動理由, 承認する: true });
const pending = (商品コード: string): StockIn => ({ 商品コード, 承認する: false });

/**
 * 正本の作り方の共通の形。
 * 1. 試験管理者で、商品コードの商品が残っていないことを確かめ、グッズ商品CSV登録で商品を作る。
 * 2. 在庫編集の登録を1件ずつ行い、そのたびに承認する管理者の在庫編集承認一覧（本店）で、未承認の行が1件増えたことを確かめて、その行を控える
 *    （一覧に商品コードの列が無いので、登録の前後の差で行を決める）。
 * 3. 承認する行だけを、承認する管理者がまとめて一括承認する。
 */
function defineHistorySeed(seedId: string, lines: GoodsLine[], entries: StockIn[],
  after?: (page: Page, issue: (m: string) => void) => Promise<void>): void {
  defineSeed(seedId, { needs: ["S-M04-17-ADM"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await ensureApprover(browser);
    await withAdminSession(browser, M0417_ADMIN, async (adm) => {
      await withAdminSession(browser, APPROVER, async (approver) => {
        await expectNoProductCodes(adm, lines.map((l) => l.商品コード), seedId);
        const categoryId = await readSupplyGoodsCategoryId(adm);
        await uploadGoodsLines(adm, {
          what: `${seedId} のグッズ商品CSV登録（${lines.length}行）`, fileName: `${seedId}-goods.csv`, categoryId, lines, onIssue: issue,
        });

        const known = new Set((await pendingApprovalRows(approver, MAIN_SHOP)).map((r) => r.id));
        const toApprove: string[] = [];
        for (const e of entries) {
          const quantity = e.在庫増減数 ?? "1";
          await registerStockIn(adm, {
            商品コード: e.商品コード, 店舗: MAIN_SHOP, 在庫変動理由: e.在庫変動理由 ?? STOCK_IN_REASON, 在庫増減数: quantity, 仕入単価: "100",
            承認する管理者: APPROVER_NAME, onIssue: issue,
          });
          const fresh = (await pendingApprovalRows(approver, MAIN_SHOP)).filter((r) => !known.has(r.id));
          const row = expectOneNewRow(fresh, `${seedId}: ${e.商品コード} の在庫編集`, quantity);
          known.add(row.id);
          if (e.承認する) toApprove.push(row.id);
        }
        if (toApprove.length) {
          await pendingApprovalRows(approver, MAIN_SHOP);
          await approveRows(approver, toApprove, `${seedId} の在庫編集の承認（${toApprove.length}件）`, issue);
        }
        if (after) await after(adm, issue);
      });
    });
  });
}

/** 在庫編集の登録で増えた未承認の行が1件で、登録者・店舗・在庫変動区分・増減数が登録したとおりであること */
function expectOneNewRow(fresh: PendingRow[], what: string, quantity: string): PendingRow {
  if (fresh.length !== 1) throw new Error(`${what}: 登録のあと、在庫編集承認一覧の未承認の行が ${fresh.length} 件増えた（1件のはず）`);
  const r = fresh[0];
  const qty = Number(r.quantity.replace(/[^\d-]/g, ""));
  if (r.registrant !== ADMIN_NAME || !r.shop.startsWith(MAIN_SHOP) || !r.changeType.endsWith("入庫/問屋仕入") || qty !== Number(quantity)) {
    throw new Error(`${what}: 増えた未承認の行が登録の内容と違う（承認状態「${r.status}」・店舗/在庫区分「${r.shop}」・増減数「${r.quantity}」・` +
      `在庫変動区分「${r.changeType}」・登録者「${r.registrant}」）`);
  }
  return r;
}

// ---- 1商品の形 ----

defineHistorySeed("S-M04-17-MODE-020", [goods(mk("STOCK-001-020"), mk("STOCK-001-020"))], [approved(mk("STOCK-001-020"))]);
defineHistorySeed("S-M04-17-BASE-023", [goods(mk("BASE-001-023"), mk("BASE-001-023"))], [approved(mk("BASE-001-023"))]);
defineHistorySeed("S-M04-17-PENDING-031", [goods(mk("PENDING-M0417-031"), mk("PENDING-M0417-031"))], [pending(mk("PENDING-M0417-031"))]);
defineHistorySeed("S-M04-17-BASE-037", [goods(mk("BASE-001-037"), mk("BASE-001-037"))], [approved(mk("BASE-001-037"))]);

// 承認のあと、商品規格登録編集画面で基準価格と販売価格を1200に変える（履歴作成時の販売価格は1000のまま残る）
defineHistorySeed("S-M04-17-BASE-026", [goods(mk("BASE-001-026"), mk("BASE-001-026"), "1000")], [approved(mk("BASE-001-026"))],
  (adm, issue) => changeClassPrices(adm, { 商品コード: mk("BASE-001-026"), 商品名: mk("BASE-001-026"), 価格: "1200", onIssue: issue }));

// ---- 複数の商品の形 ----

// 承認済み（N）と入庫承認待ち（P）。N だけを承認する
defineHistorySeed("S-M04-17-MIX-055",
  [goods(mk("MIX-M0417-055", "-N"), mk("MIX-M0417-055", "-N")), goods(mk("MIX-M0417-055", "-P"), mk("MIX-M0417-055", "-P"))],
  [approved(mk("MIX-M0417-055", "-N")), pending(mk("MIX-M0417-055", "-P"))]);

// 変更時販売価格 500・1000・2000・0（0 の商品は基準価格・販売価格・買取価格とも0）
defineHistorySeed("S-M04-17-RANGE-012", [
  goods(mk("RANGE-M0417-012", "-01"), "RANGE-01-012", "500"),
  goods(mk("RANGE-M0417-012", "-02"), "RANGE-02-012", "1000"),
  goods(mk("RANGE-M0417-012", "-03"), "RANGE-03-012", "2000"),
  goods(mk("RANGE-M0417-012", "-NULL"), "RANGE-NULL-012", "0", "0"),
], [mk("RANGE-M0417-012", "-01"), mk("RANGE-M0417-012", "-02"), mk("RANGE-M0417-012", "-03"), mk("RANGE-M0417-012", "-NULL")].map((c) => approved(c)));

// 在庫変動理由に「境界理由」を含むのは 01・02 だけ
defineHistorySeed("S-M04-17-RANGE-016", [
  goods(mk("RANGE-M0417-016", "-01"), "RANGE-01-016"),
  goods(mk("RANGE-M0417-016", "-02"), "RANGE-02-016"),
  goods(mk("RANGE-M0417-016", "-03"), "RANGE-03-016"),
  goods(mk("RANGE-M0417-016", "-NULL"), "RANGE-NULL-016"),
], [
  approved(mk("RANGE-M0417-016", "-01"), "境界理由 01"),
  approved(mk("RANGE-M0417-016", "-02"), "02 境界理由"),
  approved(mk("RANGE-M0417-016", "-03")),
  approved(mk("RANGE-M0417-016", "-NULL")),
]);

// 登録日時 2026/08/01 00:00・08/15 12:00・08/31 23:59・07/01 00:00（2026-11-14 追加）。登録日時は画面で指定できないので、
// 承認のあと、E2E が作ったこの商品の在庫変動履歴の登録日時だけを DB で書き換える（lib/db_write.ts。依頼者決定 2026-11-10）
const RANGE_009: [string, string, string][] = [["-01", "RANGE-01-009", "2026-08-01 00:00:00+09"], ["-02", "RANGE-02-009", "2026-08-15 12:00:00+09"],
  ["-03", "RANGE-03-009", "2026-08-31 23:59:00+09"], ["-NULL", "RANGE-NULL-009", "2026-07-01 00:00:00+09"]];
defineHistorySeed("S-M04-17-RANGE-009", RANGE_009.map(([s, name]) => goods(mk("RANGE-M0417-009", s), name)),
  RANGE_009.map(([s]) => approved(mk("RANGE-M0417-009", s))),
  async (_adm, issue) => {
    for (const [s, name, at] of RANGE_009) {
      const n = 在庫変動履歴の登録日時を書き足す("S-M04-17-RANGE-009", mk("RANGE-M0417-009", s), at);
      issue(`${name}: 在庫変動履歴（${n} 件）の登録日時を ${at.replace("+09", "")} に DB で書き換えた（E2E が作ったこの商品の在庫変動履歴だけ。画面で指定できない）`);
    }
  });

// ---- 2026-11-20 追加: 範囲・区分の検索のシード（RANGE-010・011・013・014・015・CATSEL-053）。商品・入庫・承認は画面で作り、画面で指定できない値だけ、
// 承認のあとに E2E が作ったこの商品の在庫変動履歴へ DB で書き足す（lib/db_write.ts。依頼者決定 2026-11-10）。入庫の数量は1（承認は画面）。 ----
const 四行 = (n: string): [string, string][] => [["-01", `RANGE-01-${n}`], ["-02", `RANGE-02-${n}`], ["-03", `RANGE-03-${n}`], ["-NULL", `RANGE-NULL-${n}`]];
function rangeSeed(n: string, 値: (i: number) => Parameters<typeof 履歴の値を書き足す>[2]): void {
  const rows = 四行(n);
  defineHistorySeed(`S-M04-17-RANGE-${n}`, rows.map(([s, name]) => goods(mk(`RANGE-M0417-${n}`, s), name)),
    rows.map(([s]) => approved(mk(`RANGE-M0417-${n}`, s))),
    async (_adm, issue) => {
      rows.forEach(([s, name], i) => {
        const v = 値(i);
        const c = 履歴の値を書き足す(`S-M04-17-RANGE-${n}: ${name}`, mk(`RANGE-M0417-${n}`, s), v);
        issue(`${name}: 在庫変動履歴（${c} 件）に ${JSON.stringify(v)} を DB で書き足した（E2E が作ったこの商品の履歴だけ。画面で指定できない）`);
      });
    });
}
rangeSeed("010", (i) => [{ 変更前在庫: 5, 変更後在庫: 10 }, { 変更前在庫: 10, 変更後在庫: 20 }, { 変更前在庫: 21, 変更後在庫: 40 }, { 変更前在庫: 0, 変更後在庫: 0 }][i]);
rangeSeed("011", (i) => ({ 在庫増減数: [5, 10, 19, 0][i] }));
rangeSeed("013", (i) => ({ 仕入単価: [200, 400, 800, null][i] }));
rangeSeed("014", (i) => ({ 承認日時: ["2026-08-02 00:00:00+09", "2026-08-16 00:00:00+09", "2026-09-01 00:00:00+09", null][i] }));
rangeSeed("015", (i) => ({ 最終更新日時: ["2026-08-03 00:00:00+09", "2026-08-17 00:00:00+09", "2026-09-02 00:00:00+09", null][i] }));

// 053: 3商品の履歴の在庫変動区分を 入庫/問屋仕入・入庫/発見・廃棄/廃棄(破損) にする（登録日時 2026/08/10 10:00）
{
  const kinds: [string, string][] = [["-A", "入庫/問屋仕入"], ["-B", "入庫/発見"], ["-C", "廃棄/廃棄(破損)"]];
  defineHistorySeed("S-M04-17-CATSEL-053", kinds.map(([s]) => goods(mk("CATSEL-M0417-053", s), mk("CATSEL-M0417-053", s))),
    kinds.map(([s]) => approved(mk("CATSEL-M0417-053", s))),
    async (_adm, issue) => {
      for (const [s, 区分] of kinds) {
        const c = 履歴の値を書き足す(`S-M04-17-CATSEL-053: ${s}`, mk("CATSEL-M0417-053", s), { 変動区分: 区分 });
        在庫変動履歴の登録日時を書き足す(`S-M04-17-CATSEL-053: ${s} の登録日時`, mk("CATSEL-M0417-053", s), "2026-08-10 10:00:00+09");
        issue(`${s}: 在庫変動履歴（${c} 件）の在庫変動区分を ${区分}、登録日時を 2026/08/10 10:00 に DB で書き足した（E2E が作ったこの商品の履歴だけ）`);
      }
    });
}
