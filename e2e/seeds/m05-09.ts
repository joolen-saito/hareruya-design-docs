/**
 * M05-09 納品書印刷（日本語）の画面シード。正本: cases/M05-09_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。1つの作り方 作る() を、シードごとの定め（下の 定めの表）で動かす）:
 * 1. 会員: ケースごとに、フロントの新規会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印。会員とプレイヤーが同時に作られる）。
 *    受注情報検索を会員のメールアドレスで絞ると、そのケースの受注だけが出る（事前準備の「受注情報検索ではこの受注だけを表示できる」）。
 * 2. 商品: グッズ商品CSV登録で作り、本店・EC-CUBE に入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コード・商品名に実行の印を付ける（ケースの文の同じ値も印つきで読む）。
 * 3. 受注: 会員でフロントにログインし、商品をカートに入れて、出荷指示リストから除外されない配送方法・外部の決済へ移らない支払方法で注文する
 *    （pages/front/m05_front_order.ts の 会員が商品を注文する）。配送方法がゆうパックでなければ、受注情報編集でゆうパックにする。
 * 4. 受注情報編集: シード表が定める注文者・お届け先・配送方法・値引き・送料・手数料・明細の価格を画面で入れて「受注情報を登録」を押す。
 * 5. 出荷指示リスト（002・010・016）: M05-21 と同じく、範囲に入るのが自分の受注だけであることを DB の参照で確かめてから生成する。
 * 6. DB での書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。db/m05_09.ts）: 受注日時 2026-09-29 10:00:00（全シード）、
 *    出荷指示リストの生成で「出荷指示」に変わった対応状況を「注文受領」へ戻す、注文者・配送先の都道府県／国の未設定、明細の商品規格の紐付けを外す、
 *    プレイヤーのスマレジ会員ID、プレイヤーの会員からの切り離し。どれも画面で指定できない値で、試験会員の受注・プレイヤーだけに書く。
 *
 * シードでの解釈（記録にも書く）:
 * - 受注状態「注文受付」は、開発環境の対応状況の名前「注文受領」（ID 1）。都道府県「海外」は「日本国外」（ID 48）、国「日本」は「Japan」。
 * - 019 の注文者の都道府県「大阪府」: 会員は既定の住所（東京都）で登録し、受注情報編集で注文者の都道府県を大阪府にした（受注の状態は同じ）。
 * - 受注の作成で会員の住所・電話・氏名はシード表が値を定めないので、登録できる任意の値（会員登録の部品の既定）。
 * - S-M05-09-DELIVERY（配送方法・都道府県・国のマスタ）: マスタは全員が使うので書き換えず、使う値があることを DB の参照で確かめるだけ。
 * - S-M05-09-BASEINFO（本店の適格請求書発行事業者登録番号）: 全員が使う店舗基本設定。023 のケースの開始時に spec が書き換え、終わるたびに元の値へ戻す。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import {
  受注IDの, 受注の配送先ID, 受注の配送方法, 受注の対応状況を書き足す, 受注日時を書き足す, 注文者の都道府県を空にする, 配送先の項目を空にする,
  明細の商品規格を外す, 明細IDの, 会員のプレイヤーID, プレイヤーのスマレジIDを書き足す, プレイヤーを会員から外す, 配送方法, 都道府県がある, 国がある, 登録番号, 出荷指示リストがある,
} from "../db/m05_09";
import { 受注のスマレジ取引IDを書き足す, 配送方法を外す, 配送先を写して足す, 明細の配送先を変える } from "../db/m05_09";
import { 受注の店舗を書き足す, 受注の店舗, 受注から会員を外す, 配送先を受注から外す } from "../db/m05_10";
import { 受注の出荷指示リスト, 注文番号の範囲の受注 } from "../db/m05_21";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { ShortTagPage } from "../pages/admin/short_tag";
import { ShelfNumberPage } from "../pages/admin/m03_21_shelf_number";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { chooseByLabel, expectSaved } from "../pages/admin/common";
import { 棚番号の名前を書き換える } from "../db/m04_01_x";
import { 商品規格ID, 棚番号の名前がある, 言語コードのID, 商品規格の状態, 商品規格の状態を書き換える } from "../db/m04_33";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 出荷指示リストを生成する } from "../pages/admin/m05_20_standby";
import { OrderEditPage, OrderItemsEdit } from "../pages/admin/m05_11_order_edit";
import { 範囲で出荷指示リストを生成する } from "../pages/admin/m05_21_picking";
import { 住所の入力, 住所を入れる, 受注情報編集を開く, 商品名を変える, 配送方法を選ぶ } from "../pages/admin/m05_09_delivery_slips";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0509_ADMIN: Account = { loginId: rcFixed("m0509_admin").toLowerCase(), password: "Passw0rd!M0509" };
export const 受注日時 = "2026-09-29 10:00:00";
const PW = "Passw0rd!M0509C";

defineSeed("S-M05-09-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M05-09管理者"), account: M0509_ADMIN, メール: `${M0509_ADMIN.loginId}@example.test` });
  reportSeedIssue("S-M05-09-ADM", "権限は受注管理を操作できる「システム管理者」、所属店舗・既定の検索店舗は本店。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M05-09-DELIVERY", async () => {
  const miss: string[] = [];
  const want: [number, string, boolean][] = [[3, "ゆうパック", false], [7, "スムーズ店頭受取", false], [8, "EMS", true]];
  for (const [id, name, abroad] of want) {
    const d = 配送方法(id);
    if (!d || d.名前 !== name || d.国外 !== abroad) miss.push(`配送方法ID ${id}「${name}」（${abroad ? "海外配送" : "国内配送"}）`);
  }
  for (const p of ["東京都", "大阪府", "日本国外"]) if (!都道府県がある(p)) miss.push(`都道府県「${p}」`);
  for (const c of ["Japan", "United States", "Canada"]) if (!国がある(c)) miss.push(`国「${c}」`);
  if (miss.length) throw new Error(`開発環境のマスタに ${miss.join("・")} が無い（マスタは共有なので書き換えない）`);
  reportSeedIssue("S-M05-09-DELIVERY", "マスタは書き換えず、配送方法ID 3・7・8、都道府県（東京都・大阪府・日本国外＝海外）、国（Japan＝日本・United States・Canada）があることを DB の参照で確かめた");
});

defineSeed("S-M05-09-BASEINFO", async () => {
  reportSeedIssue("S-M05-09-BASEINFO", `本店の適格請求書発行事業者登録番号は全員が使う店舗基本設定。ケースの開始時に書き換え、終わるたびに元の値（${登録番号() || "空"}）へ戻す`);
});

// ---- ケース専用のシード ----

/**
 * カード（並び順のケース 030・035・037・039 と CB の 053・055・057・059）: カード詳細(登録)画面で印つきの試験用カードを1枚作り、
 * 商品登録編集の「カード指定」でその商品に紐づける（依頼者決定 2026-11-14「マスタは作ってよい」）。指定の無い値は2行とも同じ（選択肢の先頭・Foil なし）。
 */
export type カードの定め = { レアリティ?: string; Foil?: "なし" | "通常" | "特殊"; カード番号?: string; 英名?: string; 色順?: string;
  /** カードのカラー（M05-21 のピッキングリストの色数に使う。2026-11-23） */
  カラー?: string[];
  /** レアリティを持たないカード詳細（画面ではレアリティを外せないので、E2E のカード詳細の行だけ DB で外す。M05-21 の 041。2026-11-23）。
   * ここでは外さない。外したカードの商品は、カード検索の「決定」で検索が閉じず、フロントの商品詳細もシステムエラーになるので、呼ぶ側が注文のあとで外す */
  レアリティなし?: true };
/** 並び順のケースの規格の値（2026-11-16。依頼者決定 2026-11-14「マスタは作ってよい」で、棚番号・略称タグは印つきで作る） */
export type 規格の定め = {
  /** 言語コード（グッズ商品CSVの言語(ID)。JP・EN・KO） */
  言語?: string;
  /** 状態コード（グッズ商品CSVは NM の規格を作る。NM 以外は E2E の商品規格だけ DB で書き換える） */
  状態?: string;
  /** 棚番号（名前と並び順。同じ名前は1つを使い回す） */
  棚?: { 名前: string; 並び順: string };
  /** 略称タグ（名前と並び順・アルファベット順。同じ名前は1つを使い回す） */
  略称?: { 名前: string; 並び順: string; アルファベット?: boolean };
};
export type 明細の定め = { コード: string; 名前: string; 価格?: number; 数量?: number; カード?: カードの定め; 規格?: 規格の定め };
type 受注の定め = {
  明細: 明細の定め[];
  注文者?: 住所の入力; お届け先?: 住所の入力; 配送方法?: string;
  値引き?: string; 送料?: string; 手数料?: string;
  /** 会員を分ける（008 の A・B は別の会員） */
  別の会員?: boolean;
  /** DB で書き足すもの（画面で指定できない状態） */
  注文者の都道府県なし?: true; 配送先の都道府県なし?: true; 配送先の国なし?: true;
  商品規格なしの明細?: string; スマレジ会員ID?: string; プレイヤーなし?: true;
  /** 2026-11-23 追加（DB で書き足す。E2E の行だけ）: 支店の受注（受注と配送先の店舗を試験支店 1574 に）・スマレジの受注（取引IDの呼び名。印を付けて書く）・
   * 配送方法なし・ゲスト受注（会員を外す）・配送先なし（配送先を受注から外す） */
  支店?: true; スマレジ取引?: string; 配送方法なし?: true; 会員なし?: true; 配送先なし?: true;
  /** 2件目の配送先を足し、この商品コードの明細を移す（014・062。出荷登録画面が開けないので DB で書く） */
  配送先を分ける?: string;
};
type 定め = {
  受注: 受注の定め[];
  出荷指示リスト?: boolean;
  /** 注文のあとで商品名を変える（025） */
  商品名の変更?: { コード: string; 名前: string };
};

const P = (番号: string, n = 1, 価格 = 1000): 明細の定め[] => Array.from({ length: n }, (_, i) => {
  const s = n > 1 ? `-P${String(i + 1).padStart(2, "0")}` : "-P1";
  return { コード: `M0509-${番号}${s}`, 名前: `M0509-${番号}${s}`, 価格 };
});
const ゆうパック = "ゆうパック";
const G = (コード: string): 明細の定め => ({ コード, 名前: コード });
const C = (コード: string, カード: カードの定め, 規格?: 規格の定め, 他: Partial<明細の定め> = {}): 明細の定め => ({ コード, 名前: コード, カード, 規格, ...他 });

const 定めの表: Record<string, 定め> = {
  "STANDBY-002": { 受注: [{ 明細: P("002A") }, { 明細: P("002B") }], 出荷指示リスト: true },
  "CLASSIFICATION-003": { 受注: [{ 明細: P("003"), 注文者: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" }, お届け先: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" } }] },
  "CLASSIFICATION-004": { 受注: [{ 明細: P("004A") }, { 明細: P("004B"), 配送方法: "EMS" }] },
  "CUSTOMERS-007": { 受注: [{ 明細: P("007"), スマレジ会員ID: "SMR-50907-007" }] },
  "CUSTOMERS-008": { 受注: [{ 明細: P("008A"), スマレジ会員ID: "SMR-50907-008" }, { 明細: P("008B"), 別の会員: true, プレイヤーなし: true }] },
  "RELATIONS-010": { 受注: [{ 明細: P("010A") }, { 明細: P("010B"), 注文者の都道府県なし: true }], 出荷指示リスト: true },
  "NULL-ADDRESS-012": { 受注: [{ 明細: P("012"), 配送先の都道府県なし: true }] },
  "NULL-ADDRESS-013": { 受注: [{ 明細: P("013"), 配送先の国なし: true }] },
  "STANDBY-016": { 受注: [{ 明細: P("016") }], 出荷指示リスト: true },
  "ADDRESSES-018": { 受注: [{ 明細: P("018"), お届け先: { 国: "United States", 都道府県: "日本国外", 海外郵便番号: "12345" }, 注文者: { 国: "Canada", 都道府県: "日本国外", 海外郵便番号: "A1B2C3" } }] },
  "ADDRESSES-019": { 受注: [{ 明細: P("019"), お届け先: { 国: "Japan", 都道府県: "東京都" }, 注文者: { 国: "Japan", 都道府県: "大阪府" } }] },
  "SIGNATURE-020": { 受注: [{ 明細: P("020"), 配送方法: "スムーズ店頭受取" }] },
  "SIGNATURE-021": { 受注: [{ 明細: P("021") }] },
  "COMPANY-023": { 受注: [{ 明細: P("023") }] },
  "POINTS-024": { 受注: [{ 明細: P("024A"), 値引き: "250" }, { 明細: P("024B"), 値引き: "0" }] },
  "PRODUCT-SNAPSHOT-025": { 受注: [{ 明細: [{ コード: "M0509-025-P1", 名前: "受注時商品名" }] }], 商品名の変更: { コード: "M0509-025-P1", 名前: "変更後商品名" } },
  "PAGE30-026": { 受注: [{ 明細: P("026", 30) }] },
  "PAGE31-027": { 受注: [{ 明細: P("027", 31) }] },
  "TAX-028": { 受注: [{ 明細: P("028"), 送料: "0", 手数料: "100", 値引き: "0" }] },
  "ADDR-SHIPTO-041": { 受注: [{ 明細: P("041"), 注文者: { 住所1: "大阪市北区梅田4-5-6", 住所2: "M0509-041-タワー9F", 電話: ["06", "9876", "5432"], 姓: "佐藤", 名: "花子" }, お届け先: { 住所1: "渋谷区道玄坂1-2-3", 住所2: "M0509-041-ビル5F", 電話: ["03", "1234", "5678"], 姓: "山田", 名: "太郎" } }] },
  "ADDR-SENDER-042": { 受注: [{ 明細: P("042"), 注文者: { 住所1: "大阪市北区梅田4-5-6", 住所2: "M0509-042-タワー9F", 電話: ["06", "9876", "5432"], 姓: "佐藤", 名: "花子" }, お届け先: { 住所1: "渋谷区道玄坂1-2-3", 住所2: "M0509-042-ビル5F", 電話: ["03", "1234", "5678"], 姓: "山田", 名: "太郎" } }] },
  // 並び順（明細は期待する並びと逆の順に登録する。シード表「明細ID・商品IDが小さい方が後に並ぶ側」）
  "SORT-CARD-030": { 受注: [{ 明細: [G("M0509-030-GOODS"), C("M0509-030-CARD", {})] }] },
  "SORT-FOIL-035": { 受注: [{ 明細: [C("M0509-035-FOIL", { Foil: "通常" }), C("M0509-035-PLAIN", { Foil: "なし" })] }] },
  "SORT-RARITY-037": { 受注: [{ 明細: [C("M0509-037-C", { レアリティ: "コモン" }), C("M0509-037-M", { レアリティ: "神話レア" })] }] },
  "SORT-COLLNO-039": { 受注: [{ 明細: [C("M0509-039-N10", { カード番号: "010" }), C("M0509-039-N02", { カード番号: "002" })] }] },
  "CBSORTCARD-053": { 受注: [{ 明細: [G("M0509-CB053-GOODS"), C("M0509-CB053-CARD", {})] }] },
  "CBSORTFOIL-055": { 受注: [{ 明細: [C("M0509-CB055-FOIL", { Foil: "通常" }), C("M0509-CB055-PLAIN", { Foil: "なし" })] }] },
  "CBSORTRARITY-057": { 受注: [{ 明細: [C("M0509-CB057-C", { レアリティ: "コモン" }), C("M0509-CB057-M", { レアリティ: "神話レア" })] }] },
  "CBSORTCOLLNO-059": { 受注: [{ 明細: [C("M0509-CB059-N10", { カード番号: "010" }), C("M0509-CB059-N02", { カード番号: "002" })] }] },
  // 2026-11-16 追加（棚番号・言語・状態・略称タグ・色順・英語カード名・明細の価格と数量）
  "SORT-SHELF-HQ-031": { 受注: [{ 明細: [C("M0509-031-JP", {}, { 言語: "JP", 棚: { 名前: "M0509-031-B02", 並び順: "2" } }), C("M0509-031-EN", {}, { 言語: "EN", 棚: { 名前: "M0509-031-A01", 並び順: "1" } })] }] },
  "SORT-LANG-033": { 受注: [{ 明細: [C("M0509-033-KR", {}, { 言語: "KO" }), C("M0509-033-EN", {}, { 言語: "EN" }), C("M0509-033-JP", {}, { 言語: "JP" })] }] },
  "SORT-COND-034": { 受注: [{ 明細: [C("M0509-034-HP", {}, { 状態: "HP" }), C("M0509-034-NM", {}, { 状態: "NM" })] }] },
  "SORT-ABBR-036": { 受注: [{ 明細: [C("M0509-036-B", {}, { 略称: { 名前: "M0509-036-BBB", 並び順: "2" } }), C("M0509-036-A", {}, { 略称: { 名前: "M0509-036-AAA", 並び順: "1" } })] }] },
  "SORT-COLOR-038": { 受注: [{ 明細: [C("M0509-038-B", { 色順: "青" }), C("M0509-038-W", { 色順: "白" })] }] },
  "SORT-ALPHA-040": { 受注: [{ 明細: [C("M0509-040-ZULU", { 英名: "M0509-040 Zulu Card", カード番号: "002" }, { 略称: { 名前: "M0509-040-TAG", 並び順: "1", アルファベット: true } }), C("M0509-040-ALPHA", { 英名: "M0509-040 Alpha Card", カード番号: "010" }, { 略称: { 名前: "M0509-040-TAG", 並び順: "1", アルファベット: true } })] }] },
  "LINE-PRICE-043": { 受注: [{ 明細: [C("M0509-043-A", {}, undefined, { 価格: 1500 }), C("M0509-043-B", {}, undefined, { 価格: 2800 })] }] },
  "LINE-QTY-044": { 受注: [{ 明細: [C("M0509-044-A", {}, undefined, { 数量: 3 }), C("M0509-044-B", {}, undefined, { 数量: 2 })] }] },
  "CBSORTCOND-054": { 受注: [{ 明細: [C("M0509-CB054-HP", {}, { 状態: "HP" }), C("M0509-CB054-NM", {}, { 状態: "NM" })] }] },
  "CBSORTABBR-056": { 受注: [{ 明細: [C("M0509-CB056-B", {}, { 略称: { 名前: "M0509-CB056-BBB", 並び順: "2" } }), C("M0509-CB056-A", {}, { 略称: { 名前: "M0509-CB056-AAA", 並び順: "1" } })] }] },
  "CBSORTCOLOR-058": { 受注: [{ 明細: [C("M0509-CB058-B", { 色順: "青" }), C("M0509-CB058-W", { 色順: "白" })] }] },
  "CBSORTALPHA-060": { 受注: [{ 明細: [C("M0509-CB060-ZULU", { 英名: "M0509-CB060 Zulu Card", カード番号: "002" }, { 略称: { 名前: "M0509-CB060-TAG", 並び順: "1", アルファベット: true } }), C("M0509-CB060-ALPHA", { 英名: "M0509-CB060 Alpha Card", カード番号: "010" }, { 略称: { 名前: "M0509-CB060-TAG", 並び順: "1", アルファベット: true } })] }] },
  "CBBASE-046": { 受注: [{ 明細: [{ コード: "M0509-CB046-P1", 名前: "M0509-CB046-P1" }] }] },
  "CBLINE-047": { 受注: [{ 明細: [{ コード: "M0509-CB047-OK", 名前: "M0509-CB047-OK" }, { コード: "M0509-CB047-NG", 名前: "M0509-CB047-NG" }], 商品規格なしの明細: "M0509-CB047-NG" }] },
  // ---- 2026-11-23 追加（流せない一覧から外した 001・009・015・022・045・049・061・063）----
  "CHANNELS-001": { 受注: [{ 明細: P("001A") }, { 明細: P("001B"), 別の会員: true, 支店: true }, { 明細: P("001C"), スマレジ取引: "JP-SMAREGI-001-001" }] },
  "RELATIONS-009": { 受注: [{ 明細: P("009A") }, { 明細: P("009B"), 配送先なし: true }, { 明細: P("009C"), 配送方法なし: true }], 出荷指示リスト: true },
  "CHANNELS-015": { 受注: [{ 明細: P("015A") }, { 明細: P("015B"), 別の会員: true, 支店: true }, { 明細: P("015C"), スマレジ取引: "JP-SMAREGI-001-015" }] },
  "COMPANY-022": { 受注: [
    { 明細: P("022A", 1, 1000) },
    { 明細: P("022B", 1, 2500), 別の会員: true, 支店: true, 注文者: { 姓: "納品書試験", 名: "022B注文者", 都道府県: "大阪府", 住所1: "大阪市北区", 住所2: "M0509-022B-1" }, お届け先: { 姓: "納品書試験", 名: "022B届け先", 都道府県: "大阪府", 住所1: "大阪市北区", 住所2: "M0509-022B-2" } },
  ] },
  "COMPANY-BRANCH-045": { 受注: [{ 明細: P("045"), 支店: true }] },
  "CBGUEST-049": { 受注: [{ 明細: [{ コード: "M0509-CB049-OK", 名前: "M0509-CB049-OK" }, { コード: "M0509-CB049-NG", 名前: "M0509-CB049-NG" }], 商品規格なしの明細: "M0509-CB049-NG", 会員なし: true }] },
  "CBSHIP1-061": { 受注: [{ 明細: [{ コード: "M0509-CB061-P1", 名前: "M0509-CB061-P1", 数量: 2 }] }] },
  "MULTISHIP-014": { 受注: [{ 明細: [{ コード: "M0509-014-P1", 名前: "M0509-014-P1", 数量: 2 }, { コード: "M0509-014-P2", 名前: "M0509-014-P2", 数量: 3 }], 配送先を分ける: "M0509-014-P2" }] },
  "CBSHIPN-062": { 受注: [{ 明細: [{ コード: "M0509-CB062-P1", 名前: "M0509-CB062-P1", 数量: 2 }, { コード: "M0509-CB062-P2", 名前: "M0509-CB062-P2", 数量: 3 }], 配送先を分ける: "M0509-CB062-P2" }] },
  "CBGUESTOK-063": { 受注: [{ 明細: [{ コード: "M0509-CB063-OK", 名前: "M0509-CB063-OK" }], 会員なし: true }] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 会員メール: string[]; 受注ID: string[]; 注文番号: string[]; 出荷指示リストID: string; 商品名: Record<string, string> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}
/** ケースの会員（受注情報検索を絞るメールアドレス。008 は A の会員） */
export const 会員の前半 = (番号: string, i = 0) => `m0509-${番号}${i > 0 ? "-b" : ""}`;
export const 会員のメール = (番号: string, i = 0) => markedMail(会員の前半(番号, i));

/** 並びの属性（略称タグ・言語・棚番号・カード・状態）をそろえた商品を作って入庫し、明細のコード→商品ID を返す（M05-09・M05-10 で使う。2026-11-23 M05-09 の 作る から切り出した） */
/** 名前そのまま: 商品名に実行の印を付けない（M05-21 のピッキングリストは商品名の表記を確かめるので、呼ぶ側が印の入れ方を決める。2026-11-23） */
export async function 並びの商品を作る(browser: Browser, seedId: string, 明細の一覧: 明細の定め[], issue: (m: string) => void, opt: { 名前そのまま?: boolean } = {}): Promise<Map<string, string>> {
  const 商品名 = (x: 明細の定め) => (opt.名前そのまま ? x.名前 : rc(x.名前));
  // 2a. 略称タグ（グッズ商品CSVの略称タグ(ID)に入れるので、商品より先に作る。同じ名前は1つを使い回す。名前は印つき）
  const 略称タグID = new Map<string, string>();
  const 略称付き = 明細の一覧.filter((x) => x.規格?.略称);
  if (略称付き.length > 0) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const x of 略称付き) {
        const t = x.規格!.略称!;
        if (略称タグID.has(t.名前)) continue;
        const st = new ShortTagPage(page);
        await st.openNew();
        略称タグID.set(t.名前, await st.register({ 名称: rc(t.名前), 並び順: t.並び順, アルファベット順: t.アルファベット ?? false }, `${seedId}: 略称タグ「${rc(t.名前)}」の登録`));
      }
    });
    issue(`略称タグを印つきで登録した（${[...new Set(略称付き.map((x) => x.規格!.略称!))].map((t) => `${rc(t.名前)}: 並び順 ${t.並び順}${t.アルファベット ? "・アルファベット順" : ""}`).filter((v, i, a) => a.indexOf(v) === i).join("／")}。依頼者決定 2026-11-14「マスタは作ってよい」）。商品への付け方は、商品登録編集の略称タグの選択の代わりに、グッズ商品CSVの略称タグ(ID)で入れた`);
  }
  const made = await 商品を作って入庫する(browser, seedId, 明細の一覧.map((x) => {
    const CSVの値: Record<string, string> = {};
    if (x.規格?.言語) CSVの値["言語(ID)"] = 言語コードのID(x.規格.言語);
    if (x.規格?.略称) CSVの値["略称タグ(ID)"] = 略称タグID.get(x.規格.略称.名前)!;
    return { 商品コード: rc(x.コード), 商品名: 商品名(x), 価格: String(x.価格 ?? 1000), 入庫数: (x.数量 ?? 1) + 2, ...(Object.keys(CSVの値).length ? { CSVの値 } : {}) };
  }), issue);
  const 商品ID = new Map(made.map((m, i) => [明細の一覧[i].コード, m.productId]));
  if (明細の一覧.some((x) => x.規格?.言語)) issue(`商品規格の言語は、グッズ商品CSVの言語(ID)で入れた（${明細の一覧.filter((x) => x.規格?.言語).map((x) => `${rc(x.コード)}: ${x.規格!.言語}`).join("・")}）`);

  // 2c. 棚番号（入力チェックを通る名前で画面から登録し、E2E の棚番号の名前だけ DB で印つきの正本の名前に書き換える。M04-33 と同じ作り）→ 商品規格の編集で付ける
  const 棚付き = 明細の一覧.filter((x) => x.規格?.棚);
  if (棚付き.length > 0) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const 作った棚 = new Set<string>();
      for (const x of 棚付き) {
        const t = x.規格!.棚!;
        if (作った棚.has(t.名前)) continue;
        作った棚.add(t.名前);
        const shelf = new ShelfNumberPage(page);
        await shelf.openNew();
        let tmp = "";
        for (let i = 0; i < 40; i++) { const c = `Q-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`; if (!棚番号の名前がある(c)) { tmp = c; break; } }
        if (!tmp) throw new Error(`${seedId}: 使われていない棚番号の名前を選べない`);
        const shelfId = await shelf.register({ 名称: tmp, 並び順: t.並び順 }, `${seedId}: 棚番号「${tmp}」の登録`);
        棚番号の名前を書き換える(`${seedId}: 棚番号の名前を ${rc(t.名前)} にする（入力チェックを通らない名前）`, shelfId, tmp, rc(t.名前));
        issue(`棚番号「${rc(t.名前)}」（並び順 ${t.並び順}）は名前の入力チェックを通らないので、「${tmp}」で画面から登録し、その棚番号の名前だけ DB で書き換えた（依頼者決定 2026-11-14「マスタは作ってよい」）`);
      }
      for (const x of 棚付き) {
        const code = rc(x.コード);
        const ids = 商品規格ID(code);
        if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${code} の商品規格が ${ids.length} 件（1件のはず）`);
        const ce = new ClassEditPage(page);
        await ce.編集で開く(商品ID.get(x.コード)!, ids[0]);
        await chooseByLabel(page.locator("#admin_product_class_ShelfNumber"), rc(x.規格!.棚!.名前));
        if (!(await ce.部門.inputValue())) await ce.部門.selectOption({ index: 1 });
        await ce.登録を押す();
        await expectSaved(page, `${seedId}: 商品規格 ${code} の登録（棚番号）`);
      }
    });
  }

  // 2b. カード（並び順のケース）: 商品の登録の順に、印つきの試験用カードを作って紐づける
  const カード付き = 明細の一覧.filter((x) => x.カード);
  if (カード付き.length > 0) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const x of カード付き) {
        const 名 = rc(x.コード);
        const カードの値 = x.カード!;
        await カードを登録する(page, {
          カード名日: 名, カード名英: カードの値.英名 ? rc(カードの値.英名) : 名, 点数で見たマナ: "0", 色順: カードの値.色順, ...(カードの値.カラー ? { カラー: カードの値.カラー } : {}),
          詳細: { レアリティ: カードの値.レアリティ, Foil: カードの値.Foil ?? "なし", カード番号: カードの値.カード番号 },
        }, `${seedId}: ${名} のカードの登録`, issue);
        const ids = await カード詳細IDs(page);
        if (ids.length !== 1) throw new Error(`${seedId}: ${名} のカードのカード詳細が ${ids.length} 件（1件のはず）`);
        await assignCardOnProductEdit(page, { productId: 商品ID.get(x.コード)!, cardNameJp: 名, cardDetailId: ids[0], productNameJp: 商品名(x), productNameEn: 商品名(x) }, issue);
      }
    });
    issue(`カード詳細(登録)画面で、印つきの試験用カードを ${カード付き.length} 枚作り（${カード付き.map((x) => `${rc(x.コード)}: レアリティ ${x.カード!.レアリティ ?? "選択肢の先頭"}・Foil ${x.カード!.Foil ?? "なし"}${x.カード!.カード番号 ? `・カード番号 ${x.カード!.カード番号}` : ""}`).join("／")}）、商品登録編集の「カード指定」で紐づけた。シード表の「商品カテゴリを単体カードに付け替える」はしていない（納品書の並びはカード詳細の有無・Foil・レアリティ・カード番号で決まり、カテゴリは使わない。実ソース SortProductTrait）`);
  }

  // 2d. 状態（グッズ商品CSVは NM の規格を作り、商品規格の編集画面では状態を選べないので、E2E の商品規格だけ DB で書き換える。M04-33 と同じ作り）
  for (const x of 明細の一覧.filter((y) => y.規格?.状態 && y.規格.状態 !== "NM")) {
    const code = rc(x.コード);
    const ids = 商品規格ID(code);
    if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${code} の商品規格が ${ids.length} 件（1件のはず）`);
    商品規格の状態を書き換える(`${seedId}: 商品規格 ${ids[0]} の状態を ${x.規格!.状態} にする（画面で選べない）`, ids[0], x.規格!.状態!);
    if (商品規格の状態(ids[0]) !== x.規格!.状態) throw new Error(`${seedId}: 商品規格 ${ids[0]} の状態が ${商品規格の状態(ids[0])}（${x.規格!.状態} のはず）`);
    issue(`商品規格 ${ids[0]}（${code}）の状態を DB で ${x.規格!.状態} にした。シード表の「HP の規格を足して、取り込みでできた NM の規格を削除する」の代わりに、取り込みでできた NM の規格の状態を書き換えた（グッズ商品CSV登録は NM の規格を作り、商品規格の編集画面では状態を選べない。E2E の商品規格だけ。並びは規格の状態で決まり、規格の数は見ない）`);
  }

  return 商品ID;
}

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";

  // 1. 会員（受注ごとに「別の会員」でなければ同じ会員）
  const メール: string[] = [];
  const 会員の数 = d.受注.some((o) => o.別の会員) ? 2 : 1;
  for (let i = 0; i < 会員の数; i++) {
    await 本会員を作る(browser, { 姓: "納品書試験", 名: `${番号}${"ABC"[i]}`, セイ: "ノウヒンショシケン", メイ: "カイイン", 前半: 会員の前半(番号, i), パスワード: PW });
    メール.push(会員のメール(番号, i));
  }

  // 2. 商品
  const 明細の一覧 = d.受注.flatMap((o) => o.明細);
  if (/-CBSORT/.test(seedId)) issue("シード表の「支店の受注」は、本店の受注で読み替えた（試験会員は本店のフロントで注文する。納品書の並びで支店と本店が違うのは棚番だけで、このケースは棚番を使わない。実ソース SortProductTrait）");
  const 商品ID = await 並びの商品を作る(browser, seedId, 明細の一覧, issue);

  // 3. 受注（続けて注文する）
  const 注文番号: string[] = [];
  const 受注ID: string[] = [];
  const 持ち主: string[] = [];
  let 会員i = 0;
  for (const [i, o] of d.受注.entries()) {
    if (o.別の会員) 会員i = 1;
    const m = メール[会員i];
    const n = await 会員が商品を注文する(browser, { メール: m, パスワード: PW }, o.明細.map((x) => ({ 商品ID: 商品ID.get(x.コード)!, 数量: x.数量 ?? 1 })), `${seedId}: ${i + 1}件目の受注`);
    注文番号.push(n); 受注ID.push(受注IDの(n, m)); 持ち主.push(m);
  }

  // 4. 受注情報編集（配送方法がゆうパックでなければゆうパックにする。シード表の値を入れる）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [i, o] of d.受注.entries()) {
      const 今の配送 = 受注の配送方法(受注ID[i]);
      const 配送 = o.配送方法 ?? ゆうパック;
      const 変える = 今の配送.some((x) => x !== 配送) || o.注文者 || o.お届け先 || o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined;
      if (!変える) continue;
      await 受注情報編集を開く(page, 受注ID[i]);
      if (今の配送.some((x) => x !== 配送)) {
        await 配送方法を選ぶ(page, 配送);
        await page.waitForTimeout(1500);
        if (o.配送方法 === undefined) issue(`${注文番号[i]}: 注文で選ばれた配送方法（${今の配送.join("・")}）を、受注情報編集でゆうパックにした`);
      }
      if (o.注文者) await 住所を入れる(page, "注文者", o.注文者);
      if (o.お届け先) await 住所を入れる(page, "お届け先", o.お届け先);
      if (o.値引き !== undefined || o.送料 !== undefined || o.手数料 !== undefined) await new OrderItemsEdit(page).金額欄({ 値引き: o.値引き, 送料: o.送料, 手数料: o.手数料 });
      const warnings = await new OrderEditPage(page).受注情報を登録する((m) => issue(`${注文番号[i]}: 受注情報の登録の確認「${m}」`));
      for (const w of warnings) issue(`${注文番号[i]}: 受注情報の登録の警告「${w}」`);
      const now = 受注の配送方法(受注ID[i]);
      if (now.some((x) => x !== 配送)) throw new Error(`${seedId}: ${注文番号[i]} の配送方法が ${now.join("・")}（${配送} のはず）`);
    }
  });

  // 商品名を変える（025）
  if (d.商品名の変更) {
    const ch = d.商品名の変更;
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await 商品名を変える(page, 商品ID.get(ch.コード)!, rc(ch.名前), issue); });
  }

  // 5. 出荷指示リスト（範囲に入るのが自分の受注だけかを確かめてから生成する）
  let リスト = "";
  if (seedId.endsWith("-016") && 出荷指示リストがある("999999")) throw new Error(`${seedId}: 出荷指示リストID 999999 が登録されている（正本は未登録）`);
  if (d.出荷指示リスト) {
    const from = 注文番号[0], to = 注文番号[注文番号.length - 1];
    if (注文番号.length > 1 && Number(to) !== Number(from) + 注文番号.length - 1) {
      throw new Error(`${seedId}: 続けて注文した受注の注文番号 ${注文番号.join("・")} が連続していない（間にほかの方の注文が入った）。範囲で生成するとほかの方の受注を巻き込むので止める`);
    }
    const 範囲 = 注文番号の範囲の受注(from, to);
    const 自分 = new Set(注文番号);
    const 他 = 範囲.filter((r) => !自分.has(r.注文番号) || !持ち主.includes(r.メール));
    if (他.length > 0 || 範囲.length !== 注文番号.length) throw new Error(`${seedId}: 注文番号 ${from}〜${to} の範囲に自分の受注以外が入っている。生成すると巻き込むので止める`);
    await withAdminSession(browser, M0509_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      if (注文番号.length === 1) await 出荷指示リストを生成する(page, from, seedId);
      else await 範囲で出荷指示リストを生成する(page, from, to, seedId);
    });
    const per = 受注ID.map((id) => 受注の出荷指示リスト(id));
    if (per.some((x) => x.length !== 1) || new Set(per.map((x) => x[0])).size !== 1) throw new Error(`${seedId}: 生成した出荷指示リストに受注がそろって入っていない`);
    リスト = per[0][0];
  }

  // 6. DB での書き足し（E2E の行だけ）
  const 書いた: string[] = [];
  for (const [i, o] of d.受注.entries()) {
    受注日時を書き足す(seedId, [受注ID[i]], 持ち主[i], 受注日時);
    if (d.出荷指示リスト) 受注の対応状況を書き足す(seedId, [受注ID[i]], 持ち主[i], "注文受領");
    if (o.注文者の都道府県なし) { 注文者の都道府県を空にする(seedId, 受注ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の注文者の都道府県を未設定`); }
    if (o.配送先の都道府県なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "都道府県"); 書いた.push(`${注文番号[i]} の配送先の都道府県を未設定`); }
    if (o.配送先の国なし) { 配送先の項目を空にする(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i], "国"); 書いた.push(`${注文番号[i]} の配送先の国を未設定`); }
    if (o.商品規格なしの明細) {
      const ids = 明細IDの(受注ID[i], rc(o.商品規格なしの明細));
      if (ids.length !== 1) throw new Error(`${seedId}: ${rc(o.商品規格なしの明細)} の明細が ${ids.length} 件（1件のはず）`);
      明細の商品規格を外す(seedId, ids, 持ち主[i]); 書いた.push(`${o.商品規格なしの明細} の明細の商品規格の紐付けを外した`);
    }
    if (o.支店) {
      受注の店舗を書き足す(seedId, 受注ID[i], 受注の配送先ID(受注ID[i]), 持ち主[i], 1574);
      const now = 受注の店舗(受注ID[i]);
      if (now.受注 !== "1574" || now.配送先.some((x) => x !== "1574")) throw new Error(`${seedId}: ${注文番号[i]} の店舗が試験支店（1574）になっていない（受注 ${now.受注}・配送先 ${now.配送先.join("・")}）`);
      書いた.push(`${注文番号[i]} の受注と配送先の店舗を試験支店（1574）にした（シード表の「支店の受注」の読み替え。試験会員は本店のフロントで注文する）`);
    }
    if (o.スマレジ取引) {
      受注のスマレジ取引IDを書き足す(seedId, 受注ID[i], 持ち主[i], rc(o.スマレジ取引));
      書いた.push(`${注文番号[i]} をスマレジの受注（${o.スマレジ取引}）として、スマレジ取引IDに印つきの「${rc(o.スマレジ取引)}」を書いた（スマレジの取引通知で作られる受注は画面で作れない。注文番号は画面が振った ${注文番号[i]} のまま。注文番号の欄は11文字までで「${o.スマレジ取引}」は入らない）`);
    }
    if (o.配送先を分ける) {
      const 元 = 受注の配送先ID(受注ID[i]);
      if (元.length !== 1) throw new Error(`${seedId}: ${注文番号[i]} の配送先が ${元.length} 件（1件のはず）`);
      const 足した = 配送先を写して足す(seedId, 受注ID[i], 元[0], 持ち主[i], { name02: `${番号}B届け先`, addr02: `M0509-${番号}-2件目の配送先` });
      const ids = 明細IDの(受注ID[i], rc(o.配送先を分ける));
      if (ids.length !== 1) throw new Error(`${seedId}: ${rc(o.配送先を分ける)} の明細が ${ids.length} 件（1件のはず）`);
      明細の配送先を変える(seedId, ids, 持ち主[i], 足した);
      書いた.push(`${注文番号[i]} に2件目の配送先（${足した}。1件目の配送先を写し、名・番地を変えた）を足し、${o.配送先を分ける} の明細をそこへ移した（出荷登録画面がシステムエラーで開けないため）`);
    }
    if (o.配送方法なし) { 配送方法を外す(seedId, 受注の配送先ID(受注ID[i]), 持ち主[i]); 書いた.push(`${注文番号[i]} の配送先の配送方法を未設定`); }
    if (o.スマレジ会員ID || o.プレイヤーなし) {
      const ps = 会員のプレイヤーID(持ち主[i]);
      if (ps.length !== 1) throw new Error(`${seedId}: 会員 ${持ち主[i]} のプレイヤーが ${ps.length} 件（1件のはず）`);
      if (o.スマレジ会員ID) { プレイヤーのスマレジIDを書き足す(seedId, ps, 持ち主[i], o.スマレジ会員ID); 書いた.push(`会員のプレイヤーのスマレジ会員IDを ${o.スマレジ会員ID}`); }
      if (o.プレイヤーなし) { プレイヤーを会員から外す(seedId, ps, 持ち主[i]); 書いた.push(`${注文番号[i]} の会員からプレイヤーを外した`); }
    }
  }
  // 持ち主（試験会員のメールアドレス）を確かめられなくなる書き足し（配送先を外す・会員を外す）は最後
  const 配送先ID: string[][] = 受注ID.map((id) => 受注の配送先ID(id));
  for (const [i, o] of d.受注.entries()) {
    if (o.配送先なし) { 配送先を受注から外す(seedId, 配送先ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の受注から配送先（${配送先ID[i].join("・")}）を外した`); }
    if (o.会員なし) { 受注から会員を外す(seedId, 受注ID[i], 持ち主[i]); 書いた.push(`${注文番号[i]} の受注から会員を外した（ゲスト受注。会員とプレイヤーを持たない）`); }
  }
  issue(`DB で書き足した（E2E の行だけ）: 受注 ${受注ID.join("・")} の受注日時を ${受注日時}${d.出荷指示リスト ? "・対応状況を「注文受領」へ戻した" : ""}${書いた.length ? `・${書いた.join("・")}` : ""}`);

  作った.set(seedId, { 会員メール: メール, 受注ID, 注文番号, 出荷指示リストID: リスト, 商品名: Object.fromEntries(明細の一覧.map((x) => [x.コード, rc(x.名前)])) });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number, n: number) => (n > 1 ? "ABC"[i] : "");
  const cb = seedId.includes("-CB") ? "CB" : "";
  const v: Record<string, string> = {};
  注文番号.forEach((n, i) => { v[`〔注文番号-M0509-${cb}${番号}${文字(i, 注文番号.length)}〕`] = n; });
  if (リスト) v[`〔出荷指示リストID-M0509-${番号}〕`] = リスト;
  d.受注.forEach((o, i) => {
    if (!o.配送先を分ける) return;
    const ss = 受注の配送先ID(受注ID[i]);
    v[`〔配送先ID-M0509-${cb}${番号}A〕`] = ss[0]; v[`〔配送先ID-M0509-${cb}${番号}B〕`] = ss[1];
  });
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-09-${k}`;
  defineSeed(seedId, { needs: ["S-M05-09-ADM"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}

/** この実行の印（spec が注記に使う） */
export const 実行の印 = RUN_MARK;
