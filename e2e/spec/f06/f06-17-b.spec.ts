/** F06-17 大会デッキ登録確認〜完了（フロント）の続き。正本: cases/F06-17_test_cases.tsv。前の担当が未着手だったケースを、f06-17.spec.ts を変えずにここへ書く */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { RUN_MARK } from "../../lib/run_marker";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { DeckEditPage } from "../../pages/front/f06_16_deck_entry";
import * as DB from "../../db/f06_16";
import { カード名, 英名 } from "../../pages/admin/f06_17_setup";
import { 会員一覧B as 会員一覧, 大会一覧B as 大会一覧, 提出したデッキB, 保持するプレイヤー名 } from "../../seeds/f06-17-b";
import "../../seeds/f06-17-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 会員 = (n: string) => { const m = 会員一覧.get(n); if (!m) throw new Error(`会員 ${n} が作られていない`); return m; };
const 大会 = (n: string) => { const d = 大会一覧.get(n); if (!d) throw new Error(`大会 ${n} が作られていない`); return d; };
const A = () => 英名("NormalA", RUN_MARK);
const B = () => 英名("NormalB", RUN_MARK);

async function ログイン(page: Page, n: string): Promise<DeckEditPage> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(120_000);
  await frontLogin(page, 会員(n));
  return new DeckEditPage(page);
}
const カード要約 = (id: string): string[] => DB.デッキのカード情報(id).map((c) => `${c.ボード}:${c.カード名}:${c.枚数}`).sort();
async function フォーマットを入れる(e: DeckEditPage): Promise<void> {
  if ((await e.フォーマット選択肢()).length > 1) await e.フォーマットを選ぶ("スタンダード試験");
  else note("イベントのフォーマットは「スタンダード試験」だけで、フォーマットの選択欄は出ない（画面の作り）。そのまま入力して提出した");
}
type Step = (n: number, f: () => Promise<void>) => Promise<void>;

/** 上書きのケースの操作（手順1〜4）。確かめは各ケースの expected で行う */
async function 上書きの操作(page: Page, n: string, step: Step): Promise<DB.大会デッキ[]> {
  const e = await ログイン(page, n);
  const d = 大会(n);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await フォーマットを入れる(e); await e.入力する("メイン", `2 ${カード名.通常A()}`); await e.入力する("サイド", `1 ${カード名.通常B()}`); });
  await step(3, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(4, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員(n).選手ID); });
  return decks;
}

caseTest("IT-F06-17-005", async ({ page, step, expected }) => {
  const decks = await 上書きの操作(page, "005", step);
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキの件数（追加されない）").toBe(1);
    const k = decks[0];
    expect.soft(k?.デッキID, "上書きされたデッキのID（最初に提出したデッキと同じ）").toBe(提出したデッキB.get("005"));
    expect.soft(k ? カード要約(k.デッキID) : [], "再登録されたカード行（旧カードの行は無い）").toEqual([`Main Board:${A()}:2`, `Side Board:${B()}:1`]);
    expect.soft(k?.編集者あり, "編集者情報が設定されている").toBe(false);
  });
});

caseTest("IT-F06-17-045", async ({ page, step, expected }) => {
  const decks = await 上書きの操作(page, "045", step);
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキの件数（追加されない）").toBe(1);
    const k = decks[0];
    expect.soft(k?.デッキID, "上書きされたデッキのID（最初に提出したデッキと同じ）").toBe(提出したデッキB.get("045"));
    expect.soft(k ? カード要約(k.デッキID) : [], "再登録されたカード行（旧カードの行は無い）").toEqual([`Main Board:${A()}:2`, `Side Board:${B()}:1`]);
    expect.soft(k?.プレイヤー名, "プレイヤー名（変わらない）").toBe(保持するプレイヤー名("045"));
  });
});

caseTest("IT-F06-17-046", async ({ page, step, expected }) => {
  const decks = await 上書きの操作(page, "046", step);
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキの件数（追加されない）").toBe(1);
    const k = decks[0];
    expect.soft(k?.デッキID, "上書きされたデッキのID（最初に提出したデッキと同じ）").toBe(提出したデッキB.get("046"));
    expect.soft(k ? カード要約(k.デッキID) : [], "再登録されたカード行（旧カードの行は無い）").toEqual([`Main Board:${A()}:2`, `Side Board:${B()}:1`]);
    expect.soft(k?.プレイヤー名, "プレイヤー名（変わらない）").toBe(保持するプレイヤー名("046"));
  });
});

caseTest("IT-F06-17-047", async ({ page, step, expected }) => {
  const decks = await 上書きの操作(page, "047", step);
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキの件数（追加されない）").toBe(1);
    const k = decks[0];
    expect.soft(k?.デッキID, "上書きされたデッキのID（最初に提出したデッキと同じ）").toBe(提出したデッキB.get("047"));
    expect.soft(k ? カード要約(k.デッキID) : [], "再登録されたカード行（旧カードの行は無い）").toEqual([`Main Board:${A()}:2`, `Side Board:${B()}:1`]);
    expect.soft(k?.プレイヤー名, "プレイヤー名（変わらない）").toBe(保持するプレイヤー名("047"));
  });
});

caseTest("IT-F06-17-048", async ({ page, step, expected }) => {
  const decks = await 上書きの操作(page, "048", step);
  await expected(async () => {
    expect.soft(decks.length, "このイベント詳細・選手のデッキの件数（追加されない）").toBe(1);
    const k = decks[0];
    expect.soft(k?.デッキID, "上書きされたデッキのID（最初に提出したデッキと同じ）").toBe(提出したデッキB.get("048"));
    expect.soft(k ? カード要約(k.デッキID) : [], "再登録されたカード行（旧カードの行は無い）").toEqual([`Main Board:${A()}:2`, `Side Board:${B()}:1`]);
    expect.soft(k?.プレイヤー名, "プレイヤー名（変わらない）").toBe(保持するプレイヤー名("048"));
  });
});

/** 新規提出のケースの操作（手順1〜4）。確かめは各ケースの expected で行う */
async function 新規提出の操作(page: Page, n: string, step: Step): Promise<DB.大会デッキ[]> {
  const e = await ログイン(page, n);
  const d = 大会(n);
  await step(1, async () => { await e.開く(d.日程ID); await expect(e.メイン).toBeVisible(); });
  await step(2, async () => { await フォーマットを入れる(e); await e.入力する("メイン", `1 ${カード名.通常A()}`); await e.入力する("サイド", `1 ${カード名.通常B()}`); });
  await step(3, async () => { await e.提出する(); });
  let decks: DB.大会デッキ[] = [];
  await step(4, async () => { decks = DB.大会デッキ一覧(d.日程ID, 会員(n).選手ID); });
  return decks;
}

caseTest("IT-F06-17-006", async ({ page, step, expected }) => {
  const decks = await 新規提出の操作(page, "006", step);
  await expected(async () => {
    expect.soft(decks.length, "新規作成されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名").toBe("Alex Smith");
  });
});

caseTest("IT-F06-17-044", async ({ page, step, expected }) => {
  const decks = await 新規提出の操作(page, "044", step);
  await expected(async () => {
    expect.soft(decks.length, "新規作成されたデッキの件数").toBe(1);
    expect.soft(decks[0]?.プレイヤー名, "プレイヤー名").toBe("TEST TARO");
    expect.soft(decks[0]?.フォーマット名, "フォーマット").toBe("スタンダード試験");
  });
});

