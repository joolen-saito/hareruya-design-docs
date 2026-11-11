/**
 * F09-08 デッキ一括購入（フロント・デッキ検索）の画面シード。正本: cases/F09-08_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * - 購入対象のカード・商品・在庫（STOCK・CBSTOCK）: シード表の「状態・属性」の文（seeds/f09-08-data.ts が読む）のとおりに、
 *   1. カードセットを商品ごとに登録し、2. カードを詳細情報（カードセット・Foil）つきで登録し、
 *   3. 商品ごとにグッズ商品CSV登録で商品（最初の規格の言語・価格。状態ニアミントの規格が1件作られる）を取り込み、
 *   4. 商品登録編集で「カード指定 >」・商品名の入れ直し・カテゴリの付け替え（サプライ・グッズ → 単体カード）・割引率・公開状態を入れて登録し、
 *   5. 取り込みで作られた規格に商品コード・価格を入れて登録し、残りの規格を「新規作成」で1件ずつ登録し、
 *   6. 在庫のある規格を在庫編集（入庫/その他）で入れ、別の管理者が在庫編集承認一覧で承認し、7. 削除済みの規格を削除する。
 * - デッキ（DECK・DPDECK）: カード（詳細情報なし）を登録し、デッキ編集（新規登録）で大会デッキを登録する。所有者のいるデッキは、
 *   先にフロントの新規会員登録で会員を作り（プレイヤーは会員登録と同時に作られる）、プレイヤー検索で所有者を選ぶ。
 *
 * 作らないシード（それを使うケースは実装しない。spec の冒頭）:
 * - DECK-008・009（限定公開用の値を DB へ直接設定する）、STOCK-028（商品の削除済みを DB へ直接設定する）、
 *   STOCK-059（更新日時を DB へ直接設定する）、NOPLAYER-068・DPDECK-070（会員からプレイヤーを外すのを DB へ直接設定する）。
 *
 * 決め打ちの識別の値（カード名・カードセット名・商品名・商品コード・デッキ名・イベント名・会員のお名前(姓)・メールアドレス）には
 * 実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。カード名の「L/R」（分割カード）は左右それぞれに印を付ける。
 * メールアドレス（ログインID）は「f0908-003@example.test」→「f0908-003-<印>@example.test」。
 *
 * シード表が値を定めないもので、ここで決めたこと（各シードの報告にも出す）:
 * - カードセットの略称（任意の半角英数字）は「F8」＋シードの番号＋商品の順番＋実行の印。
 * - カードの詳細情報のレアリティ・レイアウト・プロモ種別は選択肢の先頭、フレームは「通常」（任意の選択肢）。
 * - 「新規作成」で足す規格の基準価格は販売価格と同じ値、買取価格は 10、部門は選択肢の先頭（任意の有効な値）。
 * - 単体カードのカテゴリは管理画面の最上位カテゴリ「シングルカード」配下の先頭、割引率は商品登録編集画面の割引率の選択肢の先頭（F05-04 と同じ）。
 * - 在庫の登録者・承認者は、このシード専用の本店のシステム管理者2人（実行の印つき）。在庫検索一覧は規格の商品コードで探す
 *   （シード表は商品名で探すとするが、同じ商品の行のうちどの規格の行かを決めるため）。承認はシードの規格をまとめて1回で行う。
 * - デッキのフォーマット・アーキタイプ（既存の選択肢から任意のもの）は、アーキタイプのあるフォーマットの先頭とそのアーキタイプの先頭。
 *   イベント開催日（任意の日時）は 2026/03/01 00:00。
 * - 会員のフリガナは「テスト」「タロウ」、生年月日・郵便番号・住所・電話番号は会員登録の部品の既定の値（任意の有効な値）。
 *   本登録のメールで本会員になった会員は、管理画面の会員ステータスの変更（本会員を選んで登録）はしない（すでに本会員のため）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl as adminUrlOf, withAdminSession } from "../lib/session";
import { 本店の店名, 会員を登録して待つ } from "../pages/admin/f04_setup";
import { 商品規格一覧を読む, 単体カード配下のカテゴリID, 登録済みの割引率ID } from "../pages/admin/f05_04_products";
import { カードセットを登録する, デッキIDで検索する, デッキを削除する } from "../pages/admin/f09_06_setup";
import { 規格を削除する } from "../pages/admin/f01_02_setup";
import {
  カードを指定して商品を登録する, プレイヤーを検索する, 取り込みの規格を登録する, 同じ名前のカードの数, 商品規格登録画面の選択肢,
  既存のフォーマットとアーキタイプ, 規格を新しく登録する, 言語マスタの名前, 詳細情報のカードセット,
} from "../pages/admin/f09_08_setup";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode, readGoodsRootCategoryId, readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { カードを登録する } from "../pages/admin/m14_card";
import { デッキ名で検索する, デッキ編集画面 } from "../pages/admin/m15_05_deck_edit";
import { ensureMember } from "../pages/admin/member";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { DeckBulkPage } from "../pages/front/f09_08_deck_bulk";
import { 在庫の計画, 言語 } from "./f09-08-data";

/** 全会員の共通パスワード（S-F09-08-COMMON） */
export const F0908の共通パスワード = "Passw0rd!F0908";

/** 文の中の「F0908-…」の名前（カード名・商品名など）に、実行の印を付ける。「L // R」「L/R」は左右それぞれ */
export const 印つき = (文: string): string => 文.replace(/F0908-[^\s/()]+/gu, (m) => rc(m));

/** 正本のメールアドレス（ログインID）を、実行の印つきの値にする */
export const 印つきのメール = (メール: string): string => {
  const [local, domain] = メール.split("@");
  return `${local}-${RUN_MARK}@${domain}`.toLowerCase();
};

const 管理画面 = <T>(browser: Browser, account: Account, fn: (page: Page) => Promise<T>) =>
  withAdminSession(browser, account, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

// ---------------------------------------------------------------------------
// 共通の値（1回の実行で1度だけ画面から読む・作る）
// ---------------------------------------------------------------------------

type 管理者 = { 名前: string; account: Account };
type 共通 = {
  本店: string; 言語ID: Record<言語, string>; その他言語の名前: string;
  グッズのカテゴリ: string; 単体カードのカテゴリ: { id: string; 名称: string }; 割引率: { id: string; 名称: string };
  登録者: 管理者; 承認者: 管理者;
};
let common: 共通 | null = null;

async function 共通の値(browser: Browser, seedId: string): Promise<共通> {
  if (common) return common;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 本店 = await 本店の店名(browser);
  const 管理者 = (役: string, 表示: string): 管理者 => ({ 名前: `F0908${表示}-${RUN_MARK}`, account: { loginId: `f0908${役}${RUN_MARK}`.toLowerCase(), password: F0908の共通パスワード } });
  const 登録者 = 管理者("reg", "在庫登録者"), 承認者 = 管理者("apr", "在庫承認者");
  const v = await 管理画面(browser, SETUP_ADMIN, async (page) => {
    for (const a of [登録者, 承認者]) {
      await ensureMember(page, {
        名前: a.名前, 所属店舗: 本店, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`,
        パスワード: a.account.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店],
      });
    }
    const lang = await readLanguageIds(page);
    if (lang.その他言語.label !== "中国語簡体字") throw new Error(`商品規格の言語の、日本語・英語の次の言語が「${lang.その他言語.label}」（シード表はその他言語に中国語簡体字を使う）`);
    return {
      言語ID: { 日本語: lang.日本語, 英語: lang.英語, その他言語: lang.その他言語.id } as Record<言語, string>,
      その他言語の名前: lang.その他言語.label,
      グッズのカテゴリ: await readGoodsRootCategoryId(page),
      単体カードのカテゴリ: await 単体カード配下のカテゴリID(page),
      割引率: await 登録済みの割引率ID(page),
    };
  });
  common = { 本店, 登録者, 承認者, ...v };
  issue(`単体カードのカテゴリは「シングルカード」配下の先頭「${common.単体カードのカテゴリ.名称}」（ID ${common.単体カードのカテゴリ.id}）、`
    + `割引率は「${common.割引率.名称}」（ID ${common.割引率.id}）、在庫の登録者・承認者は本店のシステム管理者「${登録者.名前}」「${承認者.名前}」を使った（シード表は値を定めない）`);
  return common;
}

// ---------------------------------------------------------------------------
// 前提（環境・共通設定）
// ---------------------------------------------------------------------------

defineSeed("S-F09-08-ENV", async ({ browser }) => {
  const seedId = "S-F09-08-ENV";
  await 管理画面(browser, SETUP_ADMIN, async (page) => {
    const names = await 言語マスタの名前(page);
    for (const n of ["日本語", "英語", "中国語簡体字"]) if (!names.includes(n)) throw new Error(`MTGマスターデータの言語の一覧に「${n}」の行が無い（${names.join("、")}）`);
    const form = await 商品規格登録画面の選択肢(page);
    for (const n of ["日本語", "英語", "中国語簡体字"]) if (!form.言語.includes(n)) throw new Error(`商品規格登録画面の言語の選択欄に「${n}」が無い（${form.言語.join("、")}）`);
    for (const c of ["NM", "SP", "MP", "HP"]) if (!form.状態のコード.includes(c)) throw new Error(`商品規格登録画面の状態の選択欄に ${c} が無い（${form.状態.join("、")}）`);
  });
  const context = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    const p = new DeckBulkPage(await context.newPage());
    await p.開く();
    const have = await p.選択肢(p.言語);
    for (const n of ["日本語のみ", "英語のみ", "日・英のみ", "指定しない（他言語を含む）"]) if (!have.includes(n)) throw new Error(`デッキ一括購入画面の言語の選択欄に「${n}」が無い（${have.join("、")}）`);
  } finally {
    await context.close();
  }
  reportSeedIssue(seedId, "新しく作るものは無い。MTGマスターデータの言語の一覧・商品規格登録画面の言語と状態の選択欄（登録は押さない）・デッキ一括購入画面の言語の選択欄を確かめた");
});

defineSeed("S-F09-08-COMMON", async () => {
  reportSeedIssue("S-F09-08-COMMON", `新しく作るものは無い。会員を作るシードが、会員登録のときにこの共通パスワードを入れる`);
});

// ---------------------------------------------------------------------------
// 購入対象のカード・商品・在庫
// ---------------------------------------------------------------------------

function defineStockSeed(seedId: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 番号 = /-(\d{3})$/.exec(seedId)![1];
    const plan = 在庫の計画(getSeed(seedId)["状態・属性"], seedId);
    const c = await 共通の値(browser, seedId);
    type 在庫 = { 商品コード: string; 数: number };
    const 在庫: 在庫[] = [];
    const 削除: { 商品ID: string; 規格ID: string; 呼び名: string }[] = [];
    let 順 = 0;
    await 管理画面(browser, SETUP_ADMIN, async (page) => {
      for (const card of plan) {
        // 1. カードセット
        const セットID = new Map<string, string>();
        for (const p of card.商品) {
          const id = await カードセットを登録する(page, { 名: rc(p.セット), 略称: `F8${番号}${++順}${RUN_MARK}`.toUpperCase(), リリース日: p.発売日, 特殊: false }, issue);
          セットID.set(p.セット, id);
          notes.set(p.セットの呼び名, id);
        }
        // 2. カード
        const 英 = 印つき(card.英語名), 日 = 印つき(card.日本語名);
        if ((await 同じ名前のカードの数(page, 英)) > 0) throw new Error(`${seedId}: カード一覧に、同じ名前のカード「${英}」がある`);
        const カードID = await カードを登録する(page, {
          カード名日: 日, カード名英: 英, 点数で見たマナ: "0",
          詳細: card.商品.map((p) => ({ カードセット: rc(p.セット), Foil: p.Foil ? "通常" : "なし" })),
        }, `${seedId}: カード「${英}」`, issue);
        notes.set(card.呼び名, カードID);
        const 詳細 = await 詳細情報のカードセット(page);
        // 3〜5. 商品と規格
        for (const p of card.商品) {
          if (p.公開 === "削除済み") throw new Error(`${seedId}: 商品「${p.名}」の削除済みは画面で作れない（シード表は DB へ直接設定する）`);
          const what = `${seedId}: 商品「${p.名}」`;
          const 詳細ID = 詳細.find((d) => d.カードセットID === セットID.get(p.セット))?.詳細ID;
          if (!詳細ID) throw new Error(`${what}: カード「${英}」の詳細情報に、カードセット「${rc(p.セット)}」のものが無い（${JSON.stringify(詳細)}）`);
          const コード = (i: number) => rc(`${p.名}-${i + 1}`);
          const first = p.規格[0];
          if (first.状態 !== "NM") throw new Error(`${what}: 最初の規格が NM でない（グッズ商品CSV登録は状態ニアミントの規格を作る）`);
          const 価格 = String(first.価格);
          await registerGoodsCsv(page, {
            what: `${what} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId: c.グッズのカテゴリ,
            lines: [{
              code: コード(0), nameJp: rc(p.名), nameEn: rc(p.名), productStatus: p.公開 === "非公開" ? "非公開" : "公開",
              values: {
                "言語(ID)": c.言語ID[first.言語], "基準価格": 価格, "販売価格": 価格, "買取価格": 価格, "原価単価": "10",
                "地域別販売制限": "0", "スマレジ連携フラグ": "0",
              },
            }],
            onWarning: (w) => issue(`${what}: グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
          });
          const ids = await productIdsByCode(page, コード(0));
          if (ids.length !== 1) throw new Error(`${what}: 商品コード ${コード(0)} の商品が ${ids.length} 件（1件のはず）`);
          const 商品ID = ids[0];
          notes.set(p.呼び名, 商品ID);
          await カードを指定して商品を登録する(page, {
            商品ID, カード名: 日, カード詳細ID: 詳細ID, 商品名: rc(p.名),
            外すカテゴリID: c.グッズのカテゴリ, 付けるカテゴリID: c.単体カードのカテゴリ.id, 割引率ID: c.割引率.id,
            公開状態: p.公開 === "非公開" ? "非公開" : "公開",
          }, what, issue);
          const rows = await 商品規格一覧を読む(page, 商品ID);
          if (rows.length !== 1) throw new Error(`${what}: 取り込みで作られた規格が ${rows.length} 件（1件のはず）: ${JSON.stringify(rows)}`);
          for (const [i, k] of p.規格.entries()) {
            const v = { 商品コード: コード(i), 販売価格: String(k.価格), 基準価格: i === 0 ? 価格 : String(k.価格), 買取価格: i === 0 ? 価格 : "10" };
            const 規格ID = i === 0
              ? await 取り込みの規格を登録する(page, 商品ID, rows[0].商品規格ID, v, `${what} の規格 ${k.言語}・${k.状態}`, issue)
              : await 規格を新しく登録する(page, 商品ID, { ...v, 言語: k.言語 === "その他言語" ? c.その他言語の名前 : k.言語, 状態: k.状態 }, `${what} の規格 ${k.言語}・${k.状態}`, issue);
            notes.set(k.呼び名, 規格ID);
            if (k.在庫 > 0) 在庫.push({ 商品コード: コード(i), 数: k.在庫 });
            if (k.削除済み) 削除.push({ 商品ID, 規格ID, 呼び名: k.呼び名 });
          }
        }
      }
    });
    // 6. 在庫（登録者が在庫編集で入れ、承認者がまとめて承認する）
    if (在庫.length) {
      const 登録者の名前 = await 管理画面(browser, c.登録者.account, async (page) => {
        for (const s of 在庫) {
          const stock = await searchStockByCode(page, { 商品コード: s.商品コード, 店舗: c.本店, 在庫区分: "EC-CUBE" });
          await stock.openEdit(stock.row(s.商品コード, c.本店, "EC-CUBE"));
          await registerStockEdit(page, {
            changeType: "入庫/その他", reason: "結合テストのデータ作成", quantity: String(s.数), purchasePrice: "0", approverName: c.承認者.名前,
          }, `${seedId}: ${s.商品コード} の在庫編集（${s.数}）`, issue);
        }
        return loggedInMemberName(page);
      });
      await 管理画面(browser, c.承認者.account, async (page) => {
        const list = new StockApprovalListPage(page);
        await list.open(c.本店);
        const ids = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === 登録者の名前).map((r) => r.id);
        if (ids.length < 在庫.length) throw new Error(`${seedId}: 在庫編集承認一覧に、登録者「${登録者の名前}」の未承認の行が ${ids.length} 件（${在庫.length} 件のはず）`);
        try {
          await list.approve(ids, `${seedId}: 在庫編集の承認`, issue);
        } catch (e) {
          if (!String(e).includes("成功メッセージ")) throw e;
          await list.open(c.本店);
          const remain = (await list.rowValues()).filter((r) => ids.includes(r.id) && r.status === "未承認");
          if (remain.length) throw e;
          issue(`${seedId}: 承認の成功の表示は出なかったが、承認一覧の該当の行は未承認でなくなった`);
        }
      });
      issue(`在庫は、在庫検索一覧を規格の商品コードで探して在庫編集で入れ（${在庫.map((s) => `${s.商品コード}=${s.数}`).join("、")}）、承認者がまとめて承認した`);
    }
    // 7. 削除済みの規格
    if (削除.length) {
      await 管理画面(browser, SETUP_ADMIN, async (page) => {
        for (const d of 削除) await 規格を削除する(page, d.商品ID, d.規格ID, `${seedId}: 規格 ${d.呼び名} の削除`, issue);
      });
    }
  });
}

defineStockSeed("S-F09-08-STOCK-012");
defineStockSeed("S-F09-08-STOCK-013");
defineStockSeed("S-F09-08-STOCK-014");
defineStockSeed("S-F09-08-STOCK-015");
defineStockSeed("S-F09-08-STOCK-016");
defineStockSeed("S-F09-08-STOCK-017");
defineStockSeed("S-F09-08-STOCK-018");
defineStockSeed("S-F09-08-STOCK-019");
defineStockSeed("S-F09-08-STOCK-020");
defineStockSeed("S-F09-08-STOCK-021");
defineStockSeed("S-F09-08-STOCK-022");
defineStockSeed("S-F09-08-STOCK-023");
defineStockSeed("S-F09-08-STOCK-024");
defineStockSeed("S-F09-08-STOCK-029");
defineStockSeed("S-F09-08-STOCK-030");
defineStockSeed("S-F09-08-STOCK-031");
defineStockSeed("S-F09-08-STOCK-032");
defineStockSeed("S-F09-08-STOCK-033");
defineStockSeed("S-F09-08-STOCK-034");
defineStockSeed("S-F09-08-STOCK-035");
defineStockSeed("S-F09-08-STOCK-036");
defineStockSeed("S-F09-08-STOCK-037");
defineStockSeed("S-F09-08-STOCK-038");
defineStockSeed("S-F09-08-STOCK-039");
defineStockSeed("S-F09-08-STOCK-040");
defineStockSeed("S-F09-08-STOCK-041");
defineStockSeed("S-F09-08-STOCK-042");
defineStockSeed("S-F09-08-STOCK-043");
defineStockSeed("S-F09-08-STOCK-044");
defineStockSeed("S-F09-08-STOCK-045");
defineStockSeed("S-F09-08-STOCK-048");
defineStockSeed("S-F09-08-STOCK-049");
defineStockSeed("S-F09-08-STOCK-050");
defineStockSeed("S-F09-08-STOCK-051");
defineStockSeed("S-F09-08-STOCK-052");
defineStockSeed("S-F09-08-STOCK-053");
defineStockSeed("S-F09-08-STOCK-055");
defineStockSeed("S-F09-08-STOCK-056");
defineStockSeed("S-F09-08-STOCK-057");
defineStockSeed("S-F09-08-STOCK-058");
defineStockSeed("S-F09-08-STOCK-060");
defineStockSeed("S-F09-08-STOCK-061");
defineStockSeed("S-F09-08-STOCK-065");
defineStockSeed("S-F09-08-STOCK-066");
defineStockSeed("S-F09-08-STOCK-067");
defineStockSeed("S-F09-08-CBSTOCK-072");
defineStockSeed("S-F09-08-CBSTOCK-073");
defineStockSeed("S-F09-08-CBSTOCK-074");
defineStockSeed("S-F09-08-CBSTOCK-075");
defineStockSeed("S-F09-08-CBSTOCK-076");
defineStockSeed("S-F09-08-CBSTOCK-077");
defineStockSeed("S-F09-08-CBSTOCK-078");
defineStockSeed("S-F09-08-CBSTOCK-079");
defineStockSeed("S-F09-08-CBSTOCK-080");
defineStockSeed("S-F09-08-CBSTOCK-081");
defineStockSeed("S-F09-08-CBSTOCK-082");
defineStockSeed("S-F09-08-CBSTOCK-083");
defineStockSeed("S-F09-08-CBSTOCK-084");
defineStockSeed("S-F09-08-CBSTOCK-085");
defineStockSeed("S-F09-08-CBSTOCK-086");
defineStockSeed("S-F09-08-CBSTOCK-087");
defineStockSeed("S-F09-08-CBSTOCK-088");
defineStockSeed("S-F09-08-CBSTOCK-089");
defineStockSeed("S-F09-08-CBSTOCK-090");
defineStockSeed("S-F09-08-CBSTOCK-091");
defineStockSeed("S-F09-08-CBSTOCK-092");
defineStockSeed("S-F09-08-CBSTOCK-093");
defineStockSeed("S-F09-08-CBSTOCK-094");
defineStockSeed("S-F09-08-CBSTOCK-095");

// ---------------------------------------------------------------------------
// デッキ（表示判定用）
// ---------------------------------------------------------------------------

type 会員の定め = { 名: "所有者" | "他者"; メール: string; 会員: string; プレイヤー: string };
type カードの定め = { 英: string; 日: string; 枚: number; 呼び名: string };
type デッキの定め = {
  番号: string; 表示: "公開" | "非公開"; リスト非公開: boolean;
  カード: カードの定め[];
  /** 所有者（先頭）と他者。省略は所有者なし */
  会員?: 会員の定め[];
};

const 一枚 = (n: string): カードの定め[] => [{ 英: `F0908-${n}-EN`, 日: `F0908-${n}-日本名`, 枚: 4, 呼び名: `〔カードID-F0908-${n}〕` }];
const 所有者 = (n: string, 記号 = ""): 会員の定め => ({ 名: "所有者", メール: `f0908-${n}@example.test`, 会員: `〔会員ID-F0908-${n}${記号}〕`, プレイヤー: `〔プレイヤーID-F0908-${n}${記号}〕` });
const 他者 = (n: string): 会員の定め => ({ 名: "他者", メール: `f0908-${n}-b@example.test`, 会員: `〔会員ID-F0908-${n}B〕`, プレイヤー: `〔プレイヤーID-F0908-${n}B〕` });

let 選択肢の控え: { フォーマット: string; アーキタイプ: string } | null = null;

async function 会員を作る(browser: Browser, seedId: string, 番号: string, m: 会員の定め, notes: Notes): Promise<void> {
  const メール = 印つきのメール(m.メール);
  await 会員を登録して待つ(browser, { 姓: rc(`F0908-${番号}`), 名: m.名, セイ: "テスト", メイ: "タロウ", メール, パスワード: F0908の共通パスワード });
  const id = await 管理画面(browser, SETUP_ADMIN, async (page) => { await searchCustomer(page, メール); return resultCustomerId(page, メール); });
  if (!id) throw new Error(`${seedId}: 管理画面の会員一覧に、メールアドレス ${メール} の会員が1件出ない`);
  notes.set(m.会員, id);
}

function defineDeckSeed(seedId: string, d: デッキの定め): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 姓 = rc(`F0908-${d.番号}`);
    for (const m of d.会員 ?? []) await 会員を作る(browser, seedId, d.番号, m, notes);
    if (d.会員?.length) issue("会員はフロントの新規会員登録で作り、本登録のメールで本会員にした（管理画面の会員ステータスはすでに本会員のため変えていない）");
    await 管理画面(browser, SETUP_ADMIN, async (page) => {
      for (const k of d.カード) {
        const 英 = 印つき(k.英);
        if ((await 同じ名前のカードの数(page, 英)) > 0) throw new Error(`${seedId}: カード一覧に、同じ名前のカード「${英}」がある`);
        notes.set(k.呼び名, await カードを登録する(page, { カード名日: 印つき(k.日), カード名英: 英, 点数で見たマナ: "0", 詳細: false }, `${seedId}: カード「${英}」`, issue));
      }
      選択肢の控え ??= await 既存のフォーマットとアーキタイプ(page);
      const 他 = (d.会員 ?? []).filter((m) => m.名 === "他者");
      for (const m of 他) {
        await page.goto(adminUrlOf("/deck/new"));
        await new デッキ編集画面(page).読み込みを待つ();
        notes.set(m.プレイヤー, await プレイヤーを検索する(page, 姓, `${姓} ${m.名}`, false));
      }
      const デッキ名 = rc(`F0908-${d.番号}-D`);
      await page.goto(adminUrlOf("/deck/new"));
      const e = new デッキ編集画面(page);
      await e.読み込みを待つ();
      await e.入力する({
        デッキ名, デッキ種別: "event", フォーマット: 選択肢の控え.フォーマット, アーキタイプ: 選択肢の控え.アーキタイプ, 公開状態: d.表示,
        デッキリスト非公開: d.リスト非公開,
        ...(d.表示 === "公開" ? { イベント名日: rc(`F0908-${d.番号}-D-大会`), イベント名英: rc(`F0908-${d.番号}-D-Event`), 開催日: "2026/03/01 00:00" } : {}),
        メイン: d.カード.map((k) => `${k.枚} ${印つき(k.英)}`).join("\n"),
      }, issue);
      const owner = (d.会員 ?? []).find((m) => m.名 === "所有者");
      if (owner) notes.set(owner.プレイヤー, await プレイヤーを検索する(page, 姓, `${姓} ${owner.名}`, true));
      await e.送信する(e.新規登録ボタン);
      for (const w of await e.警告()) issue(`デッキの登録時の警告「${w}」`);
      const 帯 = await e.エラーの帯();
      if (帯.length) throw new Error(`${seedId}: デッキ「${デッキ名}」を登録できない: ${帯.join(" / ")}`);
      const id = e.デッキID();
      const l = await デッキ名で検索する(page, デッキ名);
      const shown = await l.表示されたID();
      if (!shown.includes(id)) throw new Error(`${seedId}: デッキ一覧でデッキ名「${デッキ名}」を検索しても、登録したデッキ（ID ${id}）が出ない（${shown.join("、")}）`);
      notes.set(`〔デッキID-F0908-${d.番号}〕`, id);
      issue(`フォーマット「${選択肢の控え.フォーマット}」・アーキタイプ「${選択肢の控え.アーキタイプ}」を選んだ（既存の選択肢から任意のもの）`);
    });
  });
}


defineDeckSeed("S-F09-08-DECK-001", { 番号: "001", 表示: "公開", リスト非公開: false, カード: 一枚("001") });
defineDeckSeed("S-F09-08-DECK-003", { 番号: "003", 表示: "非公開", リスト非公開: false, カード: 一枚("003"), 会員: [所有者("003")] });
defineDeckSeed("S-F09-08-DECK-004", { 番号: "004", 表示: "公開", リスト非公開: true, カード: 一枚("004"), 会員: [所有者("004")] });
defineDeckSeed("S-F09-08-DECK-005", { 番号: "005", 表示: "非公開", リスト非公開: false, カード: 一枚("005"), 会員: [所有者("005", "A"), 他者("005")] });
defineDeckSeed("S-F09-08-DECK-006", { 番号: "006", 表示: "非公開", リスト非公開: false, カード: 一枚("006"), 会員: [所有者("006")] });
defineDeckSeed("S-F09-08-DECK-007", { 番号: "007", 表示: "公開", リスト非公開: true, カード: 一枚("007"), 会員: [所有者("007", "A"), 他者("007")] });
defineDeckSeed("S-F09-08-DECK-010", { 番号: "010", 表示: "公開", リスト非公開: false, カード: 一枚("010"), 会員: [所有者("010")] });
defineDeckSeed("S-F09-08-DECK-011", { 番号: "011", 表示: "公開", リスト非公開: false, カード: 一枚("011") });
defineDeckSeed("S-F09-08-DECK-025", { 番号: "025", 表示: "公開", リスト非公開: false, カード: 一枚("025") });
defineDeckSeed("S-F09-08-DECK-026", { 番号: "026", 表示: "公開", リスト非公開: false, カード: 一枚("026") });
defineDeckSeed("S-F09-08-DECK-027", { 番号: "027", 表示: "公開", リスト非公開: false, カード: 一枚("027") });
defineDeckSeed("S-F09-08-DPDECK-069", { 番号: "069", 表示: "公開", リスト非公開: true, カード: 一枚("069"), 会員: [所有者("069")] });
defineDeckSeed("S-F09-08-DPDECK-071", {
  番号: "071", 表示: "公開", リスト非公開: false,
  カード: (["A", "B", "C"] as const).map((x, i) => ({ 英: `F0908-071-EN-${x}`, 日: `F0908-071-JP-${x}`, 枚: [4, 3, 2][i], 呼び名: `〔カードID-F0908-071${x}〕` })),
});

// ---------------------------------------------------------------------------
// 存在しないデッキ
// ---------------------------------------------------------------------------

defineSeed("S-F09-08-NODECK-002", async ({ browser }) => {
  const seedId = "S-F09-08-NODECK-002";
  const id = "9080002";
  await 管理画面(browser, SETUP_ADMIN, async (page) => {
    if ((await デッキIDで検索する(page, id)).includes(id)) {
      reportSeedIssue(seedId, `デッキID ${id} のデッキがあったので、シード表どおりデッキの編集画面の「削除」で消した`);
      await デッキを削除する(page, id);
    }
    if ((await デッキIDで検索する(page, id)).includes(id)) throw new Error(`${seedId}: デッキID ${id} のデッキが残っている`);
  });
  reportSeedIssue(seedId, `デッキ一覧でデッキID ${id} を検索し、0件であることを確かめた`);
});
