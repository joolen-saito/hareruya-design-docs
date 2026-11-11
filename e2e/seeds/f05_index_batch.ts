/**
 * 検索サービス（ユニサーチ）の索引に載せる商品を、機能ごとにまとめて作り、まとめて1回だけフィードを送って反映を待つ仕組み（F05-02〜F05-04）。
 *
 * - フィードは全商品を送る重い処理で、送ってから公開側の検索に出るまで6分ほどかかる（e2e/.runs/unisearch_dev_brief.md）。
 *   ケースごとに送らず、1回の起動（Playwright のプロセス）の中で、その機能の索引用のシードを最初に使うケースが来たときに、
 *   その機能の索引用のシード「すべて」の商品をまとめて作り、1回だけ送り、反映を待つ。以後のケースは作ったものを使う。
 *   （シード表はケース専用と定めるが、作る商品は実行の印つきで、ケースごとに別の商品・カテゴリ・タグなので、ケースどうしは混ざらない）
 * - 流すときは、その機能のケースを1回の起動にまとめる（PW_BATCH をケース数以上に）と、送るのが1回で済む。
 * - まとめて作る時間（商品の数による）と反映の待ち（最大30分）があるので、最初のケースの制限時間をその分だけ延ばす。
 */
import { Browser, BrowserContext, test } from "@playwright/test";
import { Notes } from "../lib/notes";
import { reportSeedIssue } from "../lib/seeds";
import { ネット買取の検索結果 } from "../pages/front/f05_purchase_results";
import { フィードを送る, 索引への反映を待つ } from "../pages/admin/unisearch_feed";

/** 反映を確かめる目印: このアドレスの一覧に、この商品名の行が出ること */
export type 反映の目印 = { パス: string; 商品名: string };

export type まとめの結果 = {
  /** シード表の呼び名に控える値 */
  控え?: [string, string][];
  目印?: 反映の目印;
  /** 反映を確かめたあとに行う画面の操作（索引の値と画面の値を違えるケースなど） */
  反映のあと?: () => Promise<void>;
};
type 作り方 = (c: { browser: Browser; notes: Notes; issue: (m: string) => void }) => Promise<まとめの結果>;

export class 索引のまとめ {
  private readonly 作り方 = new Map<string, 作り方>();
  private readonly 結果 = new Map<string, まとめの結果>();
  private 進行: Promise<void> | null = null;

  constructor(readonly 名前: string, readonly 延ばす分 = 120 * 60_000) {}

  足す(seedId: string, f: 作り方): void {
    if (this.作り方.has(seedId)) throw new Error(`${seedId} の作り方が二重に足された`);
    this.作り方.set(seedId, f);
  }

  /** シードの作り方から呼ぶ: まだなら全部まとめて作って送り、反映を待つ。そのシードの控えを notes に入れる */
  async 用意する(seedId: string, browser: Browser, notes: Notes): Promise<void> {
    if (!this.進行) {
      test.info().setTimeout(test.info().timeout + this.延ばす分);
      this.進行 = this.全部作って送る(browser, notes);
    }
    await this.進行;
    const err = this.失敗.get(seedId);
    if (err) throw new Error(`${seedId}: まとめて作ったときに、このシードの商品を作れなかった（${err}）`);
    const r = this.結果.get(seedId);
    if (!r) throw new Error(`${seedId}: まとめて作った中に、このシードの結果が無い`);
    for (const [k, v] of r.控え ?? []) notes.set(k, v);
  }

  private readonly 失敗 = new Map<string, string>();

  private async 全部作って送る(browser: Browser, notes: Notes): Promise<void> {
    // 1つのシードで止まっても、ほかのシードの商品は作って送る（止まったシードを使うケースだけが、そのエラーで止まる）
    for (const [id, f] of this.作り方) {
      try {
        this.結果.set(id, await f({ browser, notes, issue: (m) => reportSeedIssue(id, m) }));
      } catch (e) {
        this.失敗.set(id, (e as Error).message.split("\n")[0]);
      }
    }
    if (this.結果.size === 0) throw new Error(`${this.名前}: 索引用のシードを1つも作れなかった（${[...this.失敗.entries()].map(([k, v]) => `${k}: ${v}`).join(" / ")}）`);
    const 目印 = [...this.結果.values()].map((r) => r.目印).filter((m): m is 反映の目印 => !!m);
    const 選んだ = [...new Set([目印[0], 目印[Math.floor(目印.length / 2)], 目印[目印.length - 1]])].filter(Boolean);
    const 開始 = await フィードを送る(browser);
    await 索引への反映を待つ(browser, async (ctx: BrowserContext) => {
      const 様子: string[] = [];
      for (const m of 選んだ) {
        const page = await ctx.newPage();
        const r = new ネット買取の検索結果(page);
        await r.開く(m.パス);
        await r.結果を待つ().catch(() => undefined);
        const names = (await r.行を読む()).map((x) => x.商品名);
        if (!names.includes(m.商品名)) 様子.push(`${m.パス} に ${m.商品名} がまだ無い（出ている行: ${names.length}件）`);
        await page.close();
      }
      return { ok: 様子.length === 0, 様子: 様子.join(" / ") };
    }, { 何を: `${this.名前}の商品の索引への反映` });
    for (const [id, r] of this.結果) {
      reportSeedIssue(id, `${this.名前}: 索引用の商品を（この機能の索引用のシードの分をまとめて）画面で作り、商品管理のユニサーチフィード作成で ${開始.toISOString()} に送り、公開側の検索に出たことを確かめた（目印: ${選んだ.map((m) => m.商品名).join("、")}）`);
      if (r.反映のあと) await r.反映のあと();
    }
  }
}
