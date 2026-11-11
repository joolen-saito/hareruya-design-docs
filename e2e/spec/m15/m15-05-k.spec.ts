// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-05 デッキ編集（管理画面）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 *
 * - デッキ名は、検索語に使える前半に実行の印を付けて作っている（seeds/m15-05.ts の 名()）。文字数を確かめるケースは正本の値のまま。
 * - 画面の表示名は正本と少し違うものがある（アプリの翻訳ファイルで確かめた）: 「複製 >」→「複製」、「自動設定(タグ)」→「自動設定」、
 *   代表カードの検索を開くボタン「代表カード検索」→「代表カード選択」（開く画面の題名が「代表カード検索」）、
 *   代表カード検索・イベント検索の画面の「検索する」→「検索」、アーキタイプ管理の「検索する >」→「検索する」。違いは手順の注記に残す。
 */
import { test, Page, Browser } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { adminUrl, loginAdmin, withAdminSession, Account } from "../../lib/session";
import { chooseByLabel } from "../../pages/admin/common";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import {
  デッキ編集画面, デッキ名で検索する, デッキ情報を開く, デッキ情報のリンク, 新規登録画面を開く, 日時の表記, アーキタイプを検索する,
} from "../../pages/admin/m15_05_deck_edit";
import { デッキカード } from "../../db/m15_05_deck";
import { デッキリスト詳細を開く, 情報欄, 一覧を読む, 採用枚数ランキングを開く } from "../../pages/front/m15_05_deck_show";
import { DeckTopPage, DeckSearchModal } from "../../pages/front/f09_01_deck_top";
import { MetagamePage } from "../../pages/front/f09_03_metagame";
import { UsageRankingPage } from "../../pages/front/f09_04_usage_ranking";
import { OthersListPage } from "../../pages/front/f09_05_others";
import {
  M1505_ADMIN, M1505_U, M1505_RJ, RJ名, M1505_QM, QM名, 名, カード画像, 標準, 単一, 上限, 下限, 統率なし, 型甲, 型乙, 型丙, タグ一, タグ二, ALPHA, BETA,
  代えた店舗, 五日前の10時,
} from "../../seeds/m15-05-k";
import { rc } from "../../lib/run_marker";
import "../../seeds/m15-05-b"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

async function login(page: Page, a: Account = M1505_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await loginAdmin(page, a);
}
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const パス = (page: Page) => new URL(page.url()).pathname;
const 一覧のパス = new URL(adminUrl("/deck")).pathname;
const 行 = (t: string) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const 規格外の警告 = "現行フォーマットに則さない形で登録されています。";
/** 先頭の文字に、指定の文字を続けて合計 n 文字にする */
const 埋める = (先頭: string, 字: string, n: number) => 先頭 + 字.repeat(n - 先頭.length);

/** 一覧を開いてデッキ名で検索し（手順の前半）、検索結果のデッキ情報を開く（手順の後半） */
async function 検索して開く(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, 正本名: string, n1 = 1, n2 = 2): Promise<デッキ編集画面> {
  let e!: デッキ編集画面;
  await step(n1, async () => { await デッキ名で検索する(page, 名(正本名)); });
  await step(n2, async () => { e = await デッキ情報を開く(page, 名(正本名)); });
  return e;
}

/** 一覧を開いて「新規登録」を押す（手順1・2） */
async function 新規を開く(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>): Promise<デッキ編集画面> {
  let l!: デッキ一覧;
  let e!: デッキ編集画面;
  await step(1, async () => { l = new デッキ一覧(page); await l.開く(); });
  await step(2, async () => { e = await 新規登録画面を開く(page, l); });
  return e;
}

/** 代表カードが、そのカードの画像（名前の欄と画像の参照先）であることを確かめる */
async function 代表カードを確かめる(e: デッキ編集画面, カード: string, 違うカード?: string): Promise<void> {
  const r = await e.代表カード();
  expect.soft(r.名前, `代表カードの名前の欄（${カード}）`).toContain(カード);
  const url = カード画像.get(カード);
  if (url) expect.soft(r.画像, `代表カードの画像の参照先（${カード}の画像）`).toContain(url.replace(/^\//, ""));
  else expect.soft(r.画像, `代表カードの画像が表示されている`).not.toBe("");
  if (違うカード) {
    expect.soft(r.名前.includes(違うカード), `代表カードの名前の欄に ${違うカード} が出ている`).toBe(false);
    const other = カード画像.get(違うカード);
    if (other && other !== url) expect.soft(r.画像.includes(other.replace(/^\//, "")), `代表カードの画像が ${違うカード} の画像になっている`).toBe(false);
  }
}

/** 検索結果の件数（「検索結果：N件が該当しました」。0件の表示なら0） */
async function 件数(page: Page): Promise<number> { return new デッキ一覧(page).件数(); }

function 公開でイベント欠け(no: string, 欠け: { イベント名日?: string; イベント名英?: string; 開催日?: string }): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 新規を開く(page, step);
    const デッキ名 = 名(`M1505-${no}-デッキ`);
    await step(3, async () => { await e.入力する({ デッキ名, フォーマット: 標準, アーキタイプ: 型丙, 公開状態: "公開" }); });
    await step(4, async () => { await e.入力する(欠け); });
    await step(5, async () => { await e.送信する(e.新規登録ボタン); });
    await step(6, async () => { await デッキ名で検索する(page, デッキ名); });
    await expected(async () => { expect(await 件数(page), "デッキ一覧の検索結果の件数").toBe(0); });
  };
}

/** 最大文字数を超える値（最大文字数の属性を外して入れる）。デッキ名は正本の値のまま */
function 最大超え(no: string, 欄: (e: デッキ編集画面) => import("@playwright/test").Locator, 値: string, イベント?: "日" | "英"): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 新規を開く(page, step);
    const 語 = `M1505-${no}`;
    let n = 3;
    if (no === "048") {
      await step(n++, async () => { await e.最大文字数を外す(e.デッキ名); await e.デッキ名.fill(値); });
      await step(n++, async () => { await e.入力する({ フォーマット: 標準, アーキタイプ: 型丙 }); });
    } else {
      await step(n++, async () => { await e.入力する({ デッキ名: `M1505-${no}-デッキ`, フォーマット: 標準, アーキタイプ: 型丙 }); });
      await step(n++, async () => { await e.最大文字数を外す(欄(e)); await 欄(e).fill(値); });
      if (イベント) {
        await step(n++, async () => {
          await e.入力する({ 公開状態: "公開", 開催日: "2026/05/10 13:30" });
          await (イベント === "日" ? e.イベント名英 : e.イベント名日).fill(`M1505-${no}-対`);
        });
      }
    }
    await step(n++, async () => { await e.送信する(e.新規登録ボタン); });
    await step(n++, async () => { await デッキ名で検索する(page, 語); });
    await expected(async () => { expect(await 件数(page), `デッキ名「${語}」の検索結果の件数`).toBe(0); });
  };
}

function 数字欄に文字(no: string, 欄: (e: デッキ編集画面) => import("@playwright/test").Locator, 種類を変える: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 新規を開く(page, step);
    const デッキ名 = 名(`M1505-${no}-デッキ`);
    await step(3, async () => { await e.入力する({ デッキ名, フォーマット: 標準, アーキタイプ: 型丙, 公開状態: "非公開" }); });
    await step(4, async () => {
      if (種類を変える) { await e.文字入力に変える(欄(e)); await 欄(e).fill("あいう"); }
      else {
        // 日時の入力欄は文字を受け付けない。キーボードで「あいう」を打ち、入った値を注記に残す
        await 欄(e).click();
        await page.keyboard.type("あいう");
        note(`「イベント開催日」は日時の入力欄で、「あいう」を打ったあとの値は「${await 欄(e).inputValue()}」`);
      }
      await e.送信する(e.新規登録ボタン);
    });
    await step(5, async () => { await デッキ名で検索する(page, デッキ名); });
    await expected(async () => { expect(await 件数(page), "デッキ一覧の検索結果の件数").toBe(0); });
  };
}

function 必須を空にして更新(no: string, 空にする: "フォーマット" | "アーキタイプ", 元: string): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    await step(3, async () => {
      const sel = 空にする === "フォーマット" ? e.フォーマット : e.アーキタイプ;
      await expect(sel, `「${空にする}」の選択欄が操作できる`).toBeEnabled();
      await sel.selectOption("");
      await e.成績.fill(`M1505-${no}-空`);
      await e.送信する(e.更新ボタン);
      const エラー = [...await e.エラーの帯(), ...(await page.locator(".invalid-feedback:visible, .form-error-message:visible").allInnerTexts())];
      note(`更新を押したあとのエラー表示: ${エラー.map((t) => t.replace(/\s+/g, " ").trim()).join(" / ") || "なし"}`);
    });
    await step(4, async () => { await デッキ名で検索する(page, 名(`M1505-${no}-デッキ`)); });
    let e2!: デッキ編集画面;
    await step(5, async () => { e2 = await デッキ情報を開く(page, 名(`M1505-${no}-デッキ`)); });
    await expected(async () => {
      expect.soft((await e2.選択中(空にする === "フォーマット" ? e2.フォーマット : e2.アーキタイプ)).join("、"), `「${空にする}」（元の値のまま）`).toBe(元);
      expect.soft(await e2.成績.inputValue(), "「成績」（空のまま）").toBe("");
    });
  };
}

// ---------------------------------------------------------------- 複製

function 複製して数える(no: string, 回数: string, 期待: number, 数字以外 = false): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const デッキ名 = 名(`M1505-${no}-デッキ`);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    await step(3, async () => {
      await e.複製の画面を開く();
      if (数字以外) {
        // 指定回数は数値の入力欄。キーボードで打ち、入った値を注記に残す
        await e.複製回数.click();
        await page.keyboard.type(回数);
        note(`「指定回数」は数値の入力欄で、「${回数}」を打ったあとの値は「${await e.複製回数.inputValue()}」`);
      } else await e.複製回数.fill(回数);
      await e.送信する(e.複製保存ボタン);
    });
    await step(4, async () => { await デッキ名で検索する(page, デッキ名); });
    await expected(async () => { expect(await 件数(page), "検索結果の該当件数").toBe(期待); });
  };
}

/** もう一つのブラウザ（ブラウザB）で同じ管理者でログインし、デッキ編集画面を開いて削除する */
async function ブラウザBで削除する(browser: Browser, デッキID: string): Promise<void> {
  await withAdminSession(browser, M1505_ADMIN, async (b) => {
    b.setDefaultTimeout(60_000);
    await b.goto(adminUrl(`/deck/${デッキID}/edit`));
    const e = new デッキ編集画面(b);
    await e.読み込みを待つ();
    await e.削除する(true);
    const 帯 = await e.成功の帯();
    if (!帯.some((t) => t.includes("削除しました"))) throw new Error(`ブラウザBでデッキ（ID ${デッキID}）を削除できない: ${(await e.エラーの帯()).join(" / ")}`);
  });
}

/** 12件のうち2ページ目の「…-01」を削除して、2ページ目に戻るかを見る（108・195） */
function ページ復帰(stem: string, 並べ替え: boolean, 削除のメッセージ: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const l = new デッキ一覧(page);
    const 一 = 名(`${stem}-01`), 二 = 名(`${stem}-02`);
    let n = 1;
    await step(n++, async () => { await デッキ名で検索する(page, 名(stem)); });
    await step(n++, async () => {
      if (並べ替え) {
        await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並べ替え項目.selectOption({ label: "デッキID" })]);
        await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並び順.selectOption({ label: "降順" })]);
        await l.結果を待つ();
      }
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
      await l.結果を待つ();
    });
    await step(n++, async () => {
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(".pagination a.page-link").filter({ hasText: /^\s*2\s*$/ }).first().click()]);
      await l.結果を待つ();
      note(`2ページ目のデッキ: ${(await l.表示されたデッキ名()).join("、")}`);
    });
    await step(n++, async () => {
      const e = await デッキ情報を開く(page, 一);
      await e.削除する(true);
    });
    if (削除のメッセージ) await step(n++, async () => { await page.waitForLoadState("load"); });
    await expected(async () => {
      if (削除のメッセージ) expect.soft((await new デッキ編集画面(page).成功の帯()).join(" / "), "表示されたメッセージ").toContain("削除しました");
      expect.soft(パス(page), "表示された画面（デッキ検索の2ページ目）").toMatch(/\/deck\/search\/2$/);
      const names = await l.表示されたデッキ名();
      expect.soft(names.includes(二), `「${stem}-02」が表示されている`).toBe(true);
      expect(names.includes(一), `「${stem}-01」が表示されている`).toBe(false);
    });
  };
}

caseTest("IT-M15-05-037", async ({ page, step, expected }) => {
  await login(page);
  const e = await 新規を開く(page, step);
  const X日 = 名("M1505-037-稲妻"), X英 = 名("M1505-037-Bolt");
  await step(3, async () => { note("「代表カード検索」は画面では「代表カード選択」"); await e.代表カード選択ボタン.click(); await expect(e.代表カード検索画面, "代表カード検索の画面").toBeVisible(); });
  await step(4, async () => {
    note("検索の画面のボタンの表示名は「検索」");
    await e.代表カード検索画面.locator("#card_image_search_word").fill(X英);
    await e.代表カード検索画面.locator("#btn_search_card_image").click();
    await expect(e.代表カード検索画面.locator("#card_image_search_results table, #card_image_search_results p").first(), "代表カード検索の結果").toBeVisible();
  });
  await step(5, async () => {
    const X = e.代表カード検索画面.locator(`button.select-card-image[data-name="${X日}"]`);
    await expect(X, "検索結果のカードXの行").toHaveCount(1);
    await X.click();
  });
  await expected(async () => {
    await expect.soft(e.代表カード検索画面, "ポップアップが閉じる").toBeHidden();
    const r = await e.代表カード();
    expect.soft(r.名前, "代表カードの名前の欄（カードX）").toContain(X日);
    const url = カード画像.get(X英);
    expect(r.画像, "代表カードの画像（カードXの画像）").toContain((url ?? "（カードXの画像URLを読めていない）").replace(/^\//, ""));
  });
});

// ---------------------------------------------------------------- 連鎖: アーキタイプ管理の登録デッキ数（152〜155）
// 正本の「検索する >」は、アーキタイプ管理の画面では「検索する」。フォーマット・アーキタイプ・デッキの名前は前半「RJ1505-00n」に実行の印を付けている。

/** アーキタイプ管理（検索入力）でアーキタイプ名を検索し、名前が一致する行の登録デッキ数を返す（無ければ null） */
async function 登録デッキ数(page: Page, 語: string, 型s: string[]): Promise<Record<string, string | null>> {
  const rows = await アーキタイプを検索する(page, 語);
  const out: Record<string, string | null> = {};
  for (const t of 型s) out[t] = rows.find((r) => r.名日 === t)?.登録デッキ数 ?? null;
  return out;
}

caseTest("IT-M15-05-152", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const 型 = RJ名("RJ1505-001-型");
  await step(1, async () => { await login(page, M1505_RJ); });
  let 前: Record<string, string | null> = {};
  await step(2, async () => { note("「検索する >」は画面では「検索する」"); 前 = await 登録デッキ数(page, 型, [型]); });
  await step(3, async () => { note(`登録前の登録デッキ数: ${前[型]}`); expect.soft(前[型], `登録前の「${型}」の登録デッキ数`).toBe("0"); });
  let e!: デッキ編集画面;
  await step(4, async () => {
    const l = new デッキ一覧(page); await l.開く();
    e = await 新規登録画面を開く(page, l);
    await e.入力する({ デッキ名: RJ名("RJ1505-001-デッキ"), デッキ種別: "event", フォーマット: RJ名("RJ1505-001-フォーマット"), アーキタイプ: 型, 公開状態: "非公開" });
  });
  await step(5, async () => { await e.送信する(e.新規登録ボタン); note(`登録後の表示: ${(await e.成功の帯()).join(" / ")}`); });
  let 後: Record<string, string | null> = {};
  await step(6, async () => { 後 = await 登録デッキ数(page, 型, [型]); });
  await expected(async () => { expect(後[型], `「${型}」の登録デッキ数`).toBe("1"); });
});

function 連鎖の更新(no: string, label: string, 型s: string[], 前の数: string[], 操作: (e: デッキ編集画面) => Promise<void>, 後の数: string[]): CaseBody {
  return async ({ page, step, expected, notes }) => {
    page.setDefaultTimeout(60_000);
    const 語 = RJ名(`RJ1505-${no}-型`);
    const 名s = 型s.map(RJ名);
    await step(1, async () => { await login(page, M1505_RJ); });
    let 前: Record<string, string | null> = {};
    await step(2, async () => { note("「検索する >」は画面では「検索する」"); 前 = await 登録デッキ数(page, 語, 名s); });
    await step(3, async () => {
      note(`操作前の登録デッキ数: ${名s.map((n) => `${n}=${前[n]}`).join("、")}`);
      名s.forEach((n, i) => expect.soft(前[n], `操作前の「${n}」の登録デッキ数`).toBe(前の数[i]));
    });
    await step(4, async () => {
      const l = new デッキ一覧(page); await l.開く();
      await l.日付クリア.click();
      await l.f("deck_id").fill(notes.get(label));
      await l.検索する();
    });
    let e!: デッキ編集画面;
    await step(5, async () => {
      const link = new デッキ一覧(page).行(notes.get(label)).locator("td").nth(1).locator("a").first();
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
      e = new デッキ編集画面(page); await e.読み込みを待つ();
    });
    await step(6, async () => { await 操作(e); note(`操作後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
    let 後: Record<string, string | null> = {};
    await step(7, async () => { 後 = await 登録デッキ数(page, 語, 名s); });
    await expected(async () => {
      名s.forEach((n, i) => expect.soft(後[n], `「${n}」の登録デッキ数`).toBe(後の数[i]));
      expect(名s.map((n) => 後[n]), "登録デッキ数（まとめ）").toEqual(後の数);
    });
  };
}
caseTest("IT-M15-05-153", 連鎖の更新("002", "〔デッキID-M1505-RJ002〕", ["RJ1505-002-型"], ["0"], async (e) => { await chooseByLabel(e.デッキ種別, "event"); await e.送信する(e.更新ボタン); }, ["1"]));
caseTest("IT-M15-05-154", 連鎖の更新("003", "〔デッキID-M1505-RJ003〕", ["RJ1505-003-型"], ["1"], async (e) => { await e.削除する(true); }, ["0"]));
caseTest("IT-M15-05-155", 連鎖の更新("004", "〔デッキID-M1505-RJ004〕", ["RJ1505-004-型甲", "RJ1505-004-型乙"], ["1", "0"], async (e) => { await e.アーキタイプを選ぶ(RJ名("RJ1505-004-型乙")); await e.送信する(e.更新ボタン); }, ["0", "1"]));

// ---------------------------------------------------------------- 連携: 店頭のデッキリスト詳細（137・139）
// 名前は前半（「QM1505-00n」）に実行の印を付けている。

/** デッキ一覧で「日付クリア」を押し、デッキIDで検索して、検索結果のデッキ情報を押す（手順の2つ分） */
async function デッキIDで開く(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, デッキID: string, n1: number): Promise<デッキ編集画面> {
  await step(n1, async () => {
    const l = new デッキ一覧(page); await l.開く();
    await l.日付クリア.click();
    await l.f("deck_id").fill(デッキID);
    await l.検索する();
  });
  let e!: デッキ編集画面;
  await step(n1 + 1, async () => {
    const link = new デッキ一覧(page).行(デッキID).locator("td").nth(1).locator("a").first();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    e = new デッキ編集画面(page); await e.読み込みを待つ();
  });
  return e;
}

caseTest("IT-M15-05-137", async ({ page, step, expected, notes }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get("〔デッキID-M1505-002〕");
  await step(1, async () => {
    const st = await デッキリスト詳細を開く(page, id);
    const info = await 情報欄(page);
    note(`更新前のデッキリスト詳細（HTTP ${st}）: デッキ名「${info["デッキ名"]}」・大会名「${info["大会名"]}」・成績「${info["成績"]}」`);
    expect.soft(info["デッキ名"], "更新前の情報欄のデッキ名").toBe(QM名("QM1505-002-デッキ旧"));
  });
  await step(2, async () => { await login(page, M1505_QM); });
  const e = await デッキIDで開く(page, step, id, 3);
  await step(5, async () => {
    await e.入力する({ デッキ名: QM名("QM1505-002-デッキ新"), イベント名日: QM名("QM1505-002-大会新"), 成績: QM名("QM1505-002-成績新"), 引用元URL: "https://example.com/qm1505-002-new" });
    await e.送信する(e.更新ボタン);
    note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`);
  });
  let info: Record<string, string> = {};
  await step(6, async () => { await デッキリスト詳細を開く(page, id); info = await 情報欄(page); });
  await expected(async () => {
    expect.soft(info["デッキ名"], "情報欄のデッキ名").toBe(QM名("QM1505-002-デッキ新"));
    expect.soft(info["大会名"], "情報欄の大会名").toBe(QM名("QM1505-002-大会新"));
    expect.soft(info["成績"], "情報欄の成績").toContain(QM名("QM1505-002-成績新"));
    expect(info["引用元URL"], "情報欄の引用元URL").toBe("https://example.com/qm1505-002-new");
  });
});

caseTest("IT-M15-05-139", async ({ page, step, expected, notes }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get("〔デッキID-M1505-004〕");
  await step(1, async () => {
    await デッキリスト詳細を開く(page, id);
    const info = await 情報欄(page);
    expect.soft(info["デッキ名"], "削除前の情報欄のデッキ名").toBe(QM名("QM1505-004-デッキ"));
  });
  await step(2, async () => { await login(page, M1505_QM); });
  const e = await デッキIDで開く(page, step, id, 3);
  await step(5, async () => { await e.削除する(true); note(`削除後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`); });
  let status = 0, info: Record<string, string> = {};
  await step(6, async () => { status = await デッキリスト詳細を開く(page, id); info = await 情報欄(page); });
  await expected(async () => {
    expect.soft(status, "開き直したデッキリスト詳細の応答（HTTPステータス）").toBe(404);
    expect(info["デッキ名"] === QM名("QM1505-004-デッキ"), "デッキ名「QM1505-004-デッキ」の情報欄が表示されている").toBe(false);
  });
});

// ---------------------------------------------------------------- 代表カードと現行フォーマットの警告（新規登録）

type 新規の代表カード = { no: string; フォーマット: string; アーキタイプ: string; 代表カード?: string; ボード: { メイン?: string; 統率?: string; サイド?: string };
  期待の代表カード: string; 違うカード?: string; 期待のボード: { メイン?: string[]; 統率?: string[]; サイド?: string[] } };

function 新規で代表カード(v: 新規の代表カード): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    const e = await 新規を開く(page, step);
    await step(3, async () => { await e.入力する({ デッキ名: 名(`M1505-CB${v.no}-デッキ`), フォーマット: v.フォーマット, アーキタイプ: v.アーキタイプ, 公開状態: "非公開" }); });
    await step(4, async () => {
      if (v.代表カード) { note("「代表カード検索」は画面では「代表カード選択」。検索の画面のボタンは「検索」、行のボタンは「決定」"); await e.代表カードを選ぶ(v.代表カード); }
      else note("代表カードは選ばない");
    });
    await step(5, async () => { await e.入力する({ メイン: v.ボード.メイン ?? "", 統率: v.ボード.統率 ?? "", サイド: v.ボード.サイド ?? "" }); });
    await step(6, async () => { await e.送信する(e.新規登録ボタン); });
    let 警告: string[] = [];
    await step(7, async () => { await e.読み込みを待つ(); 警告 = await e.警告(); });
    await expected(async () => {
      expect.soft(パス(page), "登録後の画面（デッキ編集画面）").toMatch(/\/deck\/\d+\/edit$/);
      await 代表カードを確かめる(e, v.期待の代表カード, v.違うカード);
      for (const [k, l] of [["メイン", e.メイン], ["統率", e.統率], ["サイド", e.サイド]] as const) {
        const want = v.期待のボード[k] ?? [];
        expect.soft(行(await l.inputValue()), `「${k === "メイン" ? "メインボード" : k === "サイド" ? "サイドボード" : "統率"}」の行`).toEqual(want);
      }
      expect(警告.some((t) => t.includes(規格外の警告)), `「${規格外の警告}」の警告が表示されている`).toBe(false);
    });
  };
}

// ---------------------------------------------------------------- 2026-11-10 に足したケース

// 複製（公開状態=公開でイベント名・開催日が空のデッキ。公開状態は一括編集で公開にした。シード作成時の問題に残る）
caseTest("IT-M15-05-113", 複製して数える("113", "1", 2));

// ---------------------------------------------------------------- セッションの有効期限切れ（127〜130）
// 管理画面のセッションの有効期間は、設定を変えていなければ1440秒（シード表）。それを超える1500秒、画面を開いたまま何も操作せずに待つ。

const セッションが切れるまで待つ秒 = 1500;
async function セッションが切れるまで待つ(page: Page): Promise<void> {
  note(`管理画面のセッションの有効期間（設定を変えていなければ1440秒）を超える${セッションが切れるまで待つ秒}秒、画面を開いたまま、ほかのタブでも管理画面を操作せずに待った`);
  await page.waitForTimeout(セッションが切れるまで待つ秒 * 1000);
}

function 期限切れで削除(no: string, 見るもの: "メッセージ" | "遷移"): CaseBody {
  return async ({ page, step, expected }) => {
    test.setTimeout(50 * 60_000);
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    await step(3, async () => { await セッションが切れるまで待つ(page); });
    await step(4, async () => { await e.削除する(true); note(`削除を押したあとの表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}（${パス(page)}）`); });
    await expected(async () => {
      if (見るもの === "メッセージ") await expect(page.getByText("セッションがタイムアウトしました。もう一度やり直してください。").first(), "「セッションがタイムアウトしました。もう一度やり直してください。」の表示").toBeVisible();
      else expect(パス(page), "遷移した画面（デッキ検索・一覧画面）").toBe(一覧のパス);
    });
  };
}
caseTest("IT-M15-05-127", 期限切れで削除("127", "メッセージ"));
caseTest("IT-M15-05-128", 期限切れで削除("128", "遷移"));

function 期限切れで複製(no: string, 見るもの: "メッセージ" | "遷移"): CaseBody {
  return async ({ page, step, expected, notes }) => {
    test.setTimeout(50 * 60_000);
    await login(page);
    const e = await 検索して開く(page, step, `M1505-${no}-デッキ`);
    await step(3, async () => { await e.複製の画面を開く(); await e.複製回数.fill("1"); });
    await step(4, async () => { await セッションが切れるまで待つ(page); });
    await step(5, async () => { await e.送信する(e.複製保存ボタン); note(`「複製保存」を押したあとの表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}（${パス(page)}）`); });
    await expected(async () => {
      if (見るもの === "メッセージ") await expect(page.getByText("セッションがタイムアウトしました。もう一度やり直してください。").first(), "「セッションがタイムアウトしました。もう一度やり直してください。」の表示").toBeVisible();
      else {
        expect.soft(パス(page), "遷移した画面（このデッキのデッキ編集画面）").toBe(new URL(adminUrl(`/deck/${notes.get(`〔デッキID-M1505-${no}〕`)}/edit`)).pathname);
        await e.読み込みを待つ();
        expect(await e.デッキ名.inputValue(), "デッキ編集画面のデッキ名").toBe(名(`M1505-${no}-デッキ`));
      }
    });
  };
}
caseTest("IT-M15-05-129", 期限切れで複製("129", "メッセージ"));
caseTest("IT-M15-05-130", 期限切れで複製("130", "遷移"));

// ---------------------------------------------------------------- 連携: 店頭のデッキ検索（136・138・140〜143）
// 名前は前半（「QM1505-00n」「M15-05」）に実行の印を付けている（140 だけは正本の名前のまま。シード作成時の問題に残る）。

const 該当なしの文 = "ご指定の条件に一致するデッキが見つかりませんでした。";

/** デッキ検索TOPを開き、「詳細検索」のモーダルで「クリア」を押してプレイヤー名を入れ、「検索」を押す */
async function 店頭でプレイヤー名を検索する(page: Page, プレイヤー名: string): Promise<void> {
  note("「クリア」「検索」は、デッキ検索TOPの「詳細検索」で開くデッキ詳細検索のモーダルにある。モーダルを開いて操作した");
  await new DeckTopPage(page).開く();
  const m = new DeckSearchModal(page);
  await m.開く();
  await m.クリアする();
  await m.入れる("player", プレイヤー名);
  await m.検索する();
}

/** 管理画面のデッキ一覧で「新規登録」を押し、入力して「新規登録」を押す */
async function 管理画面で新規登録する(page: Page, v: Parameters<デッキ編集画面["入力する"]>[0]): Promise<void> {
  const l = new デッキ一覧(page);
  await l.開く();
  const e = await 新規登録画面を開く(page, l);
  await e.入力する(v);
  await e.送信する(e.新規登録ボタン);
  note(`登録後の表示: ${[...await e.成功の帯(), ...await e.警告(), ...await e.エラーの帯()].join(" / ")}（${パス(page)}）`);
}

caseTest("IT-M15-05-136", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const 選手 = QM名("QM1505-001-選手");
  await step(1, async () => { await 店頭でプレイヤー名を検索する(page, 選手); });
  await step(2, async () => {
    const r = await 一覧を読む(page);
    expect.soft(r.該当なし, "登録前の一覧の領域の案内").toBe(該当なしの文);
    expect.soft(r.行.map((x) => x.プレイヤー), "登録前の一覧の行").toEqual([]);
  });
  await step(3, async () => { await login(page, M1505_QM); });
  await step(4, async () => {
    await 管理画面で新規登録する(page, {
      デッキ種別: "event", フォーマット: QM名("M15-05-フォーマット"), アーキタイプ: QM名("M15-05-型"), 公開状態: "公開", プレイヤー名: 選手,
      イベント名日: QM名("QM1505-001-大会"), イベント名英: QM名("QM1505-001-Event"), 開催日: "2025/03/10 10:00", 順位: "1", 成績: QM名("QM1505-001-成績"), 参加人数: "24",
    });
  });
  let r: Awaited<ReturnType<typeof 一覧を読む>> = { 行: [], 該当なし: "" };
  await step(5, async () => { await 店頭でプレイヤー名を検索する(page, 選手); r = await 一覧を読む(page); });
  await expected(async () => {
    const hit = r.行.filter((x) => x.プレイヤー === 選手);
    expect(hit.length, `一覧のプレイヤー「${選手}」の行の数`).toBe(1);
    expect.soft(hit[0]?.アーキタイプ, "アーキタイプ").toBe(`${QM名("M15-05-型")}/${rc("QM1505-Type")}`);
    expect.soft(hit[0]?.大会名, "大会名").toBe(QM名("QM1505-001-大会"));
    expect.soft(hit[0]?.成績, "成績").toBe(QM名("QM1505-001-成績"));
    expect.soft(hit[0]?.参加人数, "参加人数").toBe("24");
    expect.soft(hit[0]?.開催日, "開催日").toBe("2025/03/10");
  });
});

caseTest("IT-M15-05-138", async ({ page, step, expected, notes }) => {
  page.setDefaultTimeout(60_000);
  const 選手 = QM名("QM1505-003-選手");
  const id = notes.get("〔デッキID-M1505-003〕");
  await step(1, async () => { await 店頭でプレイヤー名を検索する(page, 選手); });
  await step(2, async () => {
    const r = await 一覧を読む(page);
    expect.soft(r.行.filter((x) => x.プレイヤー === 選手).length, `変更前の一覧のプレイヤー「${選手}」の行の数`).toBe(1);
  });
  await step(3, async () => { await login(page, M1505_QM); });
  const e = await デッキIDで開く(page, step, id, 4);
  await step(6, async () => {
    await chooseByLabel(e.公開状態, "非公開");
    await e.送信する(e.更新ボタン);
    note(`更新後の表示: ${[...await e.成功の帯(), ...await e.エラーの帯()].join(" / ")}`);
  });
  let r: Awaited<ReturnType<typeof 一覧を読む>> = { 行: [], 該当なし: "" };
  await step(7, async () => { await 店頭でプレイヤー名を検索する(page, 選手); r = await 一覧を読む(page); });
  await expected(async () => {
    expect.soft(r.該当なし, "一覧の領域の案内").toBe(該当なしの文);
    expect(r.行.some((x) => x.プレイヤー === 選手), `一覧にプレイヤー「${選手}」の行が表示されている`).toBe(false);
  });
});

caseTest("IT-M15-05-140", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const 選手 = "QM1505-005-選手";
  const 開く = async () => {
    const top = new DeckTopPage(page);
    await top.開く();
    const st = await new OthersListPage(page).開く(top);
    note(`その他デッキ一覧の応答: HTTP ${st}`);
  };
  await step(1, async () => { await 開く(); });
  await step(2, async () => {
    const r = await 一覧を読む(page);
    expect.soft(r.該当なし, "登録前の一覧の領域の案内").toBe(該当なしの文);
    expect.soft(r.行.length, "登録前の一覧の行の数").toBe(0);
  });
  await step(3, async () => { await login(page, M1505_QM); });
  await step(4, async () => {
    await 管理画面で新規登録する(page, {
      デッキ種別: "event", フォーマット: "QM1505-005-フォーマット", アーキタイプ: "QM1505-005-型", 公開状態: "公開", プレイヤー名: 選手,
      イベント名日: "QM1505-005-大会", イベント名英: "QM1505-005-Event", 開催日: "2025/03/10 10:00", 順位: "1", 成績: "QM1505-005-成績", 参加人数: "30",
    });
  });
  let r: Awaited<ReturnType<typeof 一覧を読む>> = { 行: [], 該当なし: "" };
  await step(5, async () => { await 開く(); r = await 一覧を読む(page); });
  await expected(async () => {
    const hit = r.行.filter((x) => x.プレイヤー === 選手);
    expect(hit.length, `その他デッキ一覧のプレイヤー「${選手}」の行の数`).toBe(1);
    expect.soft(hit[0]?.アーキタイプ, "アーキタイプ").toBe("QM1505-005-型/QM1505-005-Type");
    expect.soft(hit[0]?.大会名, "大会名").toBe("QM1505-005-大会");
    expect.soft(hit[0]?.成績, "成績").toBe("QM1505-005-成績");
    expect.soft(hit[0]?.参加人数, "参加人数").toBe("30");
    expect.soft(hit[0]?.開催日, "開催日").toBe("2025/03/10");
  });
});

/** 指定の時刻から秒数が過ぎるまで待つ（キャッシュの保持時間が過ぎるのを待つ） */
async function 時刻から待つ(page: Page, 起点: number, 秒: number, 何から: string): Promise<void> {
  const rest = 起点 + 秒 * 1000 - Date.now();
  note(`${何から}（${new Date(起点).toISOString()}）から${秒}秒が過ぎるまで、さらに${Math.max(0, Math.ceil(rest / 1000))}秒待った`);
  if (rest > 0) await page.waitForTimeout(rest);
}

/** メタゲーム一覧の行から、アーキタイプ名ごとのデッキ数・使用率を引く */
const 行の値 = (rows: { 名前: string; デッキ数: string; 使用率: string }[], 名前: string) => rows.find((x) => x.名前 === 名前);

caseTest("IT-M15-05-141", async ({ page, step, expected, notes }) => {
  test.setTimeout(100 * 60_000);
  page.setDefaultTimeout(60_000);
  const fid = notes.get("〔フォーマットID-M1505-006〕");
  const 甲 = QM名("QM1505-006-型甲"), 乙 = QM名("QM1505-006-型乙");
  const m = new MetagamePage(page);
  let 起点 = 0;
  await step(1, async () => { await m.開く(fid); await m.読み込みを待つ(); 起点 = Date.now(); });
  await step(2, async () => {
    const rows = await m.行();
    expect.soft(`${行の値(rows, 甲)?.デッキ数}・${行の値(rows, 甲)?.使用率}`, `登録前の「${甲}」のデッキ数・使用率`).toBe("1・50.00%");
    expect.soft(`${行の値(rows, 乙)?.デッキ数}・${行の値(rows, 乙)?.使用率}`, `登録前の「${乙}」のデッキ数・使用率`).toBe("1・50.00%");
  });
  await step(3, async () => { await login(page, M1505_QM); });
  await step(4, async () => {
    await 管理画面で新規登録する(page, {
      デッキ種別: "event", フォーマット: QM名("QM1505-006-フォーマット"), アーキタイプ: 甲, 公開状態: "公開", プレイヤー名: QM名("QM1505-006-選手丙"),
      イベント名日: QM名("QM1505-006-大会"), イベント名英: QM名("QM1505-006-Event"), 開催日: 五日前の10時(), 順位: "3", 成績: QM名("QM1505-006-成績丙"), 参加人数: "20",
    });
  });
  await step(5, async () => { await 時刻から待つ(page, 起点, 3601, "手順1でメタゲーム一覧を表示した時刻"); });
  let rows: Awaited<ReturnType<MetagamePage["行"]>> = [];
  await step(6, async () => { await m.開く(fid); await m.読み込みを待つ(); rows = await m.行(); });
  await expected(async () => {
    expect.soft(行の値(rows, 甲)?.デッキ数, `「${甲}」のデッキ数`).toBe("2");
    expect.soft(行の値(rows, 甲)?.使用率, `「${甲}」の使用率`).toBe("66.67%");
    expect.soft(行の値(rows, 乙)?.デッキ数, `「${乙}」のデッキ数`).toBe("1");
    expect(行の値(rows, 乙)?.使用率, `「${乙}」の使用率`).toBe("33.33%");
  });
});

caseTest("IT-M15-05-142", async ({ page, step, expected, notes }) => {
  test.setTimeout(100 * 60_000);
  page.setDefaultTimeout(60_000);
  const fid = notes.get("〔フォーマットID-M1505-007〕");
  const カード = QM名("QM1505-007-カード");
  const rk = new UsageRankingPage(page);
  let 起点 = 0;
  await step(1, async () => { await new MetagamePage(page).開く(fid); await rk.入口を押す(); });
  await step(2, async () => {
    await rk.切替を押す("スペル");
    起点 = Date.now();
    const rows = await rk.件を読む("スペル");
    expect.soft(`${rows[0]?.名前}・${rows[0]?.枚数}`, "登録前のスペルのランキングの1位（カード名・枚数）").toBe(`${カード}・4`);
  });
  await step(3, async () => { await login(page, M1505_QM); });
  await step(4, async () => {
    await 管理画面で新規登録する(page, {
      デッキ種別: "event", フォーマット: QM名("QM1505-007-フォーマット"), アーキタイプ: QM名("QM1505-007-型"), 公開状態: "公開", プレイヤー名: QM名("QM1505-007-選手乙"),
      イベント名日: QM名("QM1505-007-大会"), イベント名英: QM名("QM1505-007-Event"), 開催日: 五日前の10時(), 順位: "2", 成績: QM名("QM1505-007-成績乙"), 参加人数: "20",
      メイン: `3 ${カード}`,
    });
  });
  await step(5, async () => { await 時刻から待つ(page, 起点, 3601, "手順2でスペルのランキングを表示した時刻"); });
  let rows: Awaited<ReturnType<UsageRankingPage["件を読む"]>> = [];
  await step(6, async () => {
    await 採用枚数ランキングを開く(page, fid);
    await rk.読み込みを待つ();
    await rk.切替を押す("スペル");
    rows = await rk.件を読む("スペル");
  });
  await expected(async () => {
    expect.soft(rows[0]?.名前, "スペルのランキングの1位のカード").toBe(カード);
    expect(rows[0]?.枚数, `1位（${カード}）の枚数`).toBe(7);
  });
});

caseTest("IT-M15-05-143", async ({ page, step, expected }) => {
  test.setTimeout(100 * 60_000);
  page.setDefaultTimeout(60_000);
  const fmt = QM名("QM1505-008-フォーマット");
  const 甲 = QM名("QM1505-008-型甲"), 乙 = QM名("QM1505-008-型乙");
  const top = new DeckTopPage(page);
  const 数 = (a: { 名前: string; デッキ数: string }[], 名前: string) => a.find((x) => x.名前 === 名前)?.デッキ数;
  let 起点 = 0;
  await step(1, async () => {
    await top.開く();
    起点 = Date.now();
    const a = await top.アーキタイプ(fmt);
    expect.soft(数(a, 甲), `登録前の「${甲}」のデッキ数`).toBe("デッキ数：1");
    expect.soft(数(a, 乙), `登録前の「${乙}」のデッキ数`).toBe("デッキ数：1");
  });
  await step(2, async () => { await login(page, M1505_QM); });
  await step(3, async () => {
    await 管理画面で新規登録する(page, {
      デッキ種別: "event", フォーマット: fmt, アーキタイプ: 甲, 公開状態: "公開", プレイヤー名: QM名("QM1505-008-選手丙"),
      イベント名日: QM名("QM1505-008-大会"), イベント名英: QM名("QM1505-008-Event"), 開催日: 五日前の10時(), 順位: "3", 成績: QM名("QM1505-008-成績丙"), 参加人数: "20",
    });
  });
  await step(4, async () => { await 時刻から待つ(page, 起点, 3601, "手順1でデッキ検索TOPを表示した時刻"); });
  let a: { 名前: string; デッキ数: string }[] = [];
  await step(5, async () => { await top.開く(); a = await top.アーキタイプ(fmt); });
  await expected(async () => {
    expect.soft(数(a, 甲), `「${fmt}」のメタゲームの区画の「${甲}」のデッキ数`).toBe("デッキ数：2");
    expect(数(a, 乙), `「${fmt}」のメタゲームの区画の「${乙}」のデッキ数`).toBe("デッキ数：1");
  });
});

