/**
 * F06-05 マイページ。正本: cases/F06-05_test_cases.tsv
 * テストデータの読み替え（依頼者の方針 2026-11-10）は seeds/f06-05.ts の先頭と、各シードの注記（シード作成時の問題）に残す。
 * 実装しないのは 018・019（スマレジ試験環境での店頭読取と、その連携の動き）と 043（共有のスマレジ接続先を受信サーバーへ書き換える）。
 * 記録 review/F06-05_progress_2026-11-10.md
 */
import { Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ポイント履歴の行, 保有ポイント } from "../../db/f06_05";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { 日付をそろえる } from "../../pages/admin/f06_05_setup";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { LoginPage } from "../../pages/front/f06_03_login";
import { MypagePage, メニュー名, 言語 } from "../../pages/front/f06_05_mypage";
import { 会員 } from "../../seeds/f06-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const マイページのパス = /^\/ja\/mypage\/?$/;
const ECTOPのパス = /^\/(ja\/?)?$/;
const BASIC = "S-F06-05-BASIC";

/** 事前準備: 新しいブラウザセッションで、そのシードの会員としてログインする */
async function ログインする(page: Page, seedId: string, 言: 言語 = "ja"): Promise<MypagePage> {
  const m = 会員(seedId);
  const p = new MypagePage(page, 言);
  await p.ログインする(m.メール, m.パスワード);
  if (await p.ログイン画面である()) throw new Error(`会員 ${m.メール} でログインできない（${await new LoginPage(page).認証エラー()}）`);
  return p;
}

// ---------------------------------------------------------------------------
// 表示・ログイン
// ---------------------------------------------------------------------------
caseTest("IT-F06-05-001", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  await step(1, async () => { await p.開く(); });
  await expected(async () => {
    expect.soft(p.path, "開いた画面のアドレス（マイページ）").toMatch(マイページのパス);
    expect.soft(await p.マイページである(), "マイページが表示されている").toBe(true);
  });
});

caseTest("IT-F06-05-002", async ({ page, step, expected }) => {
  const l = new LoginPage(page);
  await step(1, async () => { await l.URLを開く("/ja/mypage/"); });
  await expected(async () => {
    expect.soft(l.path(), "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await l.ログイン画面である(), "ログイン画面が表示される（マイページは表示されない）").toBe(true);
  });
});

/** 003・004: ログイン前に入荷通知を押し、ログイン後にマイページを開いたときの戻り先 */
function 戻り先ケース(n: "003" | "004") {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const seedId = `S-F06-05-RETURN-${n}`;
    const m = 会員(seedId);
    const productId = notes.get(`〔商品ID-F0605-${n}〕`);
    const classId = notes.get(`〔商品規格ID-F0605-${n}〕`);
    const detailPath = `/ja/products/detail/${productId}`;
    const front = new FrontRestock(page);
    const mypage = new MypagePage(page);
    const landed: string[] = [];
    await step(1, async () => { await front.openDetail(productId); });
    await step(2, async () => {
      const r = await front.press(front.classButton(classId));
      note(`「入荷時に通知」を押した結果: ログインモーダル${r.ログインモーダルが開いた ? "が開いた" : "は開かなかった"}`);
      expect(r.ログインモーダルが開いた, "ログインモーダルが開いた").toBe(true);
    });
    await step(3, async () => {
      const form = page.locator("#notify-login-form");
      await expect(form, "ログインモーダルの入力欄").toBeVisible();
      await form.locator('input[name="login_email"]').fill(m.メール);
      await form.locator('input[name="login_pass"]').fill(m.パスワード);
    });
    await step(4, async () => {
      await page.locator("#notify-login-form button[type=submit]").click();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1500);
      note(`「ログイン」を押した後の画面: ${mypage.path}`);
    });
    await step(5, async () => {
      await mypage.開く();
      landed.push(mypage.path);
    });
    if (n === "004") {
      await step(6, async () => { await mypage.開く(); landed.push(mypage.path); });
      await expected(async () => {
        expect.soft(landed[0], "1回目にマイページを開いた後の画面（保持された戻り先の商品詳細画面）").toBe(detailPath);
        expect.soft(landed[1], "2回目にマイページを開いた後の画面（戻り先が消去され、マイページ）").toMatch(マイページのパス);
      });
    } else {
      await expected(async () => {
        expect.soft(landed[0], "マイページを開いた後の画面（マイページを表示せず、入荷お知らせを申し込んだ商品の詳細画面）").toBe(detailPath);
      });
    }
  };
}
caseTest("IT-F06-05-003", 戻り先ケース("003"));
caseTest("IT-F06-05-004", 戻り先ケース("004"));

// ---------------------------------------------------------------------------
// パンくず
// ---------------------------------------------------------------------------
caseTest("IT-F06-05-005", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.現在地を押す(); });
  await expected(async () => {
    expect.soft(p.path, "押したあとの画面のアドレス（マイページのまま）").toMatch(マイページのパス);
    expect.soft(await p.現在地がリンクか(), "現在表示中のマイページが押下可能なリンクになっている").toBe(false);
  });
});

caseTest("IT-F06-05-006", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.押して遷移する(p.パンくずホーム); });
  await expected(async () => { expect.soft(p.path, "遷移した画面（本店ECTOP）").toMatch(ECTOPのパス); });
});

// ---------------------------------------------------------------------------
// メニュー・表示内容
// ---------------------------------------------------------------------------
caseTest("IT-F06-05-007", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  let 文言: string[] = [];
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { 文言 = await p.メニューの文言(); });
  await expected(async () => {
    expect.soft(文言.includes("チーム情報変更"), "「チーム情報変更」のメニューが表示されない").toBe(false);
    expect.soft(文言.includes("大会デッキ登録"), "単独の「大会デッキ登録」のメニューが表示されない").toBe(false);
    expect.soft(文言.includes("マイイベント・デッキ登録"), "「マイイベント・デッキ登録」のメニューが表示される").toBe(true);
  });
});

caseTest("IT-F06-05-008", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const 順: メニュー名[] = [
    "購入履歴", "入荷待ち商品一覧", "お気に入り登録商品一覧", "購入手続きへ", "ポイント履歴", "買取一覧", "オンライン本人確認",
    "マイイベントデッキ登録", "マイデッキ", "会員情報変更", "配送先の新規登録変更", "退会", "お問い合わせ", "お問い合わせ履歴",
  ];
  const 結果: { 名: string; 上部: string; 遷移先: string }[] = [];
  await step(1, async () => { await p.開く(); });
  for (let i = 0; i < 順.length; i++) {
    await step(i + 2, async () => {
      await p.メニューを押す(順[i]);
      結果.push({ 名: 順[i], 上部: await p.画面上部の文(), 遷移先: p.path });
      if (i < 順.length - 1) {
        await p.戻る();
        expect(p.path, `${順[i]}からブラウザの戻るで戻った画面（マイページ）`).toMatch(マイページのパス);
      }
    });
  }
  await expected(async () => {
    for (const r of 結果) {
      expect.soft(r.上部, `${r.名}の画面（${r.遷移先}）の上部に、ログイン会員の姓「結合試験」が表示されない`).not.toContain("結合試験");
      expect.soft(r.遷移先, `${r.名}を押して画面が遷移した（マイページのまま、ではない）`).not.toMatch(マイページのパス);
    }
  });
});

caseTest("IT-F06-05-009", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  let 名前 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { 名前 = await p.名前の表示(); });
  await expected(async () => { expect.soft(名前, "名前の表示（名前(姓)としてログイン会員の姓）").toContain("結合試験"); });
});

caseTest("IT-F06-05-010", async ({ page, notes, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const 番号 = notes.get("〔スマレジ側会員番号-F0605-共有-BASIC〕");
  let 表示 = "";
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    表示 = await p.会員番号の表示();
    if (番号 === "（空）") note("会員登録/編集画面のスマレジIDが空だった（スマレジ側の会員番号が割り当てられていない）ので、期待する会員番号が無い");
  });
  await expected(async () => {
    expect.soft(番号, "ログイン会員に割り当てられたスマレジ側の会員番号（管理画面のスマレジID）がある").not.toBe("（空）");
    expect.soft(表示, "会員番号の表示").toContain(番号);
  });
});

caseTest("IT-F06-05-014", async ({ page, step, expected }) => {
  const m = 会員(BASIC);
  const p = await ログインする(page, BASIC);
  let 前: { 点: number | null; 履歴: string[] } = { 点: null, 履歴: [] };
  let 後: { 点: number | null; 履歴: string[] } = { 点: null, 履歴: [] };
  await step(1, async () => { 前 = { 点: 保有ポイント(m.会員ID), 履歴: ポイント履歴の行(m.会員ID) }; });
  await step(2, async () => { await p.開く(); });
  await step(3, async () => { 後 = { 点: 保有ポイント(m.会員ID), 履歴: ポイント履歴の行(m.会員ID) }; });
  await expected(async () => {
    expect.soft(前.点, "表示前の保有ポイント").toBe(500);
    expect.soft(前.履歴.length, "表示前のポイント履歴の件数").toBe(3);
    expect.soft(後.点, "表示後の保有ポイント（更新されない）").toBe(前.点);
    expect.soft(後.履歴, "表示後のポイント履歴（件数・内容とも更新されない）").toEqual(前.履歴);
  });
});

// ---------------------------------------------------------------------------
// バーコード・タイマー
// ---------------------------------------------------------------------------
caseTest("IT-F06-05-015", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const v = { バーコード: false, 秒: null as number | null, 表示: "" };
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    await page.waitForTimeout(1500);
    v.バーコード = await p.バーコードが出ているか();
    v.秒 = await p.タイマーの秒数();
    v.表示 = await p.タイマーの表示();
  });
  await expected(async () => {
    expect.soft(v.バーコード, "バーコードが表示されている").toBe(true);
    expect.soft(v.秒 !== null && v.秒 >= 240 && v.秒 <= 300, `5分間をカウントするタイマーが表示されている（表示「${v.表示}」＝${v.秒}秒）`).toBe(true);
  });
});

caseTest("IT-F06-05-016", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const v = { バーコード: true, 案内: "", リンク: "", パス: "" };
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    note("タイマーが0になるまで、実際に5分間待った");
    await p.期限切れまで待つ();
  });
  await step(3, async () => {
    v.バーコード = await p.バーコードが出ているか();
    v.案内 = await p.期限切れの案内();
    v.リンク = await p.再表示リンクの文言();
    v.パス = p.path;
  });
  await expected(async () => {
    expect.soft(v.バーコード, "バーコードが表示されていない").toBe(false);
    expect.soft(v.案内, "期限切れの案内").toContain("有効期限が切れ");
    expect.soft(v.リンク, "再表示リンク").toBe("再表示する");
    expect.soft(v.パス, "現在の画面（マイページに留まる）").toMatch(マイページのパス);
  });
});

caseTest("IT-F06-05-017", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const v = { バーコード: false, 秒: null as number | null, 表示: "" };
  await step(1, async () => { await p.開く(); });
  await step(2, async () => {
    note("タイマーが0になるまで、実際に5分間待った");
    await p.期限切れまで待つ();
  });
  await step(3, async () => {
    await p.再表示するを押す();
    await page.waitForTimeout(1500);
    v.バーコード = await p.バーコードが出ているか();
    v.秒 = await p.タイマーの秒数();
    v.表示 = await p.タイマーの表示();
  });
  await expected(async () => {
    expect.soft(v.バーコード, "バーコードが再度表示されている").toBe(true);
    expect.soft(v.秒 !== null && v.秒 >= 240 && v.秒 <= 300, `新しい5分間のタイマーが表示されている（表示「${v.表示}」＝${v.秒}秒）`).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// メニューの遷移（020〜033）
// ---------------------------------------------------------------------------
function 遷移ケース(名: メニュー名, パス: RegExp, 画面名: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const p = await ログインする(page, BASIC);
    await step(1, async () => { await p.開く(); });
    await step(2, async () => { await p.メニューを押す(名); });
    await expected(async () => {
      expect.soft(p.path, `遷移した画面のアドレス（${画面名}）`).toMatch(パス);
      expect.soft(await p.ログイン画面である(), "ログイン画面ではない（会員のまま遷移している）").toBe(false);
    });
  };
}
caseTest("IT-F06-05-020", 遷移ケース("購入履歴", /^\/ja\/mypage\/shopping_history/, "購入履歴画面"));
caseTest("IT-F06-05-021", 遷移ケース("入荷待ち商品一覧", /^\/ja\/mypage\/notifylist/, "入荷待ち商品一覧画面"));
caseTest("IT-F06-05-022", 遷移ケース("お気に入り登録商品一覧", /^\/ja\/mypage\/favorite/, "お気に入り商品一覧画面"));
caseTest("IT-F06-05-023", 遷移ケース("購入手続きへ", /^\/ja\/cart\/?$/, "カート画面"));
caseTest("IT-F06-05-024", 遷移ケース("ポイント履歴", /^\/ja\/mypage\/point_history/, "ポイント履歴画面"));
caseTest("IT-F06-05-025", 遷移ケース("買取一覧", /^\/ja\/mypage\/purchase_history/, "買取一覧画面"));
caseTest("IT-F06-05-026", 遷移ケース("オンライン本人確認", /^\/ja\/mypage\/identification/, "オンライン本人確認画面"));
caseTest("IT-F06-05-027", 遷移ケース("マイイベントデッキ登録", /^\/ja\/mypage\/event_history/, "マイイベント・デッキ登録画面"));
caseTest("IT-F06-05-028", 遷移ケース("マイデッキ", /^\/(ja\/)?decks/, "マイデッキ画面"));
caseTest("IT-F06-05-029", 遷移ケース("会員情報変更", /^\/ja\/mypage\/change/, "会員情報変更画面"));
caseTest("IT-F06-05-030", 遷移ケース("配送先の新規登録変更", /^\/ja\/mypage\/delivery/, "配送先の新規登録・変更画面"));
caseTest("IT-F06-05-031", 遷移ケース("退会", /^\/ja\/mypage\/withdraw/, "退会画面"));
caseTest("IT-F06-05-032", 遷移ケース("お問い合わせ", /^\/ja\/contact\/?$/, "お問い合わせ画面"));
caseTest("IT-F06-05-033", 遷移ケース("お問い合わせ履歴", /^\/ja\/contact_history/, "お問い合わせ履歴画面"));

caseTest("IT-F06-05-034", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  const v = { 状態: 0, 移動先: "" };
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.メニューを押す("ログアウト"); });
  await expected(async () => {
    expect.soft(p.path, "遷移した画面（ECTOP）").toMatch(ECTOPのパス);
    // ログアウトできたことは、同じブラウザでマイページのアドレスを取得して、ログイン画面へ移されることで確かめる
    const res = await page.context().request.get(`${BASE_URL}/ja/mypage/`, { maxRedirects: 0 });
    v.状態 = res.status();
    v.移動先 = res.headers()["location"] ?? "";
    expect.soft(v.移動先, `ログアウトした（マイページを取得するとログイン画面へ移される。応答 ${v.状態}）`).toMatch(/\/mypage\/login/);
  });
});

caseTest("IT-F06-05-035", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  await step(1, async () => { await p.開く(); });
  await step(2, async () => { await p.TOPページへ戻るを押す(); });
  await expected(async () => { expect.soft(p.path, "遷移した画面（ECTOP）").toMatch(ECTOPのパス); });
});

// ---------------------------------------------------------------------------
// ヘッダー用のポイント表示
// ---------------------------------------------------------------------------
caseTest("IT-F06-05-041", async ({ page, step, expected }) => {
  const p = await ログインする(page, BASIC);
  let ヘッダー: string[] = [];
  const 断片 = { 状態: 0, 文: "", バーコード: -1 };
  await step(1, async () => {
    await p.トップを開く();
    ヘッダー = await p.ヘッダーのポイント();
  });
  await step(2, async () => {
    断片.状態 = await p.URLを開く("/ja/mypage/point_in_header");
    断片.文 = await p.ページ全体の文();
    断片.バーコード = await p.バーコード枠.count();
  });
  await expected(async () => {
    expect.soft(ヘッダー.some((t) => t === "500"), `共通ヘッダーに保有ポイント500が表示される（ヘッダーの表示: ${ヘッダー.join("、") || "なし"}）`).toBe(true);
    expect.soft(断片.状態, "ヘッダー用のポイント表示のURLの応答").toBe(200);
    expect.soft(断片.文, "ヘッダー用のポイント表示のURLに保有ポイント500が表示される").toContain("500");
    expect.soft(断片.文, "ヘッダー用のポイント表示のURLに会員番号が含まれない").not.toContain("会員番号");
    expect.soft(断片.バーコード, "ヘッダー用のポイント表示のURLにバーコードが含まれない").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 期限の近いポイント・メニューの表示（日本語版・英語版）
// ---------------------------------------------------------------------------
type 表示の期待 = { seedId: string; 言語: 言語; ポイント: string | null; 失効期限の呼び名?: string };
function 表示ケース(a: 表示の期待) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    const m = 会員(a.seedId);
    const p = new MypagePage(page, a.言語);
    const v = {
      リンク: {} as Record<string, boolean>,
      近い: null as { ポイント: string; 期限の表示: string; 期限の日付: string } | null,
    };
    await step(1, async () => {
      await p.ログインする(m.メール, m.パスワード);
      expect(await p.ログイン画面である(), `会員 ${m.メール} でログインできた（ログイン画面のままではない）`).toBe(false);
    });
    await step(2, async () => { await p.開く(); });
    await step(3, async () => {
      for (const n of ["買取一覧", "オンライン本人確認", "マイデッキ"] as メニュー名[]) v.リンク[n] = await p.メニューが見えているか(n);
      v.近い = await p.期限の近いポイント();
    });
    await expected(async () => {
      const 表示される = a.言語 === "ja";
      for (const n of ["買取一覧", "オンライン本人確認", "マイデッキ"]) {
        expect.soft(v.リンク[n], `${a.言語 === "ja" ? "日本語版" : "英語版"}のマイページに「${n}」のリンクが${表示される ? "表示される" : "表示されない"}`).toBe(表示される);
      }
      if (a.ポイント === null) {
        expect.soft(v.近い, "期限の近いポイントとポイント期限は表示されない").toBeNull();
      } else {
        const 期限 = 日付をそろえる(notes.get(a.失効期限の呼び名!));
        expect.soft(v.近い?.ポイント, "期限の近いポイント").toBe(a.ポイント);
        expect.soft(日付をそろえる(v.近い?.期限の表示 ?? ""), `ポイント期限（控えた失効期限 ${notes.get(a.失効期限の呼び名!)}）`).toBe(期限);
        expect.soft(v.近い?.期限の日付, "ポイント期限（日付の属性）").toBe(期限);
      }
    });
  };
}
caseTest("IT-F06-05-044", 表示ケース({ seedId: "S-F06-05-POINT-ONE-044", 言語: "ja", ポイント: "100", 失効期限の呼び名: "〔失効期限-F0605-044〕" }));
caseTest("IT-F06-05-046", 表示ケース({ seedId: "S-F06-05-CBPT-046", 言語: "ja", ポイント: "50", 失効期限の呼び名: "〔失効期限-F0605-046〕" }));
caseTest("IT-F06-05-047", 表示ケース({ seedId: "S-F06-05-CBPT-047", 言語: "ja", ポイント: null }));
caseTest("IT-F06-05-048", 表示ケース({ seedId: "S-F06-05-CBPT-048", 言語: "ja", ポイント: "100", 失効期限の呼び名: "〔失効期限-F0605-048〕" }));
caseTest("IT-F06-05-049", 表示ケース({ seedId: "S-F06-05-CBPT-049", 言語: "en", ポイント: null }));
caseTest("IT-F06-05-050", 表示ケース({ seedId: "S-F06-05-CBPT-050", 言語: "en", ポイント: "100", 失効期限の呼び名: "〔失効期限-F0605-050〕" }));
caseTest("IT-F06-05-051", 表示ケース({ seedId: "S-F06-05-CBPT-051", 言語: "en", ポイント: "50", 失効期限の呼び名: "〔失効期限-F0605-051〕" }));
