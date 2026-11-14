/**
 * M04-02 在庫編集（所属のマスタを使うケース 007・008）の画面シード。正本: cases/M04-02_seed_data.tsv
 * 依頼者決定（2026-11-14）: 所属のマスタに行を足してよい。足す行は機能IDを付けた決まった名前で1度だけ作る
 * （「在庫管理部（M04-02）」「東京販売部（M04-02）」）。ほかの方の行は書き換えない。
 * 店舗「TC東京2F-007」「TC東京2F-008」は作らない（試験店舗の使い回し・依頼者決定 2026-11-13）。試験支店で読み替える。
 * 管理者（青木承認者-007 など）は、名前・ログインIDに実行の印を付けて作る（seeds/m04-02-x.ts の承認者の と同じ）。
 */
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 在庫IDの, 在庫数と総原価を整える } from "../db/m04_02_x";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { ensureNoApprovalAuthority, M0409_NO_APPROVAL_AUTHORITY } from "../pages/admin/m04_09_setup";
import { ensureDepartment, ensureMemberWithDepartment } from "../pages/admin/m04_13_setup";
import { 本店の店名DB } from "../pages/admin/reuse_store";
import { rc } from "../lib/run_marker";
import { TC東京2F, 店の読み替え, TC東京2FのID, 共通の商品ID, 商品コードの, 管理者 } from "./m04-02-x";

export const 所属 = { 在庫管理部: "在庫管理部（M04-02）", 東京販売部: "東京販売部（M04-02）" } as const;
export const 所属の実名 = (正本: string): string => {
  if (正本 === "在庫管理部") return 所属.在庫管理部;
  if (正本 === "東京販売部") return 所属.東京販売部;
  throw new Error(`正本の所属「${正本}」の読み替えが無い`);
};
export const 所属の注記 = (): string =>
  `正本の所属「在庫管理部」「東京販売部」は、所属のマスタに「${所属.在庫管理部}」「${所属.東京販売部}」として足した（依頼者決定 2026-11-14。決まった名前で1度だけ。並び順10・20は画面が保存順に振る値のまま）`;

const 管理者の = (名前: string, loginId: string): 管理者 => {
  const id = rc(loginId).toLowerCase();
  return { 名前: rc(名前), account: { loginId: id, password: "Passw0rd!M0402Ap" }, email: `${id}@example.test` };
};
export const 青木 = (n: string) => 管理者の(`青木承認者-${n}`, `m0402_aoki_${n}`);
export const 伊藤 = (n: string) => 管理者の(`伊藤承認者-${n}`, `m0402_ito_${n}`);
export const 宇野 = (n: string) => 管理者の(`宇野一般担当-${n}`, `m0402_uno_${n}`);
export const 大阪 = (n: string) => 管理者の(`大阪承認者-${n}`, `m0402_osaka_${n}`);

for (const n of ["007", "008"]) {
  const seedId = `S-M04-02-CASE-${n}`;
  defineSeed(seedId, { needs: ["S-M04-02-MASTER"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 呼び名あり = (l: string) => getSeed(seedId).状態・属性.includes(l);
    const code = 商品コードの(`M0402-A-${n}`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      issue(店の読み替え());
      issue(所属の注記());
      await ensureDepartment(page, 所属.在庫管理部);
      await ensureDepartment(page, 所属.東京販売部);
      await openClassList(page, 共通の商品ID());
      const 規格ID = await addClass(page, 共通の商品ID(), { 言語: "日本語", 状態: "ニアミント", 商品コード: code, 基準価格: "1000", 販売価格: "1000", 買取価格: "1" }, `${seedId}: ${code}`, issue);
      if (呼び名あり(`〔店舗ID-M0402-${n}〕`)) notes.set(`〔店舗ID-M0402-${n}〕`, TC東京2FのID());
      if (呼び名あり(`〔商品規格ID-M0402-${n}〕`)) notes.set(`〔商品規格ID-M0402-${n}〕`, 規格ID);
      const 在庫ID = 在庫IDの(code, TC東京2FのID());
      if (呼び名あり(`〔在庫ID-M0402-${n}〕`)) notes.set(`〔在庫ID-M0402-${n}〕`, 在庫ID);
      在庫数と総原価を整える(seedId, 在庫ID, 10, 10000);
      issue(`在庫数10・総原価10000は画面で指定できないので、E2E の規格の在庫（在庫ID ${在庫ID}）へ DB で書き足した（シード表の投入方法のとおり）`);
      const tc = TC東京2F.店名;
      const 登録 = (m: 管理者, 店名: string, 所属名: string, 権限: string) => ensureMemberWithDepartment(page, {
        名前: m.名前, 所属店舗: 店名, 所属: 所属名, ログインID: m.account.loginId, メールアドレス: m.email, パスワード: m.account.password,
        権限, デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
      });
      await 登録(青木(n), tc, 所属.在庫管理部, "システム管理者");
      await 登録(伊藤(n), tc, 所属.東京販売部, "システム管理者");
      if (n === "007") {
        await ensureNoApprovalAuthority(page);
        await 登録(宇野(n), tc, 所属.在庫管理部, M0409_NO_APPROVAL_AUTHORITY);
        await 登録(大阪(n), 本店の店名DB(), 所属.在庫管理部, "システム管理者");
        issue("「承認権限なし」の宇野一般担当は、E2E が作った承認権限なしの権限（M04-09 と同じ）で作った。大阪承認者は対象店舗以外＝本店所属で作った");
      }
    });
  });
}
