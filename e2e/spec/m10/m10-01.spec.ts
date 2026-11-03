/** M10-01 店舗基本設定。正本: integration_test/casegen/cases/M10-01_test_cases.tsv
 * 店舗基本設定は共有の設定。各ケースの終わりに、画面から元の値へ戻し、戻ったことを確かめる（戻せなければ注記に残す）。 */
import { test, Browser } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { FRONT } from "../../pages/front/f03_07_restock_notify";
import { ShopBasicPage, 七つのトグル } from "../../pages/admin/m10_01_shop";
import { 店舗基本情報を読む } from "../../db/m10_01_shop";
import { M1001_ADMIN, M1001L_ADMIN, 戻す } from "../../seeds/m10-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const digits = (s: string | null) => (s ?? "").replace(/\D/g, "");
const num = (s: string | null) => (s === null || s === "" ? null : Number(s));

async function 戻して(browser: Browser, body: () => Promise<void>): Promise<void> {
  try { await body(); } finally {
    const m = await 戻す(browser);
    if (m) note(`店舗基本設定を元の値へ戻せなかった: ${m}`); else note("店舗基本設定を元の値へ画面から戻し、画面で戻ったことを確かめた");
  }
}
const 全七 = (v: boolean) => Object.fromEntries(七つのトグル.map((t) => [t, v]));

/** 基本の型: ログイン→開く→入れて押す→DBを読む。画面に入力欄が無い項目（経度・緯度）は、あるものだけ入れて押し、期待結果で「欄がある」ことの不合格として残す */
function 保存(id: string, 入力: [string, string][], 期待: (db: Record<string, string | null>) => void, opt: { トグル?: boolean; 無い欄?: string[]; 注記?: string[]; 押す?: boolean | "不問" } = {}): CaseBody {
  return async ({ page, browser, step, expected }) => {
    await 戻して(browser, async () => {
      await loginAdmin(page, M1001_ADMIN);
      const p = new ShopBasicPage(page);
      const 無い: string[] = [];
      let db: Record<string, string | null> = {};
      await step(1, async () => { await p.open(); });
      await step(2, async () => {
        for (const [k, v] of 入力) await p.入れる(k, v);
        if (opt.トグル !== undefined) for (const t of 七つのトグル) await p.トグルを(t, opt.トグル);
        for (const k of opt.無い欄 ?? []) if (!(await p.欄がある(k))) 無い.push(k);
        for (const m of opt.注記 ?? []) note(m);
        if (無い.length) note(`画面に入力欄が無い項目がある: ${無い.join("・")}`);
        if (opt.押す === "不問") await p.押す();
        else if (opt.押す !== false) await p.押して保存を確かめる(`${id} 店舗基本設定の保存`);
      });
      await step(3, async () => { db = 店舗基本情報を読む(); });
      await expected(async () => {
        expect.soft(無い.join("・") || "（無い項目なし）", "画面に入力欄が無い項目").toBe("（無い項目なし）");
        期待(db);
      });
    });
  };
}

const eq = (db: Record<string, string | null>, k: string, v: string | null, msg?: string) => expect.soft(db[k] ?? null, msg ?? `保存された${k}`).toBe(v);
const 一欄注記 = "画面の郵便番号・電話番号・FAX番号は1つの入力欄。正本が分けている欄は、続けて1つの欄に入れた";
const 緯度経度注記 = "緯度・経度の入力欄が画面に無く、保存値もDBに無いので、入力も保存もできない";

// 001 保存値の表示
caseTest("IT-M10-01-001", async ({ page, browser, step, expected }) => {
  await 戻して(browser, async () => {
    await loginAdmin(page, M1001_ADMIN);
    const p = new ShopBasicPage(page);
    await step(1, async () => { await p.open(); });
    await expected(async () => {
      const 期待: [string, string][] = [["会社名", "保存済み会社"], ["会社名(フリガナ)", "ホゾンズミガイシャ"], ["店名", "保存済み店舗"], ["店名(フリガナ)", "ホゾンズミテンポ"],
        ["店名(英語表記)", "SavedShop"], ["郵便番号", "123-4567"], ["都道府県", "東京都"], ["市区町村名", "千代田区"], ["番地・ビル名", "丸の内1-1"], ["住所(英語表記)", "SavedAddress"],
        ["電話番号", "03-1234-5678"], ["FAX番号", "03-2345-6789"], ["店舗営業時間", "10:00-20:00"], ["送信元メールアドレス", "from-old@example.com"], ["返信先メールアドレス", "reply-old@example.com"],
        ["送信エラー通知メールアドレス", "error-old@example.com"], ["問い合わせ専用メールアドレス", "contact-old@example.com"], ["取扱商品", "保存済み商品"], ["メッセージ", "保存済みメッセージ"],
        ["ショップ名略称(英語表記)", "Saved"], ["スマレジ店舗ID", "100"], ["スマレジ店舗コード", "SHOP01001"], ["送料無料条件(金額)", "5000"], ["送料無料条件(数量)", "10"]];
      for (const [k, v] of 期待) {
        const 実 = await p.値(k);
        if (["郵便番号", "電話番号", "FAX番号"].includes(k)) expect.soft(digits(実), `${k}の表示（数字だけで比べる）`).toBe(digits(v));
        else expect.soft(実.replace(/,/g, ""), `${k}の表示`).toBe(v);
      }
      for (const t of 七つのトグル) expect.soft(await p.有効か(t), `${t}の設定（無効）`).toBe(false);
      for (const k of ["経度", "緯度"]) expect.soft(await p.欄がある(k), `${k}の入力欄がある`).toBe(true);
    });
  });
});

caseTest("IT-M10-01-002", 保存("IT-M10-01-002", [["会社名", "結合会社A"], ["会社名(フリガナ)", "ケツゴウガイシャエー"], ["店名", "結合店舗A"], ["店名(フリガナ)", "ケツゴウテンポエー"], ["店名(英語表記)", "IntegrationShop1"],
  ["郵便番号", "1600023"], ["都道府県", "東京都"], ["市区町村名", "新宿区"], ["番地・ビル名", "西新宿1-1"], ["電話番号", "03-1111-2222"], ["FAX番号", "03-3333-4444"], ["店舗営業時間", "09:00-18:00"],
  ["送信元メールアドレス", "from@example.com"], ["返信先メールアドレス", "reply@example.com"], ["送信エラー通知メールアドレス", "error@example.com"], ["問い合わせ専用メールアドレス", "contact@example.com"],
  ["取扱商品", "カード"], ["メッセージ", "結合試験"], ["送料無料条件(金額)", "10000"], ["送料無料条件(数量)", "2"]],
  (db) => {
    eq(db, "会社名", "結合会社A"); eq(db, "会社名(フリガナ)", "ケツゴウガイシャエー"); eq(db, "店名", "結合店舗A"); eq(db, "店名(フリガナ)", "ケツゴウテンポエー"); eq(db, "店名(英語表記)", "IntegrationShop1");
    eq(db, "郵便番号", "1600023"); eq(db, "市区町村名", "新宿区"); eq(db, "番地・ビル名", "西新宿1-1");
    expect.soft(digits(db["電話番号"]), "保存された電話番号（数字）").toBe("0311112222"); expect.soft(digits(db["FAX番号"]), "保存されたFAX番号（数字）").toBe("0333334444");
    eq(db, "店舗営業時間", "09:00-18:00"); eq(db, "送信元メールアドレス", "from@example.com"); eq(db, "返信先メールアドレス", "reply@example.com");
    eq(db, "送信エラー通知メールアドレス", "error@example.com"); eq(db, "問い合わせ専用メールアドレス", "contact@example.com"); eq(db, "取扱商品", "カード"); eq(db, "メッセージ", "結合試験");
    expect.soft(num(db["送料無料条件(金額)"]), "保存された送料無料条件(金額)").toBe(10000); expect.soft(num(db["送料無料条件(数量)"]), "保存された送料無料条件(数量)").toBe(2);
    for (const t of 七つのトグル) expect.soft(db[t], `保存された${t}（有効）`).toBe("true");
  }, { トグル: true, 無い欄: ["経度", "緯度"], 注記: [一欄注記] }));

caseTest("IT-M10-01-003", async ({ page, browser, step, expected }) => {
  await 戻して(browser, async () => {
    await loginAdmin(page, M1001_ADMIN);
    const p = new ShopBasicPage(page);
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.入れる("店名", "遷移確認店舗"); await p.押して保存を確かめる("店舗基本設定の保存"); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, "保存後の画面（店舗基本設定）").toMatch(/\/setting\/shop$/);
      expect.soft(await p.値("店名"), "開き直された画面の店名").toBe("遷移確認店舗");
    });
  });
});

caseTest("IT-M10-01-004", async ({ page, browser, step, expected }) => {
  await 戻して(browser, async () => {
    await loginAdmin(page, M1001_ADMIN);
    const p = new ShopBasicPage(page);
    let db: Record<string, string | null> = {};
    const 無い: string[] = [];
    const 空にする = ["会社名", "会社名(フリガナ)", "店名(フリガナ)", "店名(英語表記)", "郵便番号", "市区町村名", "番地・ビル名", "住所(英語表記)", "電話番号", "FAX番号", "店舗営業時間", "取扱商品", "メッセージ", "送料無料条件(金額)", "送料無料条件(数量)"];
    await step(1, async () => { await p.open(); });
    await step(2, async () => {
      for (const k of 空にする) await p.入れる(k, "");
      await p.欄("都道府県").selectOption({ value: "" }, { timeout: 30_000 });
      for (const k of ["経度", "緯度"]) if (!(await p.欄がある(k))) 無い.push(k);
      note(`${一欄注記}。画面に入力欄が無い項目: ${無い.join("・")}`);
      await p.押して保存を確かめる("店舗基本設定の保存");
    });
    await step(3, async () => { db = 店舗基本情報を読む(); });
    await expected(async () => {
      expect.soft(無い.join("・") || "（無い項目なし）", "画面に入力欄が無い項目").toBe("（無い項目なし）");
      for (const k of 空にする) expect.soft(db[k] ?? "", `空にした${k}の保存値`).toBe("");
    });
  });
});

caseTest("IT-M10-01-007", async ({ page, browser, step, expected }) => {
  await 戻して(browser, async () => {
    await loginAdmin(page, M1001_ADMIN);
    const p = new ShopBasicPage(page);
    let 見出し = "";
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.入れる("店名", "入力中店舗"); await p.入れる("送信元メールアドレス", ""); await p.押す(); });
    await step(3, async () => { 見出し = (await page.locator(".c-headerBar__shopTitle span").first().innerText()).trim(); });
    await expected(async () => { expect.soft(見出し, "画面の見出しの店舗名").toBe("保存済み店舗"); });
  });
});

const 長さ = (ch: string, n: number) => ch.repeat(n);
caseTest("IT-M10-01-008", 保存("IT-M10-01-008", [["会社名", 長さ("あ", 50)], ["店名", 長さ("あ", 50)], ["会社名(フリガナ)", 長さ("ア", 50)], ["店名(フリガナ)", 長さ("ア", 50)], ["店舗営業時間", 長さ("A", 50)]],
  (db) => { eq(db, "会社名", 長さ("あ", 50)); eq(db, "店名", 長さ("あ", 50)); eq(db, "会社名(フリガナ)", 長さ("ア", 50)); eq(db, "店名(フリガナ)", 長さ("ア", 50)); eq(db, "店舗営業時間", 長さ("A", 50)); }));
caseTest("IT-M10-01-010", 保存("IT-M10-01-010", [["市区町村名", 長さ("あ", 32)], ["番地・ビル名", 長さ("あ", 32)]], (db) => { eq(db, "市区町村名", 長さ("あ", 32)); eq(db, "番地・ビル名", 長さ("あ", 32)); }));
caseTest("IT-M10-01-012", 保存("IT-M10-01-012", [["店名(英語表記)", 長さ("A", 200)]], (db) => { eq(db, "店名(英語表記)", 長さ("A", 200)); }));
caseTest("IT-M10-01-014", 保存("IT-M10-01-014", [["取扱商品", 長さ("あ", 99999)], ["メッセージ", 長さ("あ", 99999)]], (db) => { eq(db, "取扱商品", 長さ("あ", 99999)); eq(db, "メッセージ", 長さ("あ", 99999)); }));
caseTest("IT-M10-01-016", 保存("IT-M10-01-016", [["郵便番号", "1000001"]], (db) => { eq(db, "郵便番号", "1000001", "保存された郵便番号（前半100・後半0001）"); }, { 注記: [一欄注記] }));
caseTest("IT-M10-01-019", 保存("IT-M10-01-019", [["電話番号", "012345678901234"], ["FAX番号", "987654321098765"]],
  (db) => { expect.soft(digits(db["電話番号"]), "保存された電話番号（5桁×3）").toBe("012345678901234"); expect.soft(digits(db["FAX番号"]), "保存されたFAX番号（5桁×3）").toBe("987654321098765"); }, { 注記: [一欄注記] }));
caseTest("IT-M10-01-023", 保存("IT-M10-01-023", [["会社名(フリガナ)", "カタカナー"], ["店名(フリガナ)", "ﾊﾝｶｸｶﾅｰ"]], (db) => { eq(db, "会社名(フリガナ)", "カタカナー"); eq(db, "店名(フリガナ)", "ﾊﾝｶｸｶﾅｰ"); }));
caseTest("IT-M10-01-026", 保存("IT-M10-01-026", [], () => {}, { 無い欄: ["緯度", "経度"], 押す: false, 注記: [緯度経度注記] }));
caseTest("IT-M10-01-027", 保存("IT-M10-01-027", [], () => {}, { 無い欄: ["緯度", "経度"], 押す: false, 注記: [緯度経度注記] }));
caseTest("IT-M10-01-030", 保存("IT-M10-01-030", [], () => {}, { 無い欄: ["緯度", "経度"], 押す: false, 注記: [緯度経度注記] }));
caseTest("IT-M10-01-032", 保存("IT-M10-01-032", [["送料無料条件(金額)", "99999999"]], (db) => { expect.soft(num(db["送料無料条件(金額)"]), "保存された送料無料条件(金額)").toBe(99999999); }));
caseTest("IT-M10-01-035", 保存("IT-M10-01-035", [["送料無料条件(数量)", "25"]], (db) => { expect.soft(num(db["送料無料条件(数量)"]), "保存された送料無料条件(数量)").toBe(25); }));
caseTest("IT-M10-01-039", 保存("IT-M10-01-039", [], (db) => { for (const t of 七つのトグル) expect.soft(db[t], `保存された${t}（有効）`).toBe("true"); }, { トグル: true }));
caseTest("IT-M10-01-040", 保存("IT-M10-01-040", [], (db) => { for (const t of 七つのトグル) expect.soft(db[t], `保存された${t}（無効）`).toBe("false"); }, { トグル: false }));

caseTest("IT-M10-01-041", async ({ page, browser, step, expected }) => {
  await 戻して(browser, async () => {
    await loginAdmin(page, M1001_ADMIN);
    const p = new ShopBasicPage(page);
    const 状態: Record<string, boolean> = {};
    await step(1, async () => { await p.open(); });
    await step(2, async () => { for (const t of 七つのトグル) 状態[t] = await p.有効か(t); });
    await expected(async () => { for (const t of 七つのトグル) expect.soft(状態[t], `${t}（保存済みの有効）`).toBe(true); });
  });
});

const 長いURL = (n: number) => "https://x.com/" + "a".repeat(n);
caseTest("IT-M10-01-046", 保存("IT-M10-01-046", [["X公式アカウントURL", 長いURL(241)]], (db) => { eq(db, "X公式アカウントURL", 長いURL(241)); }));
caseTest("IT-M10-01-047", 保存("IT-M10-01-047", [["X公式アカウントURL", 長いURL(242)]], (db) => { eq(db, "X公式アカウントURL", "https://x.com/m1001-047-saved", "X公式アカウントURL（更新されない）"); }, { 押す: "不問" }));
caseTest("IT-M10-01-048", 保存("IT-M10-01-048", [["X公式アカウントURL", ""]], (db) => { expect.soft(db["X公式アカウントURL"] ?? "", "保存されたX公式アカウントURL（空）").toBe(""); }));
// 049・050 は DB を作り直す手順のシードなので実装しない

/** なりすまし対策トークンの改ざん・欠落。DBを読む手順の番号 dbStep（無ければ 0）。手順は 開く→店名→トークン→押す→（確認→DB）の順 */
function トークン(店名: string, 操作: "書き換え" | "削除", 確かめ: "再表示とDB" | "DBのみ" | "再表示" | "エラー無し", 手順数: number): CaseBody {
  return async ({ page, browser, step, expected }) => {
    await 戻して(browser, async () => {
      await loginAdmin(page, M1001_ADMIN);
      const p = new ShopBasicPage(page);
      let db: Record<string, string | null> = {};
      await step(1, async () => { await p.open(); });
      await step(2, async () => { await p.入れる("店名", 店名); });
      await step(3, async () => {
        await page.evaluate((op) => {
          const t = document.querySelector<HTMLInputElement>("#shop_master__token");
          if (!t) throw new Error("トークンの入力要素が無い");
          if (op === "削除") t.remove(); else t.value = "INVALID";
        }, 操作);
      });
      await step(4, async () => { await p.押す(); });
      if (手順数 >= 5) await step(5, async () => { if (確かめ === "DBのみ") db = 店舗基本情報を読む(); /* それ以外は表示された画面を確認する（期待結果で確かめる） */ });
      if (手順数 >= 6) await step(6, async () => { db = 店舗基本情報を読む(); });
      await expected(async () => {
        if (確かめ === "再表示とDB" || 確かめ === "再表示") {
          expect.soft(await p.値("店名"), "再表示された画面の店名（入力のまま）").toBe(店名);
          expect.soft(await page.locator(".alert-success").count(), "保存完了のメッセージの数").toBe(0);
        }
        if (確かめ === "再表示とDB" || 確かめ === "DBのみ") expect.soft(db["店名"], "DBの店名（保存済みのまま）").toBe("保存済み店舗");
        if (確かめ === "エラー無し") {
          // どの画面にも出る開発用の帯（デバッグモードの案内）はエラーメッセージに数えない
          const 文 = (await page.locator(".alert-danger:visible, .invalid-feedback:visible, .form-error-message:visible").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
          expect.soft(文.length, `画面に出ているエラーメッセージの数（${文.join(" / ") || "なし"}）`).toBe(0);
        }
      });
    });
  };
}
caseTest("IT-M10-01-043", トークン("改ざん試験店舗", "書き換え", "再表示とDB", 6));
caseTest("IT-M10-01-051", トークン("欠落試験店舗", "削除", "DBのみ", 5));
caseTest("IT-M10-01-052", トークン("欠落試験店舗", "削除", "再表示", 5));
caseTest("IT-M10-01-053", トークン("不一致試験店舗", "書き換え", "エラー無し", 5));
caseTest("IT-M10-01-054", トークン("欠落試験店舗", "削除", "エラー無し", 5));

/** 自動ログイン機能の設定が本店のログイン画面に響くか */
function 連携(id: string, 有効: boolean): CaseBody {
  return async ({ page, browser, step, expected }) => {
    await 戻して(browser, async () => {
      await loginAdmin(page, M1001L_ADMIN);
      const p = new ShopBasicPage(page);
      let 数 = -1;
      await step(1, async () => { await p.open(); });
      await step(2, async () => { await p.トグルを("自動ログイン", 有効); await p.押して保存を確かめる(`${id} 自動ログイン機能の設定`); });
      await step(3, async () => {
        const ctx = await browser.newContext({ locale: "ja-JP", ignoreHTTPSErrors: true });
        try {
          const f = await ctx.newPage();
          await f.goto(`${FRONT}/mypage/login`, { timeout: 60_000 });
          await f.waitForLoadState("load");
          await expect(f.locator("form#login_mypage input[name=login_pass]"), "本店のログイン画面").toBeVisible({ timeout: 30_000 });
          数 = await f.locator('input[name="login_memory"]:visible, input[type=checkbox][name*="memory"]:visible').count();
        } finally { await ctx.close(); }
      });
      await expected(async () => {
        expect.soft(数 > 0, `ログイン状態の保持の選択欄が表示されている（見えた選択欄の数 ${数}）`).toBe(有効);
      });
    });
  };
}
caseTest("IT-M10-01-044", 連携("IT-M10-01-044", true));
caseTest("IT-M10-01-045", 連携("IT-M10-01-045", false));
