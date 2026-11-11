// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * M15-04 一括編集（デッキ・管理画面）。ケースの正本: integration_test/casegen/cases/M15-04_test_cases.tsv
 *
 * - 決め打ちの名前（フォーマット・アーキタイプ・プレイヤー・イベント・カード）は、実行の印を付けて作っている（seeds/m15-04.ts）。
 *   手順・期待結果の同じ名前も、同じ印を付けた値として読む。
 * - 店頭のデッキ検索の「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押す（M15-09 と同じ）。
 * - 一括編集の区画の入力欄は、その項目の変更チェックを付けている間だけ表示される。値を選ぶ・入れるには先にチェックを付ける。
 *   「入力して、変更チェックはオフのまま」の項目は、チェックを付けて値を入れたあとチェックを外す（入れた値は欄に残り、一緒に送られる）。
 * - 実装しないケース: 004（手順に「3601秒以上待つ」があり、1件の実行の制限時間 1800秒を超える。M15-09 の 063・064 と同じ扱い）。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin, Account } from "../../lib/session";
import { デッキ一括編集, デッキIDで検索する, 一括編集の項目 } from "../../pages/admin/m15_04_bulk_edit";
import { アーキタイプ一覧 } from "../../pages/admin/m15_09_archetype_edit";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage, 結果の行 } from "../../pages/front/f09_02_deck_result";
import { デッキリスト詳細を開く, 情報欄 } from "../../pages/front/m15_05_deck_show";
import { M1504_QM, M1504_RJ, QM名, RJ名, CB名, CB番号 } from "../../seeds/m15-04-k";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 待ちを延ばす = (page: Page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); };
const クリアの注記 = "「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押した";
const 隠れる欄の注記 = (項目: string) => `一括編集の${項目}の入力欄は変更チェックを付けている間だけ表示されるため、チェックを付けて値を入れ、そのあとチェックを外した（入れた値は欄に残る）`;
const 先にチェックの注記 = (項目: string) => `一括編集の${項目}の入力欄は変更チェックを付けると表示されるため、先にチェックを付けてから値を選んだ・入れた`;

/** デッキ検索TOP→「詳細検索」→「クリア」→プレイヤー名→「検索」。デッキ検索結果の画面の行を返す */
async function 店頭でプレイヤーを検索する(page: Page, 選手: string): Promise<結果の行[]> {
  await new DeckTopPage(page).開く();
  const m = new DeckSearchModal(page);
  await m.開く();
  await m.クリアする();
  await m.入れる("player", 選手);
  await m.検索する();
  return new DeckResultPage(page).行();
}

/** 管理画面のデッキ一覧でデッキIDを検索し、そのデッキを選んで一括編集の区画を開く（手順「…検索する」「…選択し、一括編集を開く」） */
async function デッキを検索する(page: Page, デッキID: string) {
  const l = await デッキIDで検索する(page, デッキID);
  expect(await l.表示されたID(), `デッキID ${デッキID} の検索結果`).toEqual([デッキID]);
  return l;
}

/** 一括編集の変更チェックを付けて値を入れ、付けたままにするか外すかを決める */
type 入力 = { 項目: 一括編集の項目; 値: string; チェック: boolean };
async function 一括編集で入れる(b: デッキ一括編集, 入力: 入力[]): Promise<void> {
  for (const v of 入力) {
    await b.チェック(v.項目, true);
    if (v.項目 === "archetype") await b.アーキタイプを選ぶ(v.値);
    else if (v.項目 === "disp") await b.公開状態を選ぶ(v.値 as "公開" | "非公開" | "限定公開");
    else await b.入れる(v.項目 as "eventNameJp" | "playerName", v.値);
    if (!v.チェック) await b.チェック(v.項目, false);
  }
}
const 項目名: Partial<Record<一括編集の項目, string>> = { archetype: "アーキタイプ", disp: "公開状態", eventNameJp: "イベント名(日)", playerName: "プレイヤー名" };

/** 一覧のプレイヤーの行に見るもの: 行が無いこと（該当なしの案内が出る）か、1行あってアーキタイプ・大会名がこの値であること */
type 一覧の見え方 = { 該当なし: true } | { 該当なし?: false; アーキタイプ?: string; 大会名?: string };
type 店頭の型 = { 選手: string; 控え: string; 管理者: Account; 前: 一覧の見え方; 入力: 入力[]; 期待: 一覧の見え方 };

/**
 * 店頭の検索結果で見る型（002・005・007〜010）:
 * 1 店頭で検索 → 2 行を見る → 3 管理画面にログイン → 4 デッキIDで検索 → 5 選んで一括編集を開く → 6 入力 → 7 一括編集実行 → 8 店頭で検索
 */
function 店頭の一覧で見る(v: 店頭の型): CaseBody {
  return async ({ page, notes, step, expected }) => {
    待ちを延ばす(page);
    const id = notes.get(v.控え);
    const 自分の行 = (rows: 結果の行[]) => rows.filter((r) => r.プレイヤー === v.選手);
    let 行: 結果の行[] = [];
    await step(1, async () => { 行 = await 店頭でプレイヤーを検索する(page, v.選手); note(クリアの注記); });
    await step(2, async () => {
      const mine = 自分の行(行);
      expect(mine.length, `一覧のプレイヤー「${v.選手}」の行の数`).toBe(1);
      if (!v.前.該当なし && v.前.アーキタイプ !== undefined) expect(mine[0].アーキタイプ, "一覧の行のアーキタイプ").toBe(v.前.アーキタイプ);
      if (!v.前.該当なし && v.前.大会名 !== undefined) expect(mine[0].大会名, "一覧の行の大会名").toBe(v.前.大会名);
    });
    await step(3, async () => { await loginAdmin(page, v.管理者); });
    let l!: Awaited<ReturnType<typeof デッキを検索する>>;
    await step(4, async () => { l = await デッキを検索する(page, id); });
    const b = new デッキ一括編集(page);
    await step(5, async () => { await b.デッキを選ぶ(l, id); await b.開く(); });
    await step(6, async () => {
      await 一括編集で入れる(b, v.入力);
      for (const x of v.入力) note(x.チェック ? 先にチェックの注記(項目名[x.項目] ?? x.項目) : 隠れる欄の注記(項目名[x.項目] ?? x.項目));
      note(`付いている変更チェック: ${(await b.付いている変更チェック()).map((k) => 項目名[k as 一括編集の項目] ?? k).join("・")}`);
    });
    await step(7, async () => {
      const r = await b.実行する();
      note(`一括編集実行のあとの表示: ${[...r.成功, ...r.エラー, ...r.入力の不足].join(" / ") || "（帯なし）"}`);
    });
    let 後: 結果の行[] = [];
    await step(8, async () => { 後 = 自分の行(await 店頭でプレイヤーを検索する(page, v.選手)); note(クリアの注記); });
    await expected(async () => {
      if (v.期待.該当なし) {
        await expect.soft(new DeckResultPage(page).該当なしの案内, "一覧の領域の、該当なしの案内").toHaveText(/^\s*ご指定の条件に一致するデッキが見つかりませんでした。\s*$/);
        expect.soft(後.length, `一覧のプレイヤー「${v.選手}」の行の数`).toBe(0);
      } else {
        expect(後.length, `一覧のプレイヤー「${v.選手}」の行の数`).toBe(1);
        expect.soft(後[0].アーキタイプ, "一覧の行のアーキタイプ").toBe(v.期待.アーキタイプ);
        expect.soft(後[0].大会名, "一覧の行の大会名").toBe(v.期待.大会名);
      }
    });
  };
}

// ---------------------------------------------------------------- 002 公開状態を非公開にすると検索結果から消える

caseTest("IT-M15-04-002", 店頭の一覧で見る({
  選手: QM名("002", "選手"), 控え: "〔デッキID-M1504-002〕", 管理者: M1504_QM,
  前: {},
  入力: [{ 項目: "disp", 値: "非公開", チェック: true }],
  期待: { 該当なし: true },
}));

// ---------------------------------------------------------------- 003 デッキリスト詳細の情報欄に反映される

caseTest("IT-M15-04-003", async ({ page, notes, step, expected }) => {
  待ちを延ばす(page);
  const id = notes.get("〔デッキID-M1504-003〕");
  const N = (後: string) => QM名("003", 後);
  await step(1, async () => {
    expect(await デッキリスト詳細を開く(page, id), "デッキリスト詳細の応答").toBe(200);
    const 欄 = await 情報欄(page);
    expect(欄["アーキタイプ"] ?? "", "情報欄のアーキタイプ").toBe(N("型甲"));
    expect(欄["大会名"] ?? "", "情報欄の大会名").toBe(N("大会旧"));
  });
  await step(2, async () => { await loginAdmin(page, M1504_QM); });
  let l!: Awaited<ReturnType<typeof デッキを検索する>>;
  await step(3, async () => { l = await デッキを検索する(page, id); });
  const b = new デッキ一括編集(page);
  await step(4, async () => { await b.デッキを選ぶ(l, id); await b.開く(); });
  await step(5, async () => {
    await 一括編集で入れる(b, [{ 項目: "archetype", 値: N("型乙"), チェック: true }, { 項目: "eventNameJp", 値: N("大会新"), チェック: true }]);
    note(先にチェックの注記("アーキタイプ・イベント名(日)"));
  });
  await step(6, async () => {
    const r = await b.実行する();
    note(`一括編集実行のあとの表示: ${[...r.成功, ...r.エラー, ...r.入力の不足].join(" / ") || "（帯なし）"}`);
  });
  let 欄: Record<string, string> = {};
  await step(7, async () => { expect(await デッキリスト詳細を開く(page, id), "デッキリスト詳細の応答").toBe(200); 欄 = await 情報欄(page); });
  await expected(async () => {
    expect.soft(欄["アーキタイプ"] ?? "", "開き直したデッキリスト詳細の情報欄のアーキタイプ").toBe(N("型乙"));
    expect.soft(欄["大会名"] ?? "", "開き直したデッキリスト詳細の情報欄の大会名").toBe(N("大会新"));
  });
});

// ---------------------------------------------------------------- 005 変更チェックの無い項目は変わらない

caseTest("IT-M15-04-005", 店頭の一覧で見る({
  選手: QM名("005", "選手"), 控え: "〔デッキID-M1504-005〕", 管理者: M1504_QM,
  前: { アーキタイプ: `${QM名("005", "型甲")}/${QM名("005", "TypeA")}`, 大会名: QM名("005", "大会旧") },
  入力: [
    { 項目: "archetype", 値: QM名("005", "型乙"), チェック: true },
    { 項目: "eventNameJp", 値: QM名("005", "大会新"), チェック: true },
    { 項目: "playerName", 値: QM名("005", "選手改"), チェック: false },
  ],
  // プレイヤー「QM1504-005-選手」の行がそのまま出る（プレイヤー名は変わらない）ことは、行の数が1であることで見る
  期待: { アーキタイプ: `${QM名("005", "型乙")}/${QM名("005", "TypeB")}`, 大会名: QM名("005", "大会新") },
}));

// ---------------------------------------------------------------- 007〜010 代表カード画像のある・ない変更先と、アーキタイプの変更チェックの有無

function 代表カードの条件(n: CB番号, アーキタイプにチェック: boolean): 店頭の型 {
  const N = (後: string) => CB名(n, 後);
  return {
    選手: N("選手"), 控え: `〔デッキID-M1504-${n}〕`, 管理者: M1504_QM,
    前: { アーキタイプ: `${N("型甲")}/${N("TypeA")}`, 大会名: N("大会") },
    入力: [
      { 項目: "archetype", 値: N("型乙"), チェック: アーキタイプにチェック },
      { 項目: "eventNameJp", 値: N("大会新"), チェック: true },
    ],
    期待: { アーキタイプ: アーキタイプにチェック ? `${N("型乙")}/${N("TypeB")}` : `${N("型甲")}/${N("TypeA")}`, 大会名: N("大会新") },
  };
}

caseTest("IT-M15-04-007", 店頭の一覧で見る(代表カードの条件("007", true)));
caseTest("IT-M15-04-008", 店頭の一覧で見る(代表カードの条件("008", true)));
caseTest("IT-M15-04-009", 店頭の一覧で見る(代表カードの条件("009", false)));
caseTest("IT-M15-04-010", 店頭の一覧で見る(代表カードの条件("010", false)));
