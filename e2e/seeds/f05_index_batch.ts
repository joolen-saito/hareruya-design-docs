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
import fs from "node:fs";
import path from "node:path";
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
  /** 目印のほかに確かめる目印（店ごとの一覧など。確かめ方を渡したまとめでだけ使う） */
  ほかの目印?: 反映の目印[];
  /** 反映を確かめたあとに行う画面の操作（索引の値と画面の値を違えるケースなど） */
  反映のあと?: () => Promise<void>;
};
type 作り方 = (c: { browser: Browser; notes: Notes; issue: (m: string) => void }) => Promise<まとめの結果>;

/**
 * 作った結果を、1回の流し（E2E_SEED_RUN_ID。tools/pw_run.sh が呼び出しごとに与える）の中で、Playwright のプロセスをまたいで使い回す設定。
 * Playwright はケースが落ちるとワーカーのプロセスを作り直し、PW_BATCH のまとまりごとにも起動し直す。持ち越さないと、
 * 新しいプロセスの最初のケースで、まとめて作るところから（F05-03 では約1時間）やり直していた（2026-11-13 の開発環境の流し: 007 が 2.5時間・008 が 1.0時間）。
 * - 結果は .runs/index_batch/<回>-<名前>.json に書く（作れた・作れなかった・控え・目印と、機能が書き出す中身）。
 *   同じ回の次のプロセスは、それを読んで作らずに使う。まとめが作れなかった（反映が来ないなど）ときは、その理由を書き、
 *   同じ回の残りのケースは作り直さずに、すぐ同じ理由で事前準備で止める（未判定）。
 * - 同じ回で、ほかのプロセスが作っている間は、作り終わるのを待つ（同時に2組作らない）。
 */
export type 持ち越し = {
  /** ファイルの名に使う短い名前（例: f05-03） */
  名: string;
  /** 機能のシードが持つ、作ったものの控え（JSON にできる値） */
  書き出す: () => unknown;
  /** 書き出したものを読み込む（別のプロセスで、作らずに使うとき） */
  読み込む: (x: unknown) => void;
};

/** まとめの時間の上限（どれも省略すると、これまでどおり） */
export type まとめの上限 = {
  /** 商品を作る時間の上限。過ぎたら残りのシードは作らない（作れなかった扱い） */
  作る分?: number;
  /** 続けてこの数のシードが落ちたら、残りは作らない（同じ原因で全部が落ちるときに、1つずつ時間切れを待たない） */
  続けて落ちたら?: number;
  /** フィードが実行中のときに、送れるまで待つ上限 */
  送る分?: number;
  /** 送ってから公開側の検索に出るまで待つ上限 */
  反映の分?: number;
};

/**
 * 反映の確かめ方（省略すると、ネット買取の検索結果に目印の3つが出ること）。渡すと、すべてのシードの目印（ほかの目印を含む）を渡す。
 * F03-07 のように、ネット買取でない公開側の一覧に出ることを確かめる機能が使う。
 */
export type 反映の確かめ方 = (ctx: BrowserContext, 目印: 反映の目印[]) => Promise<{ ok: boolean; 様子: string }>;

type 書いたもの = {
  回: string; 名前: string; 日時: string; 状態: "済み" | "失敗"; 理由?: string;
  結果: [string, { 控え?: [string, string][]; 目印?: 反映の目印 }][];
  失敗: [string, string][];
  /** シードごとの報告（エビデンスの「シードの注記」。戻すときに同じ文を出す） */
  報告: [string, string[]][];
  中身?: unknown;
};

const 持ち越しの場所 = path.resolve(__dirname, "..", ".runs", "index_batch");
const 回 = () => (process.env.E2E_SEED_RUN_ID ?? "").trim();
const 生きている = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };

export class 索引のまとめ {
  private readonly 作り方 = new Map<string, 作り方>();
  private readonly 結果 = new Map<string, まとめの結果>();
  private 進行: Promise<void> | null = null;
  private readonly 報告の控え = new Map<string, string[]>();

  constructor(
    readonly 名前: string, readonly 延ばす分 = 120 * 60_000, private readonly 持ち越し?: 持ち越し, private readonly 上限: まとめの上限 = {},
    private readonly 確かめ方?: 反映の確かめ方,
  ) {}

  private ファイル(拡張子: "json" | "lock"): string | null {
    const r = 回();
    if (!this.持ち越し || !r) return null;
    return path.join(持ち越しの場所, `${r.replace(/[^0-9A-Za-z_.-]/g, "_")}-${this.持ち越し.名}.${拡張子}`);
  }

  private 読む(): 書いたもの | null {
    const f = this.ファイル("json");
    if (!f || !fs.existsSync(f)) return null;
    try { return JSON.parse(fs.readFileSync(f, "utf8")) as 書いたもの; } catch { return null; }
  }

  private 書く(状態: "済み" | "失敗", 理由?: string): void {
    const f = this.ファイル("json");
    if (!f) return;
    const w: 書いたもの = {
      回: 回(), 名前: this.名前, 日時: new Date().toISOString(), 状態, 理由,
      結果: [...this.結果].map(([id, r]) => [id, { 控え: r.控え, 目印: r.目印 }]),
      失敗: [...this.失敗],
      報告: [...this.報告の控え],
      中身: 状態 === "済み" ? this.持ち越し!.書き出す() : undefined,
    };
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(`${f}.tmp`, JSON.stringify(w, null, 1));
    fs.renameSync(`${f}.tmp`, f);
  }

  /** 書いたものから戻す。まとめが作れなかった回なら、その理由で投げる */
  private 戻す(w: 書いたもの): void {
    if (w.状態 === "失敗") throw new Error(`${this.名前}: この回（${w.回}）の中で、索引用のシードのまとめがすでに作れなかったので作り直さない（早く諦める。${w.日時}）。そのときのエラー: ${w.理由 ?? "不明"}`);
    for (const [id, r] of w.結果) this.結果.set(id, r);
    for (const [id, m] of w.失敗) this.失敗.set(id, m);
    this.持ち越し!.読み込む(w.中身);
    for (const [id, ms] of w.報告 ?? []) {
      for (const m of ms) reportSeedIssue(id, m);
      if (this.結果.has(id)) reportSeedIssue(id, `${this.名前}: この回（${w.回}）の前の Playwright のプロセスが ${w.日時} までに作って索引に載せた商品を、作り直さずに使った（ケースが落ちるとプロセスが作り直されるため。.runs/index_batch/ の控え）`);
    }
  }

  /** 同じ回のほかのプロセスが作っているなら、終わるまで待って戻す。誰も作っていなければ、作る役を取って false を返す */
  private async 待つか取る(): Promise<boolean> {
    const lock = this.ファイル("lock");
    if (!lock) return false;
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    const t0 = Date.now();
    for (;;) {
      const w = this.読む();
      if (w) { this.戻す(w); return true; }
      try {
        fs.writeFileSync(lock, `${process.pid}\t${new Date().toISOString()}`, { flag: "wx" });
        return false;
      } catch {
        const pid = Number(fs.readFileSync(lock, "utf8").split("\t")[0]);
        // 作っていたプロセスが居なくなった（時間切れで止められたなど）なら、作る役を引き継ぐ
        if (!pid || !生きている(pid)) { fs.rmSync(lock, { force: true }); continue; }
      }
      if (Date.now() - t0 > this.延ばす分) throw new Error(`${this.名前}: 同じ回のほかのプロセスが索引用のシードを作り終わらない（${Math.round(this.延ばす分 / 60000)} 分待った）`);
      await new Promise((r) => setTimeout(r, 30_000));
    }
  }

  足す(seedId: string, f: 作り方): void {
    if (this.作り方.has(seedId)) throw new Error(`${seedId} の作り方が二重に足された`);
    this.作り方.set(seedId, f);
  }

  /** シードの作り方から呼ぶ: まだなら全部まとめて作って送り、反映を待つ。そのシードの控えを notes に入れる */
  async 用意する(seedId: string, browser: Browser, notes: Notes): Promise<void> {
    if (!this.進行) {
      const w = this.持ち越し ? this.読む() : null;
      if (w) {
        this.進行 = Promise.resolve().then(() => this.戻す(w));
      } else {
        test.info().setTimeout(test.info().timeout + this.延ばす分);
        this.進行 = this.待つか取る().then(async (戻した) => {
          if (戻した) return;
          try {
            await this.全部作って送る(browser, notes);
            this.書く("済み");
          } catch (e) {
            this.書く("失敗", (e as Error).message.split("\n")[0]);
            throw e;
          } finally {
            const lock = this.ファイル("lock");
            if (lock) fs.rmSync(lock, { force: true });
          }
        });
      }
    }
    await this.進行;
    const err = this.失敗.get(seedId);
    if (err) throw new Error(`${seedId}: まとめて作ったときに、このシードの商品を作れなかった（${err}）`);
    const r = this.結果.get(seedId);
    if (!r) throw new Error(`${seedId}: まとめて作った中に、このシードの結果が無い`);
    for (const [k, v] of r.控え ?? []) notes.set(k, v);
  }

  private readonly 失敗 = new Map<string, string>();

  private 報告(id: string, m: string): void {
    this.報告の控え.set(id, [...(this.報告の控え.get(id) ?? []), m]);
    reportSeedIssue(id, m);
  }

  private async 全部作って送る(browser: Browser, notes: Notes): Promise<void> {
    // 1つのシードで止まっても、ほかのシードの商品は作って送る（止まったシードを使うケースだけが、そのエラーで止まる）。
    // ただし、作る時間の上限を過ぎたとき・続けて落ちたとき（同じ原因で全部が落ちるとき）は、残りを作らずに打ち切る
    const t0 = Date.now();
    let 続けて = 0;
    let 打ち切り = "";
    for (const [id, f] of this.作り方) {
      if (!打ち切り && this.上限.作る分 !== undefined && Date.now() - t0 > this.上限.作る分) 打ち切り = `作る時間の上限（${Math.round(this.上限.作る分 / 60000)} 分）を過ぎたので作らなかった`;
      if (!打ち切り && this.上限.続けて落ちたら !== undefined && 続けて >= this.上限.続けて落ちたら) 打ち切り = `前の ${続けて} 個のシードが続けて落ちたので作らなかった（同じ原因とみて打ち切った。最後のエラー: ${[...this.失敗.values()].pop()}）`;
      if (打ち切り) { this.失敗.set(id, 打ち切り); continue; }
      try {
        this.結果.set(id, await f({ browser, notes, issue: (m) => this.報告(id, m) }));
        続けて = 0;
      } catch (e) {
        this.失敗.set(id, (e as Error).message.split("\n")[0]);
        続けて++;
      }
    }
    if (this.結果.size === 0) throw new Error(`${this.名前}: 索引用のシードを1つも作れなかった（${[...this.失敗.entries()].map(([k, v]) => `${k}: ${v}`).join(" / ")}）`);
    const 目印 = [...this.結果.values()].map((r) => r.目印).filter((m): m is 反映の目印 => !!m);
    const 選んだ = this.確かめ方
      ? [...this.結果.values()].flatMap((r) => [r.目印, ...(r.ほかの目印 ?? [])]).filter((m): m is 反映の目印 => !!m)
      : [...new Set([目印[0], 目印[Math.floor(目印.length / 2)], 目印[目印.length - 1]])].filter(Boolean);
    const 開始 = await フィードを送る(browser, { 待つ上限ミリ秒: this.上限.送る分 });
    const 確かめ方 = this.確かめ方;
    if (確かめ方) await 索引への反映を待つ(browser, (ctx: BrowserContext) => 確かめ方(ctx, 選んだ), { 何を: `${this.名前}の商品の索引への反映`, 上限ミリ秒: this.上限.反映の分 });
    else await 索引への反映を待つ(browser, async (ctx: BrowserContext) => {
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
    }, { 何を: `${this.名前}の商品の索引への反映`, 上限ミリ秒: this.上限.反映の分 });
    for (const [id, r] of this.結果) {
      const 自分の目印 = this.確かめ方 ? [r.目印, ...(r.ほかの目印 ?? [])].filter((m): m is 反映の目印 => !!m) : 選んだ;
      this.報告(id, `${this.名前}: 索引用の商品を（この機能の索引用のシードの分をまとめて）画面で作り、商品管理のユニサーチフィード作成で ${開始.toISOString()} に送り、公開側の検索に出たことを確かめた（目印: ${自分の目印.map((m) => `${m.パス ? `${m.パス} の` : ""}${m.商品名}`).join("、")}）`);
      if (r.反映のあと) await r.反映のあと();
    }
  }
}
