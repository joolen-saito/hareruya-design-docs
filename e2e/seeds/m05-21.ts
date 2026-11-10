/**
 * M05-21 ピッキングリスト印刷の画面シード。正本: cases/M05-21_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順。1つの作り方 作る() を、シードごとの定め（下の 定め）で動かす）:
 * 1. 商品: グッズ商品CSV登録で商品を作り、本店・EC-CUBE に在庫編集で入庫して別のメンバーが承認する（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *    商品コードに実行の印を付ける。商品名はシード表の値のまま（ピッキングリストは選んだ受注の明細だけを出すので取り違えない。商品名の中の
 *    「白/R」などの位置をケースが確かめるので、名前には印を付けない）。
 * 2. カード: カード登録画面でカードを1枚登録し（カード名に実行の印。カラー・レアリティ・Foil はシード表のとおり）、カード商品の数だけ
 *    カード詳細を足す。商品登録編集の「カード指定 >」で、カード商品ごとに別のカード詳細を指定し、商品名を入れ直して登録する。
 * 3. 受注: 共有の試験用会員（pages/front/m05_front_order.ts の M05_BUYER）でフロントにログインし、定めの順に商品と数量をカートに入れて、
 *    出荷指示リストから除外されない配送方法・外部の決済へ移らない支払方法で注文する。2件の受注は続けて注文する。
 * 4. 出荷指示リスト: 出荷指示リスト検索画面の生成欄で、注文番号（from）〜（to）を入れて生成する。生成は範囲に入るほかの方の受注も集めるので、
 *    生成の前に、範囲に入る受注が自分の受注だけであることを DB の参照で確かめ、外れたら生成せずに止める（ほかの方の受注を巻き込まない）。
 *    2件が連続した注文番号でないとき（間にほかの方の注文が入ったとき）も止める。
 * 5. DB での書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。db/m05_21.ts）: 出荷指示リストの作成日 2026-09-01 10:20:30
 *    （画面では生成した日時になる）と、受注の対応状況「対応中」（画面の選択肢に無い。生成で「出荷指示」になる）。
 *
 * シードでの解釈（記録にも書く）:
 * - 受注一覧しきい値（S-M05-21-SETTINGS）は全員が使う共有の設定なので書き換えない。開発環境の値が 980・4800 であることを DB の参照で
 *   確かめるだけにした（11/10 時点で一致）。ほかの値を前提にするケースは実装していない。
 * - マスタ（S-M05-21-MASTERS）は、実装したケースが使うもの（レアリティ「レア」のコード R、色「白」）が開発環境にあることを DB の参照で確かめるだけ。
 *   カテゴリ「カード」「グッズ」「予約グッズ」は最上位に作れない（カテゴリ登録は親を選んだときだけ入力欄が出る作り）ので作らない。
 * - 商品のカテゴリ: グッズ商品CSV登録はグッズ（アプリの決め打ちの番号 2・4・5 の系統）の下しか受け付けない。グッズの商品は番号2の下、
 *   予約グッズの商品は番号4の下のカテゴリにした。カード商品は、シード表は商品登録編集でカテゴリを「カード」に付け替えると定めるが、
 *   付け替えていない（取込のカテゴリのまま。カテゴリ数は1）。ピッキングリストのカードとサプライの分かれ目は、商品にカード詳細が付いているかで決まる。
 * - カードの必須項目（点数で見たマナ・コスト 0、レイアウト・プロモ種別は選択肢の先頭）・「レアリティと Foil を選び」で値の定めが無いものは
 *   選択肢の先頭（Foil は「なし」）。
 * - 011 の「商品規格の販売価格6000」: 500円で注文したあと、商品規格登録編集で販売価格を6000に変えて登録した（受注明細の価格は500のまま）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 受注一覧しきい値, 受注IDの, 受注の出荷指示リスト, 受注を対応中にする, 出荷指示リストの作成日を書き足す, 出荷指示リストの受注, 注文番号の範囲の受注, 予約グッズの子カテゴリ, レアリティのコード, 色があるか } from "../db/m05_21";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";
import { 出荷指示リストを生成する } from "../pages/admin/m05_20_standby";
import { 範囲で出荷指示リストを生成する } from "../pages/admin/m05_21_picking";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { classRowsFromProductEdit } from "../pages/admin/m03_23_seed_products";
import { カードを登録する, カード詳細IDs } from "../pages/admin/m14_card";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureBuyer, M05_BUYER, 会員が商品を注文する } from "../pages/front/m05_front_order";

export const M0521_ADMIN: Account = { loginId: "m0521_admin", password: "Passw0rd!M0521" };
export const 作成日 = "2026-09-01 10:20:30";

defineSeed("S-M05-21-ADM", async ({ browser }) => {
  await ensureM05Admin(browser, { 名前: "M05-21管理者", account: M0521_ADMIN, メール: "m0521_admin@example.test" });
  reportSeedIssue("S-M05-21-ADM", "権限は、受注管理を操作できる「システム管理者」にした。所属・店舗・メールアドレスは任意の値（本店・m0521_admin@example.test）");
});

defineSeed("S-M05-21-SETTINGS", async () => {
  const t = 受注一覧しきい値();
  if (t.金額1 !== "980" || t.金額2 !== "4800") {
    throw new Error(`受注一覧しきい値が 金額1=${t.金額1}・金額2=${t.金額2}（980・4800 のはず）。全員が使う共有の設定なので書き換えない`);
  }
  reportSeedIssue("S-M05-21-SETTINGS", "受注一覧しきい値（共有の設定）は書き換えず、開発環境の値が 金額1=980・金額2=4800 であることを DB の参照で確かめた");
});

defineSeed("S-M05-21-MASTERS", async () => {
  const miss: string[] = [];
  if (レアリティのコード("レア") !== "R") miss.push("レアリティ「レア」のコード R");
  if (!色があるか("白")) miss.push("色「白」");
  if (miss.length) throw new Error(`開発環境のマスタに ${miss.join("・")} が無い（マスタは共有なので書き換えない）`);
  reportSeedIssue("S-M05-21-MASTERS", "マスタは書き換えず、実装したケースが使うもの（レアリティ「レア」のコード R・色「白」）が開発環境にあることを DB の参照で確かめた。棚番号・略称タグ・言語/状態のIDの直接設定と、最上位のカテゴリ「カード」「グッズ」「予約グッズ」の登録はしていない");
});

// ---- ケース専用のシード ----

type 明細 = {
  /** 正本の商品コード（印はここで付ける） */
  コード: string; 名前: string; 価格: number; 数量: number;
  /** 「カード」ならカード詳細を指定する（カード商品）。「グッズ」「予約グッズ」はカード詳細なし */
  種類: "カード" | "グッズ" | "予約グッズ";
  /** 注文のあとで商品規格の販売価格をこの値に変える（011） */
  注文後の価格?: number;
};
type 定め = {
  /** 受注（1件か2件）。明細は注文でカートに入れる順 */
  受注: 明細[][];
  /** 受注ごとに別の出荷指示リストにする（003） */
  別のリスト?: boolean;
  カード?: { カラー?: string[]; レアリティ?: string; Foil?: "なし" | "通常" };
};

const c = (コード: string, 名前: string, 価格 = 1000, 数量 = 1, extra: Partial<明細> = {}): 明細 => ({ コード, 名前, 価格, 数量, 種類: "カード", ...extra });
const g = (コード: string, 名前: string, 種類: "グッズ" | "予約グッズ" = "グッズ"): 明細 => ({ コード, 名前, 価格: 1000, 数量: 1, 種類 });

const 定めの表: Record<string, 定め> = {
  "BASE-002": { 受注: [[c("M0521-002-A", "基本カード")], [c("M0521-002-B", "未選択カード")]] },
  "EXTERNAL-003": { 受注: [[c("M0521-003-A", "M0521所属内カード-003")], [c("M0521-003-B", "M0521所属外カード-003")]], 別のリスト: true },
  "BASE-004": { 受注: [[c("M0521-004-A", "M0521未選択印刷カードA")], [c("M0521-004-B", "M0521未選択印刷カードB")]] },
  "AGGREGATE-006": { 受注: [[c("M0521-006-A", "集約カード", 1000, 2)], [c("M0521-006-A", "集約カード", 1000, 3)]], カード: { カラー: ["白"] } },
  "GROUPS-007": {
    受注: [[c("M0521-007-1", "M0521境界カード979-007", 979), c("M0521-007-2", "M0521境界カード980-007", 980), c("M0521-007-3", "M0521境界カード4799-007", 4799),
      c("M0521-007-4", "M0521境界カード4800-007", 4800), g("M0521-007-G", "M0521グッズ商品-007"), g("M0521-007-Y", "M0521予約グッズ商品-007", "予約グッズ")]],
  },
  "GROUPS-008": {
    受注: [[c("M0521-008-1", "M0521分類カード1-008"), c("M0521-008-2", "M0521分類カード2-008"), c("M0521-008-3", "M0521分類カード3-008"),
      c("M0521-008-4", "M0521分類カード4-008"), g("M0521-008-G", "グッズ商品"), g("M0521-008-Y", "予約グッズ商品", "予約グッズ")]],
  },
  "GROUPS-009": {
    受注: [[c("M0521-009-1", "M0521境界カード979-009", 979), c("M0521-009-2", "M0521境界カード980-009", 980), c("M0521-009-3", "M0521境界カード4799-009", 4799),
      c("M0521-009-4", "M0521境界カード4800-009", 4800), g("M0521-009-G", "M0521グッズ商品-009"), g("M0521-009-Y", "M0521予約グッズ商品-009", "予約グッズ")]],
  },
  "PRICE-DIFFERENCE-011": { 受注: [[c("M0521-011-A", "価格差カード", 500, 1, { 注文後の価格: 6000 })]] },
  "NAMES-014": { 受注: [[g("M0521-014-A", "サプライ[限定] 白/R")]] },
  "NAMES-015": { 受注: [[c("M0521-015-A", "角括弧除去カード[注記A][注記B]")]] },
  "NAMES-016": { 受注: [[c("M0521-016-A", "末尾カード 白/R")]], カード: { カラー: ["白"], レアリティ: "レア" } },
  "NAMES-017": { 受注: [[c("M0521-017-A", "括弧カード 白/R(限定)")]], カード: { カラー: ["白"], レアリティ: "レア" } },
  "NAMES-018": { 受注: [[c("M0521-018-A", "前半 白/R 後半")]], カード: { カラー: ["白"], レアリティ: "レア" } },
  "NAMES-019": { 受注: [[c("M0521-019-A", "角括弧カード 白/R[注記]")]], カード: { カラー: ["白"], レアリティ: "レア" } },
  "NUMBER-TOTAL-020": { 受注: [[c("M0521-020-A", "M0521合計カードA-020", 500, 2), c("M0521-020-B", "M0521合計カードB-020", 500, 3), c("M0521-020-C", "M0521合計カードC-020", 5000, 4)]], カード: { カラー: ["白"] } },
  "BASE-029": { 受注: [[c("M0521-029-A", "基本カード")], [c("M0521-029-B", "未選択カード")]] },
};

/** シードが作ったもの（spec が使う） */
export type 作ったもの = { 出荷指示リストID: string[]; 受注ID: string[]; 注文番号: string[]; 商品規格ID: Record<string, string> };
const 作った = new Map<string, 作ったもの>();
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作った.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

async function 作る(browser: Browser, seedId: string, notes: Notes, d: 定め): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 番号 = /-(\d{3})$/.exec(seedId)?.[1] ?? "";
  // 1. 商品（同じ商品コードの明細は1つの商品にまとめる）
  const 明細の一覧 = d.受注.flat();
  const 商品の明細 = [...new Map(明細の一覧.map((x) => [x.コード, x])).values()];
  const 数量の合計 = (コード: string) => 明細の一覧.filter((x) => x.コード === コード).reduce((s, x) => s + x.数量, 0);
  const 予約の子 = 商品の明細.some((x) => x.種類 === "予約グッズ") ? 予約グッズの子カテゴリ() : "";
  const made = await 商品を作って入庫する(browser, seedId, 商品の明細.map((x) => ({
    商品コード: rc(x.コード), 商品名: x.名前, 価格: String(x.価格), 入庫数: 数量の合計(x.コード) + 2, 入庫方法: "在庫編集" as const,
    ...(x.種類 === "予約グッズ" ? { CSVの値: { "商品カテゴリ(ID)": 予約の子 } } : {}),
  })), issue);
  const 商品ID = new Map(made.map((m, i) => [商品の明細[i].コード, m.productId]));
  if (予約の子) issue(`予約グッズの商品は、予約グッズの親カテゴリ（アプリの決め打ちの番号 4）の下のカテゴリ ${予約の子} にした`);

  // 2. カード（カード商品の数だけカード詳細を足し、商品ごとに別のカード詳細を指定する）
  const カード商品 = 商品の明細.filter((x) => x.種類 === "カード");
  if (カード商品.length > 0) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const カード名 = rc(`M0521カード-${番号}`);
      await カードを登録する(page, {
        カード名日: カード名, カード名英: rc(`M0521-Card-${番号}`), 点数で見たマナ: "0", カラー: d.カード?.カラー,
        詳細: カード商品.map(() => ({ レアリティ: d.カード?.レアリティ, Foil: d.カード?.Foil ?? "なし" })),
      }, `${seedId}: カードの登録`, issue);
      const 詳細 = await カード詳細IDs(page);
      if (詳細.length !== カード商品.length) throw new Error(`${seedId}: 登録したカードの詳細情報が ${詳細.length} 件（${カード商品.length} 件のはず）`);
      for (const [i, x] of カード商品.entries()) {
        await assignCardOnProductEdit(page, { productId: 商品ID.get(x.コード)!, cardNameJp: カード名, cardDetailId: 詳細[i], productNameJp: x.名前, productNameEn: x.名前 }, issue);
      }
    });
  }

  // 3. 受注（続けて注文する）
  await ensureBuyer(browser);
  const 注文番号: string[] = [];
  for (const [i, o] of d.受注.entries()) {
    注文番号.push(await 会員が商品を注文する(browser, M05_BUYER, o.map((x) => ({ 商品ID: 商品ID.get(x.コード)!, 数量: x.数量 })), `${seedId}: ${i + 1}件目の受注`));
  }
  const 受注ID = 注文番号.map((n) => 受注IDの(n, M05_BUYER.メール));

  // 4. 出荷指示リスト（範囲に入るのが自分の受注だけかを確かめてから生成する）
  const リスト: string[] = [];
  await withAdminSession(browser, M0521_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 組 = d.別のリスト ? 注文番号.map((n) => [n]) : [注文番号];
    for (const ns of 組) {
      const from = ns[0], to = ns[ns.length - 1];
      if (ns.length > 1 && Number(to) !== Number(from) + ns.length - 1) {
        throw new Error(`${seedId}: 続けて注文した受注の注文番号 ${ns.join("・")} が連続していない（間にほかの方の注文が入った）。範囲で生成するとほかの方の受注を巻き込むので止める`);
      }
      const 範囲 = 注文番号の範囲の受注(from, to);
      const 自分 = new Set(ns);
      const 他 = 範囲.filter((r) => !自分.has(r.注文番号) || r.メール !== M05_BUYER.メール);
      if (他.length > 0 || 範囲.length !== ns.length) {
        throw new Error(`${seedId}: 注文番号 ${from}〜${to} の範囲に、自分の受注以外が入っている（${他.map((r) => r.注文番号).join("・") || "件数が違う"}）。生成すると巻き込むので止める`);
      }
      if (ns.length === 1) await 出荷指示リストを生成する(page, from, seedId);
      else await 範囲で出荷指示リストを生成する(page, from, to, seedId);
      const ids = ns.map((n) => 受注ID[注文番号.indexOf(n)]);
      const per = ids.map((id) => 受注の出荷指示リスト(id));
      if (per.some((x) => x.length !== 1) || new Set(per.map((x) => x[0])).size !== 1) {
        throw new Error(`${seedId}: 生成した出荷指示リストに受注がそろって入っていない（${ids.map((id, i) => `${id}→${per[i].join(",") || "なし"}`).join(" / ")}）`);
      }
      const id = per[0][0];
      const 入った = 出荷指示リストの受注(id);
      if (入った.join(",") !== [...ids].sort((a, b) => Number(a) - Number(b)).join(",")) throw new Error(`${seedId}: 出荷指示リスト ${id} に入った受注 ${入った.join(",")} が自分の受注 ${ids.join(",")} と違う`);
      リスト.push(id);
    }
  });

  // 注文のあとで商品規格の販売価格を変える（011）
  const 規格ID: Record<string, string> = {};
  const seedText = getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法;
  const 規格IDを控える = seedText.includes(`〔商品規格ID-M0521-${番号}〕`);
  for (const x of 商品の明細.filter((y) => y.注文後の価格 !== undefined || (規格IDを控える && 商品の明細.length === 1))) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const rows = await classRowsFromProductEdit(page, 商品ID.get(x.コード)!);
      if (rows.length !== 1) throw new Error(`${seedId}: ${x.名前} の商品規格が ${rows.length} 件（1件のはず）`);
      規格ID[x.コード] = rows[0].商品規格ID;
      if (x.注文後の価格 !== undefined) {
        const e = new ClassEditPage(page);
        await e.編集で開く(商品ID.get(x.コード)!, rows[0].商品規格ID);
        await e.販売価格.fill(String(x.注文後の価格));
        const r = await e.登録を押す();
        if (!r.転送があった) throw new Error(`${seedId}: ${x.名前} の販売価格を ${x.注文後の価格} にして登録できない（${(await e.画面のエラー.allInnerTexts()).join(" / ")}）`);
        const now = await e.金額(e.販売価格);
        if (now !== String(x.注文後の価格)) throw new Error(`${seedId}: ${x.名前} の販売価格が ${now}（${x.注文後の価格} のはず）`);
      }
    });
  }

  // 5. DB での書き足し（E2E の行だけ）
  for (const id of リスト) 出荷指示リストの作成日を書き足す(seedId, id, M05_BUYER.メール, 作成日);
  受注を対応中にする(seedId, 受注ID, M05_BUYER.メール);
  issue(`DB で書き足した（E2E の行だけ）: 出荷指示リスト ${リスト.join("・")} の作成日を ${作成日}、受注 ${受注ID.join("・")} の対応状況を「対応中」`);

  作った.set(seedId, { 出荷指示リストID: リスト, 受注ID, 注文番号, 商品規格ID: 規格ID });

  // 呼び名を控える（シード表の文に出る呼び名だけ）
  const 文字 = (i: number, n: number) => (n > 1 ? "AB"[i] : "");
  const v: Record<string, string> = {};
  リスト.forEach((id, i) => { v[`〔出荷指示リストID-M0521-${番号}${文字(i, リスト.length)}〕`] = id; });
  受注ID.forEach((id, i) => { v[`〔受注ID-M0521-${番号}${文字(i, 受注ID.length)}〕`] = id; });
  注文番号.forEach((n, i) => { v[`〔注文番号-M0521-${番号}${文字(i, 注文番号.length)}〕`] = n; });
  for (const [, id] of Object.entries(規格ID)) v[`〔商品規格ID-M0521-${番号}〕`] = id;
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (!(label in v)) throw new Error(`${seedId}: 呼び名 ${label} に当たる値が無い`);
    notes.set(label, v[label]);
  }
}

for (const [k, d] of Object.entries(定めの表)) {
  const seedId = `S-M05-21-${k}`;
  defineSeed(seedId, { needs: ["S-M05-21-ADM"] }, async ({ browser, notes }) => 作る(browser, seedId, notes, d));
}
