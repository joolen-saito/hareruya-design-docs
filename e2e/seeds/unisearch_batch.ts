/**
 * 検索サービス（ユニサーチ）の索引に載せる商品を、1回の起動の中でまとめて作り、フィードを1回だけ送って、まとめて反映を待つ取り次ぎ。
 *
 * - 決まり（e2e/.runs/unisearch_dev_brief.md）: フィードは全商品を送る重い処理なので、1機能の実行で送るのはなるべく1回。
 *   索引に載せたい商品は、機能ごとに1つの「束」にまとめ、どのシードから呼ばれても最初の1回だけ「作る→送る→反映を待つ」を行う。
 *   2回目からは、最初の1回の結果（作った商品の番号など）を返す。最初の1回が失敗したら、その失敗をそのまま返す（作り直して同じ商品を二重に作らない）。
 * - 作るものは実行の印つきの新しいデータだけ（共有の既存データは書き換えない）。
 * - 反映の確かめ（反映した）は、公開側の画面で、作った商品が検索に出るかを見る。新しいブラウザの場で1分ごとに呼ばれる（上限30分）。
 */
import { Browser, BrowserContext } from "@playwright/test";
import { フィードを送って反映を待つ } from "../pages/admin/unisearch_feed";

export type 反映の様子 = { ok: boolean; 様子: string };

export class 索引の束<T> {
  private p: Promise<T> | null = null;

  constructor(
    readonly 名前: string,
    private readonly 作る: (browser: Browser) => Promise<T>,
    private readonly 反映した: (ctx: BrowserContext, r: T) => Promise<反映の様子>,
  ) {}

  /** 最初の1回だけ作って送って待つ。front は公開側を開くブラウザ（スマホの端末の機能でも PC の画面で確かめるため、呼ぶ側が選ぶ） */
  用意する(browser: Browser, front: Browser = browser): Promise<T> {
    if (!this.p) {
      this.p = (async () => {
        const r = await this.作る(browser);
        await フィードを送って反映を待つ(front, (ctx) => this.反映した(ctx, r), `${this.名前}の商品の検索サービスの索引への反映`);
        return r;
      })();
    }
    return this.p;
  }
}

/** 束を用意したことの注記（どのシードからでも同じ文） */
export const 束の注記 = (名前: string): string =>
  `${名前}の商品は、この実行の印つきで画面から作り、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で1回だけ送って、公開側の検索に出るまで待った（索引に載せる商品を機能ごとにまとめ、1回の起動で送るのは1回にする。開発環境で送ってから出るまで6分ほど）`;
