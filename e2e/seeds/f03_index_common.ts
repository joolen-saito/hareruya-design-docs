/**
 * F03 の「検索サービスの索引に載った商品」が要るシードの共通の作り方（シードの作り方そのものではない。各機能のシードが呼ぶ）。
 *
 * - 依頼者の決定（2026-11-11 夜）: 開発環境で検索サービス（ユニサーチ）へのフィード連携をしてよい。フィードは全商品を送る重い処理なので、
 *   1つの機能の実行で送るのは1回にする（共通の決まり e2e/.runs/unisearch_dev_brief.md）。
 * - そのため、機能の索引用の商品は「組」（シード1つ分の商品のまとまり）ごとに作り方を並べておき、最初にどれかの索引用シードが呼ばれたときに、
 *   全部の組をまとめて作り、フィードを1回だけ送り、全部の組が公開側の検索に出るまで待つ。結果はワーカーの中で使い回す
 *   （同じ実行の2件目以降のケースは待たない）。1つの組を作るのに失敗しても、ほかの組は続ける（失敗した組のシードだけが止まる）。
 * - 組の作り方で出た注記は組ごとに控え、その組のシードの注記に出す。
 * - 実行の1件目は、全部の組を作る時間（数十分）とフィードの反映待ち（6〜30分）がかかるので、ケースの時間の上限を延ばす。
 *   機能の索引用のケースは、1回の起動（PW_BATCH を件数以上）でまとめて流すと、フィードが1回で済む。
 */
import { Browser, BrowserContext, test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { Issue, 作った索引の商品, 索引の商品, 索引の商品を作る } from "../pages/admin/f03_index_seed";
import { フィードを送る, 索引への反映を待つ } from "../pages/admin/unisearch_feed";
import { FrontProductList } from "../pages/front/f03_01_product_list";
import { Page } from "@playwright/test";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";

/** 公開側の検索で確かめる組（店の入口・検索語・出るはずの商品コード） */
export type 反映の確かめ = { 店: "/ja" | "/ja/osaka"; 検索語: string; 商品コード: string[] };

export type 索引の組 = {
  /** 組の名前（シードID） */
  名前: string;
  /** 作る商品（前の準備のあとで決まる値があれば、前の準備の結果から作る）。グッズ商品CSV登録で作る */
  商品?: (前: Record<string, string>) => 索引の商品[];
  /** 商品をほかの作り方（カード商品CSV登録など）で作るとき。商品コード → 作った商品 を返す（確かめ も書く） */
  作る?: (browser: Browser, issue: Issue) => Promise<Map<string, 作った索引の商品>>;
  /** 商品の前に画面で作るもの（タグ・カテゴリなど）。控える値を返す */
  前の準備?: (page: Page, issue: Issue) => Promise<Record<string, string>>;
  /** 商品を作ったあとの画面の操作（索引へ送る前） */
  後の準備?: (browser: Browser, made: Map<string, 作った索引の商品>, 前: Record<string, string>, issue: Issue) => Promise<void>;
  /** 反映を待つ検索（省略すると、組の1件目の本店公開の商品を商品名で本店の検索） */
  確かめ?: (前: Record<string, string>) => 反映の確かめ[];
};

export type 組の結果 = { 商品: Map<string, 作った索引の商品>; 前: Record<string, string>; 注記: string[]; 誤り?: string };

const 上限 = 180 * 60_000;

export class 索引のまとめ {
  private 作成: Promise<Map<string, 組の結果>> | null = null;
  private 済み: Map<string, 組の結果> | null = null;
  constructor(readonly 機能: string, readonly 組: 索引の組[]) {}

  /** その組の結果を返す（まだならまとめて作って送って待つ）。組の注記をシードの注記に出す。組が失敗していたら投げる */
  async 用意する(browser: Browser, seedId: string, 組名 = seedId): Promise<組の結果> {
    test.info().setTimeout(Math.max(test.info().timeout, 上限));
    if (!this.作成) this.作成 = this.作る(browser);
    const all = await this.作成;
    this.済み = all;
    const r = all.get(組名);
    if (!r) throw new Error(`${this.機能} の索引用の組に ${組名} が無い`);
    for (const m of r.注記) reportSeedIssue(seedId, m);
    if (r.誤り) throw new Error(r.誤り);
    return r;
  }

  /** ケースから: その組で作った商品（商品コードは実際の値）。シードが済んでいなければ投げる */
  作った(組名: string, 商品コード: string): 作った索引の商品 {
    const p = this.済み?.get(組名)?.商品.get(商品コード);
    if (!p) throw new Error(`${組名} の商品 ${商品コード} はまだ作っていない`);
    return p;
  }

  private async 作る(browser: Browser): Promise<Map<string, 組の結果>> {
    const out = new Map<string, 組の結果>();
    for (const g of this.組) {
      const r: 組の結果 = { 商品: new Map(), 前: {}, 注記: [] };
      out.set(g.名前, r);
      const issue: Issue = (m) => r.注記.push(m);
      try {
        if (g.前の準備) {
          r.前 = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return g.前の準備!(page, issue); });
        }
        r.商品 = g.作る ? await g.作る(browser, issue) : await 索引の商品を作る(browser, g.名前, g.商品!(r.前), issue);
        if (g.後の準備) await g.後の準備(browser, r.商品, r.前, issue);
      } catch (e) {
        r.誤り = `${g.名前} の商品を画面で作る途中で止まった: ${String(e).slice(0, 1500)}`;
      }
    }
    const ok = this.組.filter((g) => !out.get(g.名前)!.誤り);
    if (ok.length === 0) return out;
    const 確かめ = ok.flatMap((g) => {
      const r = out.get(g.名前)!;
      return (g.確かめ ? g.確かめ(r.前) : 既定の確かめ(g, r.前)).map((c) => ({ 組: g.名前, ...c, 商品ID: c.商品コード.map((code) => 商品IDの(r, code)) }));
    });
    try {
      const 送った = await フィードを送る(browser);
      for (const g of ok) out.get(g.名前)!.注記.push(`商品管理「ユニサーチフィード作成」で「フィードファイルを更新する」を押して検索サービスへ送った（${送った.toLocaleString("ja-JP")}。${this.機能} の索引用の組 ${ok.length} 件をまとめて1回）`);
      const t0 = Date.now();
      await 索引への反映を待つ(browser, (ctx) => 反映したか(ctx, 確かめ), { 何を: `${this.機能} の索引用の商品の、公開側の検索への反映` });
      for (const g of ok) out.get(g.名前)!.注記.push(`公開側の検索に出るまで約 ${Math.round((Date.now() - t0) / 60_000)} 分待った（確かめた検索: ${確かめ.filter((c) => c.組 === g.名前).map((c) => `${c.店} で「${c.検索語}」`).join("、")}）`);
    } catch (e) {
      for (const g of ok) out.get(g.名前)!.誤り = `検索サービスへの送信か反映の待ちで止まった: ${String(e).slice(0, 1500)}`;
    }
    return out;
  }
}

/**
 * 既定の確かめ: 組の1件目の商品（本店公開）が、商品名で本店の検索に出るか。
 * 禁止カード・在庫0・英語などの商品は、既定の検索条件では出ないことがある（それ自体をケースが確かめる）ので、反映の目印には1件目だけを使う。
 * フィードは全商品を1つのファイルで送るので、1件目が出れば同じ組の商品も索引に載っている。
 */
function 既定の確かめ(g: 索引の組, 前: Record<string, string>): 反映の確かめ[] {
  const first = (g.商品 ? g.商品(前) : []).find((i) => (i.本店 ?? "公開") === "公開");
  return first ? [{ 店: "/ja", 検索語: first.商品名, 商品コード: [first.商品コード] }] : [];
}

/** 公開側の検索（キーワード）で、出るはずの商品が全部出ているか。商品コードは商品IDに置き換えて、商品カードの商品IDで見る */
async function 反映したか(ctx: BrowserContext, 確かめ: (反映の確かめ & { 組: string; 商品ID: string[] })[]): Promise<{ ok: boolean; 様子: string }> {
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  const list = new FrontProductList(page);
  // 送った順の最後の組から確かめる（最後まで出ていれば、前の組も出ていることが多い）
  for (const c of [...確かめ].reverse()) {
    try {
      await list.openKeyword(c.店, c.検索語);
    } catch (e) {
      return { ok: false, 様子: `${c.店} で「${c.検索語}」の検索を開けない（${String(e).slice(0, 200)}）` };
    }
    const shown = new Set((await list.カードを読む()).map((x) => x.商品ID));
    const missing = c.商品ID.filter((id) => !shown.has(id));
    if (missing.length) return { ok: false, 様子: `${c.店} で「${c.検索語}」の検索に、商品ID ${missing.join("・")} がまだ出ない（出ている商品ID: ${[...shown].join("・") || "なし"}）` };
  }
  return { ok: true, 様子: "" };
}

/** 組の商品コードから、作った商品の商品IDを引く */
export function 商品IDの(r: 組の結果, 商品コード: string): string {
  const p = r.商品.get(商品コード);
  if (!p) throw new Error(`商品コード ${商品コード} の商品を作っていない`);
  return p.商品ID;
}

/**
 * シード表が控えると定めた呼び名（〔商品ID-F0303-008A〕など。範囲「A〜C」の中間はシード表に名前で出てこないので控えない）を、作った商品から控える。
 * 末尾の英字は商品コードの並び順（A が1件目）。英字の無い呼び名は1件目。商品・規格・カード属性（カード詳細）・商品レコード以外の呼び名は extra で渡す。
 */
export function 呼び名を控える(seedId: string, notes: Notes, r: 組の結果, codes: string[], extra: Record<string, string> = {}): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (label.includes("…")) continue;
    if (extra[label] !== undefined) { notes.set(label, extra[label]); continue; }
    const m = /^〔(商品ID|商品規格ID|カード属性ID|商品レコードID)-F030\d-(?:[A-Z]+)?\d{3}([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const i = m[2] ? m[2].charCodeAt(0) - 65 : 0;
    const p = r.商品.get(codes[i] ?? "");
    if (!p) throw new Error(`${seedId}: ${label} に当たる ${i + 1} 件目の商品を作っていない`);
    const v = m[1] === "商品規格ID" ? p.商品規格ID : m[1] === "カード属性ID" ? p.カード詳細ID : p.商品ID;
    if (!v) throw new Error(`${seedId}: ${label} の値が無い`);
    notes.set(label, v);
  }
}
