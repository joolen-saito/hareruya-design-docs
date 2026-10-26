/**
 * エビデンスのキャプチャ（テストの中で撮る側）。
 *
 * caseTest（lib/case.ts）が、正本の手順の前後と期待結果の確かめのあとに自動で呼ぶ。テストコードから撮りたいとき
 * （手順の途中の画面を残したいとき）は、ケースの ctx.capture("ラベル") を使う。
 *
 * - 撮った画像は、名前「証跡:<場面>」の添付としてテストの結果に付く。エビデンスの書き出しは lib/evidence_reporter.ts。
 * - キャプチャは合否に関わらせない。撮れなかったとき（画面が閉じた など）は落とさず、撮れなかった理由を添付に残す。
 *   アニメーションの停止（animations: "disabled"）は使わない。止めると途中の transition を終わりまで進めて transitionend を起こし、
 *   画面の動き（ボタンが押せるようになる など）を撮らないときと変えてしまう。
 * - ブラウザの確認ダイアログ（alert・confirm）は画面に描かれないので撮れない。ダイアログの受け答えはテスト側の処理のまま。
 *   ここでダイアログの受け口を足すと、ダイアログが自動で閉じなくなり動きが変わるので足さない。
 *
 * 環境変数
 *   E2E_EVIDENCE=full（既定）  ページ全体を撮る。縦に長すぎる画面（E2E_EVIDENCE_MAX_HEIGHT、既定 8000px 超）は見えている範囲だけ
 *   E2E_EVIDENCE=viewport       見えている範囲だけ撮る
 *   E2E_EVIDENCE=off            撮らない（キャプチャが動きに影響していないかを切り分けるとき）
 *   E2E_EVIDENCE_FORMAT=png（既定）| jpeg
 */
import { Page, TestInfo } from "@playwright/test";

const MODE = (process.env.E2E_EVIDENCE || "full").toLowerCase();
if (!["full", "viewport", "off"].includes(MODE)) throw new Error(`E2E_EVIDENCE=${MODE} は未定義。使えるのは full / viewport / off`);
const FORMAT = (process.env.E2E_EVIDENCE_FORMAT || "png").toLowerCase() === "jpeg" ? "jpeg" : "png";
const MAX_HEIGHT = Number(process.env.E2E_EVIDENCE_MAX_HEIGHT || 8000);

export const EVIDENCE_PREFIX = "証跡:";

/** 場面の名前。レポーターはこの形で手順に振り分ける */
export const scene = {
  start: "開始時",
  step: (n: number) => `手順${n}`,
  stepLabel: (n: number, label: string) => `手順${n}:${label}`,
  expected: "期待結果",
  expectedLabel: (label: string) => `期待結果:${label}`,
};

export class EvidenceCamera {
  private seq = 0;
  constructor(private readonly page: Page, private readonly info: TestInfo) {}

  get enabled(): boolean {
    return MODE !== "off";
  }

  /** ケースの画面（同じブラウザセッションで開いている別タブも）を撮って添付する。失敗しても投げない */
  async shoot(sceneName: string): Promise<void> {
    if (!this.enabled) return;
    let pages: Page[];
    try {
      pages = this.page.isClosed() ? [] : this.page.context().pages().filter((p) => !p.isClosed());
    } catch {
      pages = [];
    }
    // ケースの画面を先に。about:blank（まだ何も開いていない）は撮らない
    pages = [this.page, ...pages.filter((p) => p !== this.page)].filter((p) => !p.isClosed() && p.url() !== "about:blank");
    if (pages.length === 0) return;
    for (const [i, p] of pages.entries()) {
      const name = `${EVIDENCE_PREFIX}${sceneName}${pages.length > 1 ? `#タブ${i + 1}` : ""}`;
      this.seq += 1;
      const file = this.info.outputPath(`evidence-${String(this.seq).padStart(3, "0")}.${FORMAT}`);
      try {
        const full = MODE === "full" && (await this.heightOf(p)) <= MAX_HEIGHT;
        await p.screenshot({ path: file, fullPage: full, type: FORMAT, quality: FORMAT === "jpeg" ? 80 : undefined, timeout: 15_000, caret: "initial" });
        await this.info.attach(name, { path: file, contentType: FORMAT === "jpeg" ? "image/jpeg" : "image/png" });
        await this.info.attach(`${name}:URL`, { body: p.url(), contentType: "text/plain" });
        if (MODE === "full" && !full) await this.info.attach(`${name}:注記`, { body: `画面が縦に長い（${MAX_HEIGHT}px 超）ので、見えている範囲だけ撮った`, contentType: "text/plain" });
      } catch (e) {
        const why = (e as Error).message.split("\n")[0];
        await this.info.attach(`${name}:撮れなかった`, { body: why, contentType: "text/plain" }).catch(() => {});
      }
    }
  }

  private async heightOf(p: Page): Promise<number> {
    try {
      return await p.evaluate(() => Math.max(document.documentElement?.scrollHeight ?? 0, document.body?.scrollHeight ?? 0));
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }
}
