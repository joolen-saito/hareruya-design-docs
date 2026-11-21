/**
 * A06-07・A06-10・A06-18（買取用カード一覧取得の API）のシードの組み立て（シードの登録はしない。各機能の seeds/a06-NN.ts が使う）。
 *
 * 1商品ずつ: 試験用のカードをカード詳細(登録)画面で登録する → グッズ商品CSV登録で1商品・1商品規格（言語 JP・状態 NM）を取り込む →
 * 商品登録編集の「カード指定」で試験用のカードのカード詳細を紐付ける → 本店・EC-CUBE へ入庫して別の管理者が承認する →
 * 画面で置けない商品画像の行だけ、E2E の商品に DB で足す（A02-01 と同じ部品。seeds/a02-builder.ts の作り）。
 *
 * 正本の外の補い（記録にも書く）:
 * - シード表の「カード商品CSV登録」は、グッズ商品CSV登録＋カード指定で代えた（A02 と同じ。カード商品CSV登録は基準価格からスマレジ連携を決め、
 *   外部のスマレジへ送ることがある）。グッズ商品CSV登録の取込は言語(ID)の列を持つが、課題 4023（セール価格CSVの言語ID）とは別の取込。
 * - 店舗A は、試験店舗の使い回し（2026-11-13 依頼者決定）で本店（店舗ID 1）に読み替えた。入庫の部品が本店・EC-CUBE へ入庫するため。
 *   管理者の所属店舗も本店にする（API はログインした管理者の所属店舗の EC 在庫を返す）。
 * - カードのマスタは、依頼者決定 2026-11-14「マスタは作ってよい」で試験用のカードを登録する（カード名に実行の印）。レアリティ・レイアウト・
 *   プロモ種別は選択肢の先頭、カードセットは A02 の試験用カードセットを使い回す。
 * - 商品コード・商品名には実行の印を付ける（流し直しで前の実行の商品とぶつからないように）。
 * - グッズ商品CSVのスマレジ連携・地域の列は 0 にする（A17-05 の取込と同じ。外部のスマレジへ送らない。正本は値を定めない）。2026-11-17 に足した。
 *   それまでの取込（A06-07・10・18 の9規格）は、DB でスマレジ連携フラグが無く、スマレジの商品IDも付いていないことを確かめた（送られていない）。
 * - 入庫の登録者・承認者は、決まった印の2人を1度だけ作って使い回す（pages/admin/a17_05_setup.ts の 決まった入庫の管理者）。
 * - 部門は、シード表の部門名に決まった印（-E2E）を付けて部門登録画面で1度だけ登録し、使い回す（試験部門を用意する）。
 *   部門の登録はアプリがスマレジへ連携する。開発環境の連携先はスマレジの試験環境（api.smaregi.dev。DB の呼び出しの記録で確かめた）で、
 *   スマレジ試験環境への書き込みは可（2026-11-10 依頼者決定）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 商品画像を足す } from "../db/a02_popup";
import { rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { カードを紐付ける, 試験用のカードを作る } from "../pages/admin/a02_setup";
import { 決まった入庫の管理者, 入庫して承認する, 取込の商品と規格を読む } from "../pages/admin/a17_05_setup";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { DepartmentPage } from "../pages/admin/m03_18_department";
import { 部門コードの部門の数, 商品をDBで廃止にする } from "../db/a06";
import { 部門を名前で探す } from "../db/m06_08_prep";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { ensureMemberFixed } from "../pages/admin/member";
import { 規格を書き換える } from "../pages/admin/a17_05_setup";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { 規格の価格を読む, 規格を廃止にする, 商品を廃止にする, 販売価格を入れ直す } from "../pages/admin/a06_product_read";
import { 店舗読み替えの注記, 本店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";

export type 買取の管理者 = Account & { 名前: string };
export const 買取の管理者の = (ログインID: string, パスワード: string, 名前: string): 買取の管理者 => ({
  loginId: rcFixed(ログインID).toLowerCase(), password: パスワード, 名前: rcFixed(名前),
});

/** 本店に所属する管理者を（無ければ）登録し、管理者IDを返す */
export async function 本店の管理者を用意する(browser: Browser, seedId: string, a: 買取の管理者, シード表の店名: string): Promise<{ 管理者ID: string; 店舗ID: string; 店名: string }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = (await 試験店舗の名前を読む(page)).本店;
    issue(店舗読み替えの注記(シード表の店名, 店名, 本店ID));
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: `${a.loginId}@example.test`, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, issue);
    issue("管理者は決まった印（-E2E。ログインIDは小文字）を付けて1度だけ作る。所属は選択肢の先頭、権限はシステム管理者（シード表の「登録済みの値」）");
    return { 管理者ID: id, 店舗ID: 本店ID, 店名 };
  });
}

export type カード商品の定め = {
  /** 正本の商品コード（実行の印を付けて使う） */
  商品コード: string;
  商品名日: string;
  商品名英: string;
  /** 試験用のカードの名前（無ければカードを紐付けない＝カード商品でない商品） */
  カード名日?: string;
  カード名英?: string;
  基準価格: string;
  販売価格: string;
  買取価格: string;
  /** 本店・EC-CUBE の在庫（0なら入庫しない） */
  在庫: number;
  /** 商品画像のファイル名（無ければ画像を付けない） */
  画像?: string;
  /** 商品規格の部門ID（グッズ商品CSVの部門IDの列。無ければ空） */
  部門ID?: string;
  /** 新しいカードを作らず、このシードが作った試験用のカードのカード詳細を紐付ける（試験用のカードを用意する の結果） */
  カード?: { カードID: string; カード詳細ID: string; カード名: string };
  /** 取込の商品規格の言語（既定は日本語） */
  言語?: "日本語" | "英語";
  /** 商品の公開状態を「廃止」にする（シード表は「削除済み」、刷新後の画面では公開状態「廃止」で表す。入庫のあと、商品登録編集画面で） */
  商品を廃止?: boolean;
  /** 商品規格の公開状態を「廃止」にする（シード表は「削除済み」、刷新後の画面では公開状態「廃止」で表す。入庫のあと、商品規格登録編集画面で） */
  規格を廃止?: boolean;
  /** 商品規格に入れる高額商品コード */
  高額商品コード?: string;
  /**
   * 商品名(日)・商品名(英)に実行の印を付けず、渡した値のまま使う（呼ぶ側が印を名前の途中に入れたとき。
   * 前方一致や記号の検索で、印を検索語の後ろに置けないため。A06-08 の 002・004・022・024）
   */
  名前はそのまま?: boolean;
};

/** 試験用のカード（カード名に実行の印）を1枚、詳細数件のカード詳細つきで登録する */
export async function 試験用のカードを用意する(browser: Browser, seedId: string, v: { カード名日: string; カード名英: string; 詳細数: number }): Promise<{ カードID: string; カード詳細IDs: string[]; カード名: string }> {
  return withAdminSession(browser, SETUP_ADMIN, (page) => 試験用のカードを作る(page, { カード名日: rc(v.カード名日), カード名英: rc(v.カード名英), 詳細数: v.詳細数 }, `${seedId}: 試験用のカード`, (m) => reportSeedIssue(seedId, m)));
}
export type 作ったカード商品 = { 商品ID: string; 規格ID: string; カードID: string | null; カード詳細ID: string | null; 商品コード: string };

/** 1商品を作る（カード・取込・カード指定・入庫・商品画像） */
export async function カード商品を作る(browser: Browser, seedId: string, d: カード商品の定め): Promise<作ったカード商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 商品コード = rc(d.商品コード);
  const 商品名日 = d.名前はそのまま ? d.商品名日 : rc(d.商品名日);
  const 商品名英 = d.名前はそのまま ? d.商品名英 : rc(d.商品名英);
  const out = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const made = !d.カード && d.カード名日 && d.カード名英
      ? await 試験用のカードを作る(page, { カード名日: rc(d.カード名日), カード名英: rc(d.カード名英), 詳細数: 1 }, `${seedId}: 試験用のカード`, issue) : null;
    const card = d.カード ? { カードID: d.カード.カードID, カード詳細IDs: [d.カード.カード詳細ID], カード名: d.カード.カード名 } : made;
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const 足す値: Record<string, string> = {};
    if (d.言語 === "英語") 足す値["言語(ID)"] = (await readLanguageIds(page)).英語;
    const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { "購入グループ名称": "通常商品", "原価単価": "0", ...zeros },
      lines: [{ code: 商品コード, nameJp: 商品名日, nameEn: 商品名英, values: { "基準価格": d.基準価格, "販売価格": d.販売価格, "買取価格": d.買取価格, ...(d.部門ID ? { "部門ID": d.部門ID } : {}), ...足す値 } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
    });
    const r = await 取込の商品と規格を読む(page, 商品コード, issue);
    if (card) await カードを紐付ける(page, r.商品ID, { 商品名日, 商品名英 }, { カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 }, issue);
    // 取込とカード指定のあと、販売価格が基準価格と同じ値になっていた（2026-11-17 A06-18: 取込の販売価格 3456 が 2345）。違う値のときは画面で入れ直す
    const 今 = await 規格の価格を読む(page, r.商品ID, r.規格ID);
    if (今.販売価格 !== d.販売価格) {
      await 販売価格を入れ直す(page, r.商品ID, r.規格ID, d.販売価格, `${seedId}: ${商品コード} の販売価格`, issue);
      issue(`取込とカード指定のあと販売価格が ${今.販売価格}（基準価格 ${今.基準価格}）になったので、商品規格登録編集画面でセールフラグを付けて ${d.販売価格} に入れ直した（販売価格はセールフラグが無いと基準価格と同じ値で保存される。シード表はセールフラグを定めていない）`);
    }
    if (d.高額商品コード) await 規格を書き換える(page, r.商品ID, r.規格ID, { 高額商品コード: d.高額商品コード }, `${seedId}: ${商品コード} の高額商品コード`, issue);
    return { 商品ID: r.商品ID, 規格ID: r.規格ID, カードID: card?.カードID ?? null, カード詳細ID: card?.カード詳細IDs[0] ?? null, 商品コード };
  });
  if (d.在庫 > 0) await 入庫して承認する(browser, seedId, [{ 商品コード, 数量: d.在庫 }], issue, 決まった入庫の管理者);
  // 廃止は入庫のあと（シード表の順。廃止の商品・規格は在庫検索一覧に出ず、入庫が止まるおそれがある）。どちらも読み戻して「廃止」を確かめる
  if (d.商品を廃止 || d.規格を廃止) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      if (d.規格を廃止) await 規格を廃止にする(page, out.商品ID, out.規格ID, `${seedId}: ${商品コード} の商品規格の廃止`, issue);
      if (d.商品を廃止) {
        try { await 商品を廃止にする(page, out.商品ID, `${seedId}: ${商品コード} の商品の廃止`, issue); }
        catch (e) {
          if (!String(e).includes("在庫がある商品規格は廃止にできません")) throw e;
          商品をDBで廃止にする(`${seedId}: ${商品コード} の商品の廃止（DB）`, out.商品ID);
          issue(`${商品コード} の商品の廃止: 在庫を入れたあとの商品は商品登録編集画面で「在庫がある商品規格は廃止にできません」となるため、E2E の商品の商品公開ステータスだけ DB で「廃止」にした（画面で作れない状態の書き足し）`);
        }
      }
    });
  }
  if (d.画像) 商品画像を足す(`${seedId}: 商品画像 ${d.画像}`, out.商品ID, d.画像, 1);
  const 状態の文 = [d.言語 === "英語" ? "言語 EN（取込の言語(ID)）" : "", d.商品を廃止 ? "入庫のあと、商品登録編集画面で商品公開ステータスを廃止にした（読み戻して確かめた）" : "", d.規格を廃止 ? "入庫のあと、商品規格登録編集画面で公開状態を廃止にした（読み戻して確かめた）" : "", d.高額商品コード ? `高額商品コード ${d.高額商品コード}（商品規格登録編集画面）` : "", d.カード ? `既に作った試験用のカードのカード詳細 ${d.カード.カード詳細ID} を紐付けた` : ""].filter(Boolean).join("・");
  if (状態の文) issue(`${商品コード}: ${状態の文}`);
  issue(`商品コード ${商品コード}・商品名「${商品名日}」（実行の印つき）。${d.カード名日 ? "カード商品CSV登録の代わりにグッズ商品CSV登録＋カード指定で作り" : "グッズ商品CSV登録で作り（カードは紐付けない）"}（言語 JP・状態 NM）、本店・EC-CUBE へ ${d.在庫} 入庫して承認した。${d.画像 ? `商品画像「${d.画像}」の行だけを DB に足した（実体は置かない）。` : ""}カードのレアリティ等は選択肢の先頭`);
  return out;
}

/**
 * シード表の部門名に決まった印（-E2E）を付けた部門を、無ければ部門登録画面で登録し、あれば使い回して、部門IDを返す。
 * 部門コードは 960000 から空いている番号を使う（ほかと重ならない数字。シード表は値を定めない）。免税区分は「対象外」。
 */
export async function 試験部門を用意する(browser: Browser, seedId: string, シード表の部門名: string): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 部門名 = rcFixed(シード表の部門名);
  const 有る = 部門を名前で探す(部門名)[0]?.部門ID;
  if (有る) { issue(`部門「${部門名}」（部門ID ${有る}）を使い回した（決まった印で1度だけ作ったもの）`); return 有る; }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    let code = 960000;
    while (部門コードの部門の数(String(code)) > 0) code++;
    const d = new DepartmentPage(page);
    await d.openNew();
    const id = await d.register({ 部門名, 部門コード: String(code), 免税区分: "対象外", MTGBuyer表示フラグ: false }, `${seedId}: 部門「${部門名}」の登録`);
    issue(`部門「${部門名}」（部門コード ${code}・免税区分 対象外）を部門登録画面で登録した（シード表の部門名に決まった印を付けて1度だけ。アプリがスマレジ試験環境へ連携する）`);
    return id;
  });
}
