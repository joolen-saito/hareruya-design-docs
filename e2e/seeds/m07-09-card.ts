/**
 * M07-09 戻しリストPDF出力 のカード商品を使うシード（と、共有の前提 CONFIG・MASTER の読み取り）。正本: cases/M07-09_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 画面から作ったデータ」に読み替えてよい。DB へは書き込まず、参照もしない。
 * 共有の設定・共有のマスタは書き換えない・足さない（いまの値を画面で読み、前提と合うか確かめて使う。合わなければそのシードを止める）。
 * 読み替えたことは、シードの報告（reportSeedIssue）に「シード作成時の問題」として残す（ケースの注記に出る）。
 *
 * 読み替え（シード表 → 実際の作り方）:
 * - CONFIG 本店の高額商品閾値 300/3000/未設定: 書き換えず、いまの閾値（2つ設定・3つ目は未設定であること）を使う。
 *   ケースとシード表の金額 300・3000 を、いまの閾値1・閾値2 に読み替え、基準価格もその区切りとの関係が同じになる値にする（price()）。
 * - MASTER 言語順・状態順・色順・レアリティ順・略称タグ AAA/BBB/COL/ALP: 登録しない。MTGマスターデータ管理・略称タグの画面で、
 *   いまの並び（言語・状態はID の順＝戻しリストの並びに使われる順、レアリティ・色順は並び順）を読み、ケースが要る順になっているかを各シードで確かめる。
 *   略称タグは既存のものを使う: AAA＝コレクター番号順でいちばん並び順の小さいもの、BBB＝AAA より並び順の大きいコレクター番号順のもの、
 *   COL＝AAA と同じもの、ALP＝アルファベット順の先頭のもの。商品名の [AAA] などは、使った略称タグの名称に置き換える（ケース 041 の [ZZZ] はそのまま）。
 * - カード（カード管理のカード詳細で登録）: カードマスターに足さず、カード検索で既存のカードから、カラーが1色（赤／青）・色順が同じ色で、
 *   詳細情報のレアリティ・Foil がシード表どおりのカード詳細を探して指定する。コレクター番号・英語カード名の順を見るケースは、
 *   既存のカード詳細のうち、シード表の大小の関係（001 < 002、Alpha < Beta）と同じ関係になる2件を選ぶ。
 * - 棚番号（A01・M0709-NNN-S など）: 登録しない。棚番号の一覧（並び順の昇順）の既存の棚を、シードの中の棚の名前の昇順に割り当てる
 *   （シード表は「並び順が名称の昇順になる値」で登録する定め）。
 * - 申込に使う商品: シード表はカード商品 A を申込むが、買取価格1円では買取商品詳細に「カートに追加」が出ない（下限500円）。
 *   申込は別のサプライ品（買取価格500円）で行い、実在庫はシード表どおりの商品で足す（戻しリストは実在庫の商品だけを出す）。
 * - 会員と注文者名: 会員は M07-03 と同じ作り方（フロントの会員登録＋管理画面の会員登録編集で本会員）。お名前の姓＝注文者名は実行の印つき
 *   （前の実行の買取が同じ注文者名で残るのを、消さずに避けるため）。ケースの手順2も同じ印つきの値を入れる。
 * - 商品コード・商品名は実行の印つき（lib/run_marker）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { rc, RUN_MARK } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { 閾値を読む } from "../pages/admin/m07_config";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCsvCategoryId } from "../pages/admin/m03_22_product";
import {
  カード詳細, カード詳細を探す, マスタの行, マスタを読む, 商品をカードにする, 実在庫に規格を追加する, 棚, 棚番号を読む, 略称タグ, 略称タグを読む, 規格を整える, 規格を足す,
} from "../pages/admin/m07_09_card";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する, 商品IDを画面で引く } from "./m07-03-b";

// ---------------------------------------------------------------------------
// 共有の前提（CONFIG・MASTER）を画面で読んで控える（このプロセスの中だけ）
// ---------------------------------------------------------------------------

type 前提 = {
  閾値: [number, number] | null;
  閾値の表示: string;
  言語: Map<string, マスタの行>;
  状態: Map<string, マスタの行>;
  レアリティ: Map<string, マスタの行>;
  色順: Map<string, マスタの行>;
  略称: { AAA: string | null; BBB: string | null; COL: string | null; ALP: string | null };
  棚: 棚[];
};
const 前提: 前提 = {
  閾値: null, 閾値の表示: "", 言語: new Map(), 状態: new Map(), レアリティ: new Map(), 色順: new Map(),
  略称: { AAA: null, BBB: null, COL: null, ALP: null }, 棚: [],
};
let configRead = false;
let masterRead = false;

/** 本店の高額商品閾値を読む（書き換えない）。閾値1・2 が設定済みで3が未設定なら使う */
export async function 閾値を控える(browser: Browser, seedId: string): Promise<void> {
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return 閾値を読む(page); });
  configRead = true;
  前提.閾値の表示 = v.map((x) => x || "未設定").join("/");
  const nums = v.filter((x) => x !== "").map(Number);
  if (v[2] === "" && v[0] !== "" && v[1] !== "" && nums.every(Number.isFinite) && nums[0] !== nums[1]) {
    前提.閾値 = [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
    reportSeedIssue(seedId, `シード作成時の問題: 本店の高額商品閾値はシード表では 300/3000/未設定 に設定する。共有の設定なので書き換えず、いまの値（${前提.閾値の表示}）を使った。カード商品のケースでは、金額 300 を ${前提.閾値[0]}、3000 を ${前提.閾値[1]} に読み替える`);
  } else {
    前提.閾値 = null;
    reportSeedIssue(seedId, `シード作成時の問題: 本店の高額商品閾値はシード表では 300/3000/未設定。いまの値（${前提.閾値の表示}）は「2つ設定・3つ目は未設定」の形でないので、商品仕訳を見るカード商品のシードは止める（共有の設定は書き換えない）`);
  }
}

/** 言語・状態・レアリティ・色順の並びと、略称タグ・棚番号の既存の値を読む（書き換えない） */
export async function マスタを控える(browser: Browser, seedId: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const byCode = (rows: マスタの行[]) => new Map(rows.filter((r) => r.コード).map((r) => [r.コード, r] as [string, マスタの行]));
    前提.言語 = byCode(await マスタを読む(page, "言語"));
    前提.状態 = byCode(await マスタを読む(page, "状態"));
    前提.レアリティ = byCode(await マスタを読む(page, "レアリティ"));
    前提.色順 = new Map((await マスタを読む(page, "色順")).map((r) => [r.名称, r] as [string, マスタの行]));
    const tags: 略称タグ[] = await 略称タグを読む(page);
    const col = tags.filter((t) => !t.アルファベット順).sort((a, b) => a.並び順 - b.並び順);
    const aaa = col.find((t, i) => col.findIndex((u) => u.並び順 === t.並び順) === i && col.filter((u) => u.並び順 === t.並び順).length === 1) ?? null;
    const bbb = aaa ? col.find((t) => t.並び順 > aaa.並び順) ?? null : null;
    const alp = tags.find((t) => t.アルファベット順) ?? null;
    前提.略称 = { AAA: aaa?.名称 ?? null, BBB: bbb?.名称 ?? null, COL: aaa?.名称 ?? null, ALP: alp?.名称 ?? null };
    // 並び順が同じ棚は戻しリストで順が決まらないので、並び順が前の棚より大きいものだけを使う
    const shelves = (await 棚番号を読む(page)).sort((a, b) => a.並び順 - b.並び順);
    前提.棚 = shelves.filter((x, i) => i === 0 || x.並び順 > shelves[i - 1].並び順);
  });
  masterRead = true;
  const id = (m: Map<string, マスタの行>, c: string) => m.get(c)?.ID ?? "無し";
  const so = (m: Map<string, マスタの行>, c: string) => (m.get(c) ? String(m.get(c)!.並び順) : "無し");
  reportSeedIssue(seedId, "シード作成時の問題: 言語・状態・カラー・色順・レアリティの並び順と略称タグ AAA/BBB/COL/ALP は、シード表では共有のマスタに登録・並び順をそろえる定め。"
    + "共有のマスタは書き換えず、いまの値を読んで使った（カード商品のシードが、要る順になっているかを確かめる）: "
    + `言語のID JP=${id(前提.言語, "JP")}・EN=${id(前提.言語, "EN")}・FR=${id(前提.言語, "FR")}／状態のID NM=${id(前提.状態, "NM")}・HP=${id(前提.状態, "HP")}／`
    + `レアリティの並び順 M=${so(前提.レアリティ, "M")}・C=${so(前提.レアリティ, "C")}／色順の並び順 赤=${so(前提.色順, "赤")}・青=${so(前提.色順, "青")}／`
    + `略称タグ AAA→${前提.略称.AAA ?? "無し"}・BBB→${前提.略称.BBB ?? "無し"}・COL→${前提.略称.COL ?? "無し"}・ALP→${前提.略称.ALP ?? "無し"}`);
}

// ---------------------------------------------------------------------------
// 読み替えの部品（ケースからも使う）
// ---------------------------------------------------------------------------

/** シード・ケースの金額（300・3000 の区切りに対する値）を、いまの閾値に対して同じ関係になる金額にする */
export function 価格(p: number): number {
  const t = 前提.閾値;
  if (!t) throw new Error("本店の高額商品閾値を読めていない（S-M07-09-CONFIG）");
  const [t1, t2] = t;
  if (p === 299) return t1 - 1;
  if (p === 300) return t1;
  if (p === 2999) return t2 - 1;
  if (p === 3000) return t2;
  if (p < 300) return p < t1 ? p : Math.max(1, Math.floor((p * (t1 - 1)) / 299));
  if (p < 3000) return p >= t1 && p < t2 ? p : t1 + Math.round(((p - 300) * (t2 - t1 - 1)) / 2700);
  return p > t2 ? p : t2 + (p - 3000);
}

/** ケースの商品仕訳の名前（「300円未満」「300円以上3000円未満」「3000円以上」「サプライ」）を、戻しリストの見出しの部分の文に読み替える */
export function 仕訳の見出し(正本: "300円未満" | "300円以上3000円未満" | "3000円以上" | "サプライ"): string {
  if (正本 === "サプライ") return "（サプライ）";
  const t = 前提.閾値;
  if (!t) throw new Error("本店の高額商品閾値を読めていない（S-M07-09-CONFIG）");
  const f = (n: number) => n.toLocaleString("en-US");
  if (正本 === "300円未満") return `（商品単位_${f(t[0])}円未満）`;
  if (正本 === "3000円以上") return `（商品単位_${f(t[1])}円以上）`;
  return `（商品単位_${f(t[0])}円以上_${f(t[1])}円未満）`;
}

/** 正本の略称タグ名を、使った既存の略称タグ名に読み替える */
export function 略称名(正本: "AAA" | "BBB" | "COL" | "ALP"): string {
  const v = 前提.略称[正本];
  if (!v) throw new Error(`略称タグ ${正本} の代わりに使える既存の略称タグが無い（S-M07-09-MASTER）`);
  return v;
}

/** 注文者名（お名前の姓）。実行の印つき */
export const 注文者名 = (n: string): string => rc(`戻しPDF試験M0709-${n}`);
/** 商品コード・商品名の先頭（印つき） */
export const 品コード = (n: string, 枝: string): string => rc(`M0709-${n}-${枝}`);

// ---------------------------------------------------------------------------
// カード詳細の選び方
// ---------------------------------------------------------------------------

type 色 = "赤" | "青";
type 札 = { 色: 色; レア: "M" | "C"; Foil: boolean };
const pools = new Map<string, カード詳細[]>();

async function 候補(page: Page, c: 札): Promise<カード詳細[]> {
  const key = `${c.色}/${c.レア}/${c.Foil ? 1 : 0}`;
  const hit = pools.get(key);
  if (hit) return hit;
  const r = 前提.レアリティ.get(c.レア);
  if (!r) throw new Error(`レアリティのコード ${c.レア} がMTGマスターデータ管理に無い`);
  const found = await カード詳細を探す(page, { 色: c.色, レアリティ名: r.名称, レアリティID: r.ID, Foil: c.Foil ? "通常" : "なし", max: 8, open: 40 });
  if (found.length === 0) throw new Error(`既存のカードに、カラー${c.色}・色順${c.色}・レアリティ${c.レア}・Foil${c.Foil ? "あり" : "なし"} のカード詳細が見つからない`);
  pools.set(key, found);
  return found;
}

const 数字だけ = (s: string) => /^\d+$/.test(s);
/** 戻しリストの並び（DB の文字の比較）で a が b より先と言える組か（照合順序に左右されない組だけを選ぶ） */
function 番号が先(a: string, b: string): boolean {
  return 数字だけ(a) && 数字だけ(b) && a.length === b.length && a < b;
}
function 英名が先(a: string, b: string): boolean {
  const ok = (s: string) => /^[A-Za-z][A-Za-z ,'-]*$/.test(s);
  return ok(a) && ok(b) && a < b && a.toLowerCase() < b.toLowerCase();
}

/** 先の札と後の札で、鍵（コレクター番号／英語カード名）が先<後 になるカード詳細の組を選ぶ */
async function 組を選ぶ(page: Page, 先: 札, 後: 札, 鍵: "番号" | "英名"): Promise<[カード詳細, カード詳細]> {
  const xs = await 候補(page, 先), ys = await 候補(page, 後);
  for (const x of xs) for (const y of ys) {
    if (x.詳細ID === y.詳細ID) continue;
    if (鍵 === "番号" ? 番号が先(x.コレクター番号, y.コレクター番号) : (x.カードID !== y.カードID && 英名が先(x.カード名英, y.カード名英))) return [x, y];
  }
  throw new Error(`既存のカード詳細から、${鍵 === "番号" ? "コレクター番号" : "英語カード名"}が「${先.色}${先.レア}」<「${後.色}${後.レア}」になる組を選べない`);
}

// ---------------------------------------------------------------------------
// シードの定義
// ---------------------------------------------------------------------------

type 品 = {
  枝: string;
  /** カード商品の札（無ければサプライ品） */
  札?: 札;
  言語?: "JP" | "EN" | "FR";
  状態?: "NM" | "HP";
  略称?: "AAA" | "BBB" | "COL" | "ALP";
  /** 商品名の [ ] の中を正本の値のまま書く（041 の ZZZ） */
  名札?: string;
  棚: string;
  数?: string;
  基準価格: number;
  セール価格?: number;
  /** 並びを見る組（同じ組の 位0 → 位1 の順に鍵が小さい） */
  組?: { 鍵: "番号" | "英名"; 位: 0 | 1 };
};

type 前提の要る順 = "言語JP<EN" | "言語EN<FR" | "状態NM<HP" | "レアM<C" | "色赤<青" | "略称AAA<BBB";

function 確かめる(seedId: string, 要る: 前提の要る順[], 閾値が要る: boolean): void {
  if (!configRead || !masterRead) throw new Error(`${seedId}: 共有の前提（S-M07-09-CONFIG・S-M07-09-MASTER）を読んでいない`);
  if (閾値が要る && !前提.閾値) throw new Error(`${seedId}: 本店の高額商品閾値（${前提.閾値の表示}）が「2つ設定・3つ目は未設定」でないので作らない（共有の設定は書き換えない）`);
  const lt = (m: Map<string, マスタの行>, a: string, b: string, by: "ID" | "並び順") => {
    const x = m.get(a), y = m.get(b);
    if (!x || !y) return false;
    return by === "ID" ? Number(x.ID) < Number(y.ID) : x.並び順 !== null && y.並び順 !== null && x.並び順 < y.並び順;
  };
  const ng: string[] = [];
  for (const r of 要る) {
    const ok = r === "言語JP<EN" ? lt(前提.言語, "JP", "EN", "ID")
      : r === "言語EN<FR" ? lt(前提.言語, "EN", "FR", "ID")
      : r === "状態NM<HP" ? lt(前提.状態, "NM", "HP", "ID")
      : r === "レアM<C" ? lt(前提.レアリティ, "M", "C", "並び順")
      : r === "色赤<青" ? lt(前提.色順, "赤", "青", "並び順")
      : !!前提.略称.AAA && !!前提.略称.BBB;
    if (!ok) ng.push(r);
  }
  if (ng.length) throw new Error(`${seedId}: 共有のマスタのいまの並びが、シード表の前提（${ng.join("・")}）と合わないので作らない（共有のマスタは書き換えない）`);
}

const NEEDS = ["S-M07-09-ENV", "S-M07-09-ADM", "S-M07-09-CONFIG", "S-M07-09-MASTER"];

/**
 * カード商品（とサプライ品）を実在庫に持つ買取を1件作るシード。
 * 商品（グッズ商品CSV登録 → カード指定・略称タグ → 規格の棚番号・公開、状態HPは規格の新規作成）→ 会員 → 申込（別のサプライ品）→
 * 買取番号を控える → 買取状況「入庫待ち」で保存 → 実在庫に商品を足す → 必要なら「入庫済み」で保存。
 */
function defineReturnCardSeed(seedId: string, n: string, 品々: 品[], v: { 入庫済み?: boolean; 要る?: 前提の要る順[]; 読み替え?: string[] } = {}): void {
  defineSeed(seedId, { needs: NEEDS }, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    確かめる(seedId, v.要る ?? [], 品々.some((p) => p.札));
    const 姓 = 注文者名(n);
    const apply = 品コード(n, "APPLY");
    // 棚: シードの中の棚の名前の昇順に、既存の棚（並び順の昇順）を割り当てる
    const 棚名 = [...new Set(品々.map((p) => p.棚))].sort();
    if (前提.棚.length < 棚名.length) throw new Error(`${seedId}: 既存の棚番号が ${棚名.length} 件要るが、一覧に ${前提.棚.length} 件しかない`);
    const 棚 = new Map(棚名.map((s, i) => [s, 前提.棚[i].名称] as [string, string]));
    issue(`シード作成時の問題: 棚番号は登録せず既存の棚を使った（${棚名.map((s) => `${s}→${棚.get(s)}`).join("、")}。シード表の名称の昇順＝既存の棚の並び順の昇順）`);
    const 言語ID = (c: string) => { const r = 前提.言語.get(c); if (!r) throw new Error(`言語のコード ${c} がMTGマスターデータ管理に無い`); return r; };

    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      // カード詳細を選ぶ（組は鍵の順）
      const カード = new Map<string, カード詳細>();
      const 組の品 = 品々.filter((p) => p.札 && p.組);
      if (組の品.length) {
        const a = 組の品.find((p) => p.組!.位 === 0)!, b = 組の品.find((p) => p.組!.位 === 1)!;
        const [x, y] = await 組を選ぶ(page, a.札!, b.札!, a.組!.鍵);
        カード.set(a.枝, x); カード.set(b.枝, y);
        issue(`シード作成時の問題: ${a.組!.鍵 === "番号" ? "コレクター番号" : "英語カード名"}の順を見るカードは、カードを登録せず既存のカード詳細から、正本と同じ大小になる2件を選んだ（${a.枝}: ${x.カード名日 || x.カード名英}（${a.組!.鍵 === "番号" ? x.コレクター番号 : x.カード名英}）、${b.枝}: ${y.カード名日 || y.カード名英}（${b.組!.鍵 === "番号" ? y.コレクター番号 : y.カード名英}））`);
      }
      for (const p of 品々) {
        if (!p.札 || カード.has(p.枝)) continue;
        const c = (await 候補(page, p.札))[0];
        カード.set(p.枝, c);
      }
      if (カード.size) issue(`シード作成時の問題: カードはカード管理に登録せず、既存のカード詳細を指定した（${[...カード.entries()].map(([k, c]) => `${k}: カード詳細ID ${c.詳細ID}「${c.カード名日 || c.カード名英}」`).join("、")}）`);

      // 商品（グッズ商品CSV登録で一度に作る）
      const csvCode = (p: 品) => (p.状態 === "HP" ? 品コード(n, `NM${p.枝}`) : 品コード(n, p.枝));
      const 名前 = (p: 品) => {
        const code = 品コード(n, p.枝);
        if (!p.札) return code;
        const tag = p.名札 ?? 略称名(p.略称 ?? "AAA");
        return `${code}[${tag}]【${p.言語 ?? "JP"}/${p.状態 ?? "NM"}】${p.札.色}${p.札.レア}`;
      };
      const categoryId = await goodsCsvCategoryId(page, issue);
      const lines = 品々.map((p) => {
        const price = String(p.札 ? 価格(p.基準価格) : p.基準価格);
        return { code: csvCode(p), nameJp: 名前(p), nameEn: 名前(p), values: { "基準価格": price, "販売価格": price, "買取価格": "1", "言語(ID)": 言語ID(p.言語 ?? "JP").ID } };
      });
      lines.push({ code: apply, nameJp: apply, nameEn: apply, values: { "基準価格": "501", "販売価格": "501", "買取価格": "500", "言語(ID)": 言語ID("JP").ID } });
      await registerGoodsCsv(page, { what: `${seedId} の商品のグッズ商品CSV登録`, fileName: `m0709-${n.toLowerCase()}-${RUN_MARK.toLowerCase()}-${Date.now()}.csv`, categoryId, lines, common: { "原価単価": "10" }, onWarning: issue });
      for (const p of 品々) {
        const id = await 商品IDを画面で引く(page, csvCode(p));
        if (p.札 || p.略称) await 商品をカードにする(page, id, { カード: カード.get(p.枝), 商品名: 名前(p), 略称タグ: p.略称 || p.札 ? 略称名(p.略称 ?? "AAA") : null }, issue);
        const 棚番号 = 棚.get(p.棚)!;
        if (p.状態 === "HP") {
          const price = String(価格(p.基準価格));
          await 規格を足す(page, id, { 言語名: 言語ID(p.言語 ?? "JP").名称, 状態コード: "HP", 商品コード: 品コード(n, p.枝), 基準価格: price, 販売価格: price, 買取価格: "1", 棚番号 }, issue);
        } else {
          await 規格を整える(page, id, csvCode(p), { 棚番号, セール価格: p.セール価格 === undefined ? undefined : String(p.札 ? 価格(p.セール価格) : p.セール価格) }, issue);
        }
      }
      if (品々.some((p) => p.札 && (p.基準価格 !== 価格(p.基準価格)))) {
        issue(`シード作成時の問題: カード商品の基準価格は、いまの閾値（${前提.閾値![0]}/${前提.閾値![1]}）に対してシード表の 300/3000 との関係が同じになる値にした（${品々.filter((p) => p.札).map((p) => `${p.枝}: ${p.基準価格}→${価格(p.基準価格)}`).join("、")}）`);
      }
    });
    issue("シード作成時の問題: シード表は商品 A を申込むが、買取価格1円の商品は買取商品詳細に「カートに追加」が出ない（下限500円）。申込は別のサプライ品（買取価格500円）で行い、実在庫はシード表の商品で足した");

    // 会員 → 申込
    const メール = `${rc(`m0709-${n}`)}@example.test`.toLowerCase();
    await 会員を用意する(browser, seedId, { 姓, 名: "シード", セイ: "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"] });
    issue(`シード作成時の問題: 会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作った。お名前の姓（注文者名）とメールアドレスは実行の印つき（${姓}）`);
    const 商品ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return 商品IDを画面で引く(page, apply); });
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    let 番号 = "";
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール, パスワード: 会員のパスワード });
      番号 = await 条件つきで申込む(fp, [{ 商品ID, 数量: "1" }], { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケンシード" });
    } finally { await ctx.close(); }

    // 買取状況・実在庫
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const open = async () => {
        const l = new BuyListPage(page);
        await l.open();
        await l.注文者名を入れる(姓);
        await l.検索する();
        const rows = (await l.行()).filter((r) => r.番号 === 番号);
        if (rows.length !== 1) throw new Error(`${seedId}: 注文者名「${姓}」の検索結果に、申込完了の買取番号 ${番号} の行が無い`);
        await l.編集画面を開く(番号);
        return new BuyEditPage(page);
      };
      await (await open()).買取状況を変えて保存する("入庫待ち");
      for (const p of 品々) {
        const code = 品コード(n, p.枝);
        await 実在庫に規格を追加する(page, code, p.数 ?? "1", `買取番号 ${番号} への実在庫 ${code} の追加`);
      }
      if (v.入庫済み) await (await open()).買取状況を変えて保存する("入庫済み");
    });
    for (const m of v.読み替え ?? []) issue(`シード作成時の問題: ${m}`);
    for (const l of new Set((seed["状態・属性"] + seed.投入方法).match(/〔買取番号-M0709-[^〕]+〕/g) ?? [])) notes.set(l, 番号);
  });
}

// ---- ケース専用のシード（シード表の状態・属性のとおり） ----

const 赤M: 札 = { 色: "赤", レア: "M", Foil: false };
const 赤MF: 札 = { 色: "赤", レア: "M", Foil: true };
const 赤C: 札 = { 色: "赤", レア: "C", Foil: false };
const 青M: 札 = { 色: "青", レア: "M", Foil: false };
const カ = (枝: string, 基準価格: number, 棚: string, o: Partial<品> = {}): 品 => ({ 枝, 札: 赤M, 略称: "AAA", 棚, 基準価格, ...o });
const サ = (枝: string, 棚: string, o: Partial<品> = {}): 品 => ({ 枝, 棚, 基準価格: 50, ...o });

defineReturnCardSeed("S-M07-09-GROUP-008", "008", [カ("A", 299, "A01"), カ("B", 300, "A01"), カ("E", 2999, "A01"), カ("C", 3000, "A01"), サ("D", "M0709-008-S")]);
defineReturnCardSeed("S-M07-09-BASEPRICE-009", "009", [カ("A", 299, "A01", { セール価格: 3500 }), カ("B", 3000, "A01", { セール価格: 100 })]);
defineReturnCardSeed("S-M07-09-PRICE-010", "010", [カ("A", 2900, "A01", { セール価格: 1800 })]);
defineReturnCardSeed("S-M07-09-SUPABBR-013", "013", [サ("A", "M0709-013-S", { 略称: "AAA" })]);
defineReturnCardSeed("S-M07-09-ROWNO-015", "015", [カ("A", 1000, "A01"), カ("B", 1000, "A01")]);
defineReturnCardSeed("S-M07-09-BLOCKORDER-016", "016", [カ("A", 3500, "A01"), サ("B", "M0709-016-S"), カ("C", 100, "A01"), カ("D", 1000, "A01")]);
defineReturnCardSeed("S-M07-09-SORTSHELF-017", "017", [カ("A", 1000, "M0709-017-S2"), カ("B", 1000, "M0709-017-S1")]);
defineReturnCardSeed("S-M07-09-SORTLANG-018", "018", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 言語: "EN" }), カ("C", 1000, "A01", { 言語: "FR" })], { 要る: ["言語JP<EN", "言語EN<FR"] });
defineReturnCardSeed("S-M07-09-SORTSTATE-019", "019", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 状態: "HP" })], { 要る: ["状態NM<HP"] });
defineReturnCardSeed("S-M07-09-SORTFOIL-020", "020", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 札: 赤MF })]);
defineReturnCardSeed("S-M07-09-SORTTAG-021", "021", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 略称: "BBB" })], { 要る: ["略称AAA<BBB"] });
defineReturnCardSeed("S-M07-09-SORTRAR-022", "022", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 札: 赤C })], { 要る: ["レアM<C"] });
defineReturnCardSeed("S-M07-09-SORTCOLOR-023", "023", [カ("A", 1000, "A01"), カ("B", 1000, "A01", { 札: 青M })], { 要る: ["色赤<青"] });
defineReturnCardSeed("S-M07-09-SORTCOLL-024", "024", [カ("A", 1000, "A01", { 略称: "COL", 組: { 鍵: "番号", 位: 0 } }), カ("B", 1000, "A01", { 略称: "COL", 組: { 鍵: "番号", 位: 1 } })]);
defineReturnCardSeed("S-M07-09-SORTALPHA-025", "025", [カ("A", 1000, "A01", { 略称: "ALP", 組: { 鍵: "英名", 位: 0 } }), カ("B", 1000, "A01", { 略称: "ALP", 組: { 鍵: "英名", 位: 1 } })]);
defineReturnCardSeed("S-M07-09-SORTPRIO-026", "026", [カ("A", 1000, "M0709-026-S9"), カ("B", 1000, "M0709-026-S1", { 言語: "EN" })], { 要る: ["言語JP<EN"] });
defineReturnCardSeed("S-M07-09-PRIOBLOCK-027", "027", [カ("A", 100, "M0709-027-S9"), カ("B", 3500, "M0709-027-S1")]);
defineReturnCardSeed("S-M07-09-PRIOSTATE-028", "028", [カ("A", 1000, "A01", { 言語: "EN" }), カ("B", 1000, "A01", { 状態: "HP" })], { 要る: ["言語JP<EN", "状態NM<HP"] });
defineReturnCardSeed("S-M07-09-PRIOFOIL-029", "029", [カ("A", 1000, "A01", { 札: 赤MF }), カ("B", 1000, "A01", { 状態: "HP" })], { 要る: ["状態NM<HP"] });
defineReturnCardSeed("S-M07-09-PRIOTAG-030", "030", [カ("A", 1000, "A01", { 略称: "BBB" }), カ("B", 1000, "A01", { 札: 赤MF })], { 要る: ["略称AAA<BBB"] });
defineReturnCardSeed("S-M07-09-PRIORAR-031", "031", [カ("A", 1000, "A01", { 札: 赤C }), カ("B", 1000, "A01", { 略称: "BBB" })], { 要る: ["略称AAA<BBB", "レアM<C"] });
defineReturnCardSeed("S-M07-09-PRIOCOLOR-032", "032", [カ("A", 1000, "A01", { 札: 青M }), カ("B", 1000, "A01", { 札: 赤C })], { 要る: ["レアM<C", "色赤<青"] });
defineReturnCardSeed("S-M07-09-PRIOCOLL-033", "033", [カ("A", 1000, "A01", { 略称: "COL", 組: { 鍵: "番号", 位: 1 } }), カ("B", 1000, "A01", { 札: 青M, 略称: "COL", 組: { 鍵: "番号", 位: 0 } })], { 要る: ["色赤<青"] });
defineReturnCardSeed("S-M07-09-PRIOALPHA-034", "034", [カ("A", 1000, "A01", { 略称: "ALP", 組: { 鍵: "英名", 位: 1 } }), カ("B", 1000, "A01", { 札: 青M, 略称: "ALP", 組: { 鍵: "英名", 位: 0 } })], { 要る: ["色赤<青"] });
defineReturnCardSeed("S-M07-09-DP-FOILLANG-040", "040", [カ("A", 1000, "M0709-040-S", { 札: 赤MF })]);

// 041〜070: シングルカード（棚は M0709-CBNNN-S の1つ。042・061 は S1・S2）
const CB = (n: string, A: Partial<品>, B: Partial<品>, 基準価格: number, o: { 棚?: [string, string] } = {}): 品[] => {
  const [sa, sb] = o.棚 ?? [`M0709-CB${n}-S`, `M0709-CB${n}-S`];
  return [カ("A", 基準価格, sa, A), カ("B", 基準価格, sb, B)];
};

defineReturnCardSeed("S-M07-09-CBTHRESH-041", "CB041", [カ("A", 100, "M0709-CB041-S", { 名札: "ZZZ" }), カ("B", 1000, "M0709-CB041-S", { 名札: "ZZZ" })]);
defineReturnCardSeed("S-M07-09-CBSHELF-042", "CB042", CB("042", {}, {}, 3500, { 棚: ["M0709-CB042-S1", "M0709-CB042-S2"] }), { 入庫済み: true });
defineReturnCardSeed("S-M07-09-CBLANG-043", "CB043", CB("043", { 札: 赤MF }, { 札: 赤MF, 言語: "EN" }, 100), { 要る: ["言語JP<EN"] });
defineReturnCardSeed("S-M07-09-CBSTATE-044", "CB044", CB("044", {}, { 状態: "HP" }, 100), { 入庫済み: true, 要る: ["状態NM<HP"] });
defineReturnCardSeed("S-M07-09-CBFOIL-045", "CB045", CB("045", {}, { 札: 赤MF }, 100));
defineReturnCardSeed("S-M07-09-CBTAG-046", "CB046", CB("046", {}, { 略称: "BBB" }, 100), { 入庫済み: true, 要る: ["略称AAA<BBB"] });
defineReturnCardSeed("S-M07-09-CBRARITY-047", "CB047", CB("047", {}, { 札: 赤C }, 100), { 要る: ["レアM<C"] });
defineReturnCardSeed("S-M07-09-CBCOLOR-048", "CB048", CB("048", {}, { 札: 青M }, 100), { 入庫済み: true, 要る: ["色赤<青"] });
defineReturnCardSeed("S-M07-09-CBCOLLNO-049", "CB049", CB("049", { 略称: "COL", 組: { 鍵: "番号", 位: 0 } }, { 略称: "COL", 組: { 鍵: "番号", 位: 1 } }, 100));
defineReturnCardSeed("S-M07-09-CBSAMEALL-050", "CB050", CB("050", {}, {}, 100), { 入庫済み: true });
defineReturnCardSeed("S-M07-09-CBSHELFFOIL-061", "CB061", CB("061", { 札: 赤MF }, { 札: 赤MF }, 1000, { 棚: ["M0709-CB061-S1", "M0709-CB061-S2"] }));
defineReturnCardSeed("S-M07-09-CBMIDFOIL-062", "CB062", CB("062", {}, { 札: 赤MF }, 1000), { 入庫済み: true });
defineReturnCardSeed("S-M07-09-CBHIGHSUP-063", "CB063", [カ("A", 3500, "M0709-CB063-S"), サ("B", "M0709-CB063-S")]);
defineReturnCardSeed("S-M07-09-CBHLANG-064", "CB064", CB("064", {}, { 言語: "EN" }, 3500), { 入庫済み: true, 要る: ["言語JP<EN"] });
defineReturnCardSeed("S-M07-09-CBHSTATE-065", "CB065", CB("065", {}, { 状態: "HP" }, 3500), { 要る: ["状態NM<HP"] });
defineReturnCardSeed("S-M07-09-CBHTAG-066", "CB066", CB("066", {}, { 略称: "BBB" }, 3500), { 入庫済み: true, 要る: ["略称AAA<BBB"] });
defineReturnCardSeed("S-M07-09-CBHRARITY-067", "CB067", CB("067", {}, { 札: 赤C }, 3500), { 要る: ["レアM<C"] });
defineReturnCardSeed("S-M07-09-CBHCOLOR-068", "CB068", CB("068", {}, { 札: 青M }, 3500), { 入庫済み: true, 要る: ["色赤<青"] });
defineReturnCardSeed("S-M07-09-CBHCOLLNO-069", "CB069", CB("069", { 略称: "COL", 組: { 鍵: "番号", 位: 0 } }, { 略称: "COL", 組: { 鍵: "番号", 位: 1 } }, 3500));
defineReturnCardSeed("S-M07-09-CBHSAME-070", "CB070", CB("070", {}, {}, 3500), { 入庫済み: true });
