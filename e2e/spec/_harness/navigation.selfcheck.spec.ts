/**
 * ハーネス自己検査: 画面到達ヘルパー（helpers/navigation.ts）と到達台帳の整合。
 *
 * 稼働中アプリを必要としない（page フィクスチャを使わない）ため、
 * 資格情報・シード・接続先が無い状態でも常に実行できる。
 * 台帳の壊れ（列欠落・未知の到達クラス・根拠欠落）と、
 * パス照合の要件（プレフィックス剥がし・{param} 一致・最長一致）を守る。
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { guardPage, guardContext } from "../../fixtures/reachability.fixture";
import {
  loadReachability,
  lookupReachability,
  normalizePath,
  directAccessExpectation,
  step,
  directAccess,
} from "../../helpers/navigation";

const KNOWN_CLASSES = [
  "entry-direct",
  "transition-only",
  "action-endpoint",
  "要確認",
  "非画面(API/バッチ)",
];

/** ブラウザ不要の最小 page スタブ（goto 封鎖・分類判定のみを検証する）。 */
function stubPage(): Page & { gotoCalls: string[] } {
  const calls: string[] = [];
  const p = {
    gotoCalls: calls,
    goto: async (url: string) => {
      calls.push(url);
      return null;
    },
  };
  return p as unknown as Page & { gotoCalls: string[] };
}

test.describe("harness: 画面到達台帳", () => {
  test("台帳が読め、全行が既知の到達クラスと根拠を持つ", () => {
    const entries = loadReachability();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(KNOWN_CLASSES, `未知の到達クラス: ${e.fid} ${e.path} = ${e.klass}`).toContain(e.klass);
      expect(e.fid, `機能ID欠落: ${e.path}`).not.toBe("");
      expect(e.evidence, `根拠(file:line)欠落: ${e.fid} ${e.path}`).not.toBe("");
      expect(e.status, `確定状態欠落: ${e.fid} ${e.path}`).not.toBe("");
    }
  });

  test("transition-only 行は正規到達経路を持つ", () => {
    for (const e of loadReachability().filter((x) => x.klass === "transition-only")) {
      expect(e.route, `正規到達経路が空: ${e.fid} ${e.path}`).not.toBe("");
      expect(e.route, `正規到達経路に遷移が無い: ${e.fid} ${e.path}`).toContain(">");
    }
  });
});

test.describe("harness: パス正規化と照合", () => {
  test("normalizePath がロケール・クエリ・末尾スラッシュを落とす", () => {
    expect(normalizePath("/{_locale}/shopping/complete")).toBe("/shopping/complete");
    expect(normalizePath("http://localhost:8080/ja/cart?foo=1")).toBe("/ja/cart");
    expect(normalizePath("/cart/")).toBe("/cart");
  });

  test("実URLのロケールプレフィックスを剥がして台帳に当たる", () => {
    expect(lookupReachability("/ja/shopping/complete")?.klass).toBe("transition-only");
    expect(lookupReachability("/ja/cart")?.klass).toBe("entry-direct");
  });

  test("{param} を含む台帳行が実IDに一致する", () => {
    expect(lookupReachability("/ja/shopping/delivery/12/edit")?.path).toBe(
      "/shopping/delivery/{id}/edit"
    );
  });

  test("最長一致が優先される（/shopping より /shopping/complete）", () => {
    expect(lookupReachability("/ja/shopping/complete")?.path).toBe("/shopping/complete");
  });

  test("未登録パスは undefined（推測で判定しない）", () => {
    expect(lookupReachability("/ja/no/such/screen")).toBeUndefined();
  });

  test("未設定のプレフィックスは剥がさない（別画面への誤マッチを起こさない）", () => {
    // 先頭セグメントを無条件に剥がすと /shopping/complete と同一視してしまう。
    expect(lookupReachability("/x/y/shopping/complete")).toBeUndefined();
    expect(lookupReachability("/other/cart")).toBeUndefined();
  });
});

test.describe("harness: 到達強制", () => {
  test("step() の action 内で page.goto を呼ぶと失敗する", async () => {
    const page = stubPage();
    await expect(
      step(page, "「購入手続きへ」", async () => {
        await page.goto("/ja/shopping");
      })
    ).rejects.toThrow(/遷移「「購入手続きへ」」の中で page\.goto/);
    expect(page.gotoCalls).toEqual([]);
  });

  test("step() は封鎖を必ず解除する（後続の到達を妨げない）", async () => {
    const page = stubPage();
    await step(page, "「注文する」", async () => {
      /* 画面上の操作 */
    });
    await page.goto("/ja/cart");
    expect(page.gotoCalls).toEqual(["/ja/cart"]);
  });

  test("directAccess() は起点画面には使えない（enter に誘導する）", async () => {
    const page = stubPage();
    await expect(
      directAccess(page, "/ja/cart", "直アクセスの検証をしたい")
    ).rejects.toThrow(/起点画面/);
  });

  test("directAccess() は理由が無いと失敗する", async () => {
    const page = stubPage();
    await expect(directAccess(page, "/ja/shopping/complete", "")).rejects.toThrow(/理由/);
  });

  test("directAccess() は遷移必須画面には理由付きで通る", async () => {
    const page = stubPage();
    await directAccess(page, "/ja/shopping/complete", "受注IDなしでトップへ戻ることの検証");
    expect(page.gotoCalls).toEqual(["/ja/shopping/complete"]);
  });
});

test.describe("harness: フィクスチャの到達強制", () => {
  test("guardPage() は遷移必須画面への goto を止める", async () => {
    const page = guardPage(stubPage());
    await expect(page.goto("/ja/shopping/complete")).rejects.toThrow(/遷移必須画面/);
  });

  test("guardPage() は到達クラス未確定の画面への goto も止める", async () => {
    const page = guardPage(stubPage());
    await expect(page.goto("/ja/shopping/delivery/new/edit")).rejects.toThrow(/未確定/);
  });

  test("guardPage() は起点画面の goto を通す", async () => {
    const page = guardPage(stubPage()) as ReturnType<typeof stubPage>;
    await page.goto("/ja/cart");
    expect(page.gotoCalls).toEqual(["/ja/cart"]);
  });

  test("guardContext() は後から生まれる Page（ポップアップ/newPage）も守る", async () => {
    const later = stubPage();
    let handler: ((p: Page) => void) | undefined;
    const context = {
      pages: () => [] as Page[],
      on: (event: string, cb: (p: Page) => void) => {
        if (event === "page") handler = cb;
      },
    } as unknown as BrowserContext;

    guardContext(context);
    expect(handler).toBeDefined();
    handler!(later);
    await expect(later.goto("/ja/shopping/complete")).rejects.toThrow(/遷移必須画面/);
  });

  test("await しないマイクロタスク継続からの goto も封鎖される", async () => {
    const page = stubPage();
    let escaped: Promise<unknown> | undefined;
    await step(page, "「注文する」", async () => {
      escaped = Promise.resolve().then(() => page.goto("/ja/shopping/complete"));
    });
    await expect(escaped).rejects.toThrow(/中で page\.goto/);
    expect(page.gotoCalls).toEqual([]);
  });

  test("step() を通した後もフィクスチャのガードは剥がれない", async () => {
    // withGotoBlocked が素の goto を復元してしまうと、step() 1回でガードが消える。
    const page = guardPage(stubPage()) as ReturnType<typeof stubPage>;
    await step(page, "「購入手続きへ」", async () => {
      /* 画面上の操作 */
    });
    await expect(page.goto("/ja/shopping/complete")).rejects.toThrow(/遷移必須画面/);
    await page.goto("/ja/cart");
    expect(page.gotoCalls).toEqual(["/ja/cart"]);
  });

  test("既知の限界: タイマー継続（setTimeout）でも fixture のガードは効く", async () => {
    // step() の封鎖は action の実行区間だけ有効で、タイマーで区間外へ逃がすとすり抜ける。
    // ただしフィクスチャ適用済みの page なら、区間外でもガードが残るので止まる。
    // 未適用の page（fixture を import していない spec）では素通りする＝静的監査で守る。
    const unguarded = stubPage();
    let escaped: Promise<unknown> | undefined;
    await step(unguarded, "「注文する」", async () => {
      escaped = new Promise((resolve) =>
        setTimeout(() => resolve(unguarded.goto("/ja/shopping/complete")), 5)
      );
    });
    await escaped;
    expect(unguarded.gotoCalls).toEqual(["/ja/shopping/complete"]);

    const guarded = guardPage(stubPage()) as ReturnType<typeof stubPage>;
    let blocked: Promise<unknown> | undefined;
    await step(guarded, "「注文する」", async () => {
      blocked = new Promise((resolve) =>
        setTimeout(() => resolve(guarded.goto("/ja/shopping/complete").catch((e) => e)), 5)
      );
    });
    expect(String(await blocked)).toMatch(/遷移必須画面/);
    expect(guarded.gotoCalls).toEqual([]);
  });
});

test.describe("harness: 直アクセス時の期待", () => {
  test("台帳の複数ガードが分解して取り出せる", () => {
    const alts = directAccessExpectation("/ja/shopping");
    expect(alts.length).toBeGreaterThan(1);
    expect(alts.join("|")).toContain("ログイン画面");
  });

  test("未確定の画面は期待値を返さない（捏造しない）", () => {
    expect(directAccessExpectation("/ja/shopping/delivery/new/edit")).toEqual([]);
  });
});
