/**
 * M15-05 デッキ編集（新規登録の保存・入力チェック・最終更新者）。ケースの正本: integration_test/casegen/cases/M15-05_test_cases.tsv
 * 文字数・桁数を確かめるケース（047〜053）は、値そのものを確かめるため実行の印を付けない（正本の値のまま）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1505_ADMIN } from "../../seeds/m15-05";
import { M1505_U064, M1505_U065, 語, 名 } from "../../seeds/m15-05-b";

type Step = Parameters<CaseBody>[0]["step"];
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const f = (page: Page, n: string) => page.locator(`[name="admin_deck[${n}]"]`);
const 選択済み = async (page: Page, n: string) => (await page.locator(n === "DeckTags" ? '[name="admin_deck[DeckTags][]"]' : `[name="admin_deck[${n}]"]`).locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
const 行 = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const あ = (前: string, 合計: number, 文字 = "あ") => 前 + 文字.repeat(合計 - [...前].length);

async function login(page: Page, a = M1505_ADMIN): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, a);
}

/** 手順1・2 */
async function 新規登録を開く(page: Page, step: Step): Promise<void> {
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), l.新規登録.click({ noWaitAfter: true })]); });
}

type 入力 = {
  デッキ名?: string; 種別?: string; リスト非公開?: boolean; フォーマット?: string; アーキタイプ?: string; タグ?: string[]; 公開?: string;
  プレイヤー名?: string; イベント名日?: string; イベント名英?: string; 開催日?: string; 順位?: string; 成績?: string; 引用元URL?: string; 参加人数?: string;
  メイン?: string; サイド?: string; 統率?: string;
};
/** 入力欄に入れる（選択欄はフォーマット→アーキタイプの順）。maxlength は外す指定のときだけ外す */
async function 入れる(page: Page, v: 入力, 長さ制限を外す = false): Promise<void> {
  const 欄 = async (n: string, 値?: string) => {
    if (値 === undefined) return;
    if (長さ制限を外す) await f(page, n).evaluate((e) => e.removeAttribute("maxlength"));
    await f(page, n).fill(値);
  };
  await 欄("deckName", v.デッキ名);
  if (v.リスト非公開 !== undefined) await f(page, "privateFlg").setChecked(v.リスト非公開);
  if (v.種別) await f(page, "DeckType").selectOption({ label: v.種別 });
  if (v.フォーマット) await f(page, "Format").selectOption({ label: v.フォーマット });
  if (v.アーキタイプ) await f(page, "Archetype").selectOption({ label: v.アーキタイプ });
  if (v.タグ?.length) await page.locator('[name="admin_deck[DeckTags][]"]').selectOption(v.タグ.map((label) => ({ label })));
  if (v.公開) await f(page, "Disp").selectOption({ label: v.公開 });
  await 欄("playerName", v.プレイヤー名); await 欄("eventNameJp", v.イベント名日); await 欄("eventNameEn", v.イベント名英);
  if (v.開催日 !== undefined) await f(page, "eventDate").fill(v.開催日);
  await 欄("ranking", v.順位); await 欄("result", v.成績); await 欄("sourceUrl", v.引用元URL); await 欄("participants", v.参加人数);
  await 欄("textMain", v.メイン); await 欄("textSide", v.サイド); await 欄("textCommand", v.統率);
}
async function 新規登録を押す(page: Page): Promise<void> {
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => null), page.locator('button[type="submit"][form="admin_deck"]').first().click({ noWaitAfter: true })]);
  await page.waitForLoadState("load");
}
async function 検索して件数(page: Page, 検索語: string): Promise<{ 件数: number; ID: string[] }> {
  const l = new デッキ一覧(page);
  await l.開く(); await l.f("deck_name").fill(検索語); await l.日付クリア.click(); await l.検索する();
  return { 件数: await l.件数(), ID: await l.表示されたID() };
}
const 標準型丙 = () => ({ フォーマット: 名("標準"), アーキタイプ: 名("型丙") });

// ---- 保存できる ----
caseTest("IT-M15-05-039", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  const n = "039";
  await step(3, async () => { await 入れる(page, { デッキ名: `${語(n)}-デッキ`, リスト非公開: true, 種別: "event", フォーマット: 名("標準"), アーキタイプ: 名("型甲"), タグ: [名("タグ一")], 公開: "公開" }); });
  await step(4, async () => { await 入れる(page, { プレイヤー名: `${語(n)}-プレイヤー`, イベント名日: `${語(n)}-大会`, イベント名英: `${語(n)}-Event`, 開催日: "2026-05-10T13:30", 順位: "3", 成績: `${語(n)}-成績`, 引用元URL: "https://example.com/M1505-039", 参加人数: "64" }); });
  await step(5, async () => { await 入れる(page, { メイン: `4 ${名("カードA")}`, サイド: `3 ${名("カードB")}`, 統率: `1 ${名("カードA")}` }); await 新規登録を押す(page); });
  await expected(async () => {
    await expect.soft(page.locator(".alert-success"), "保存の成功メッセージ").toContainText("保存しました");
    expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキ編集画面へ移った").toBe(true);
    expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語(n)}-デッキ`);
    expect.soft(await f(page, "privateFlg").isChecked(), "デッキリスト公開状態のチェック").toBe(true);
    expect.soft(await 選択済み(page, "DeckType"), "デッキ種別").toEqual(["event"]);
    expect.soft(await 選択済み(page, "Format"), "フォーマット").toEqual([名("標準")]);
    expect.soft(await 選択済み(page, "Archetype"), "アーキタイプ").toEqual([名("型甲")]);
    expect.soft(await 選択済み(page, "DeckTags"), "タグ").toEqual([名("タグ一")]);
    expect.soft(await 選択済み(page, "Disp"), "公開状態").toEqual(["公開"]);
    expect.soft(await f(page, "playerName").inputValue(), "プレイヤー名").toBe(`${語(n)}-プレイヤー`);
    expect.soft(await f(page, "eventNameJp").inputValue(), "イベント名(日)").toBe(`${語(n)}-大会`);
    expect.soft(await f(page, "eventNameEn").inputValue(), "イベント名(英)").toBe(`${語(n)}-Event`);
    expect.soft((await f(page, "eventDate").inputValue()).replace(/-/g, "/").replace("T", " "), "イベント開催日").toBe("2026/05/10 13:30");
    expect.soft(await f(page, "ranking").inputValue(), "順位").toBe("3");
    expect.soft(await f(page, "result").inputValue(), "成績").toBe(`${語(n)}-成績`);
    expect.soft(await f(page, "sourceUrl").inputValue(), "引用元URL").toBe("https://example.com/M1505-039");
    expect.soft(await f(page, "participants").inputValue(), "イベント参加人数").toBe("64");
    expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`4 ${名("カードA")}`]);
    expect.soft(行(await f(page, "textSide").inputValue()), "サイドボード").toEqual([`3 ${名("カードB")}`]);
    expect.soft(行(await f(page, "textCommand").inputValue()), "統率").toEqual([`1 ${名("カードA")}`]);
  });
});

function 必須だけ(n: string, 公開: "非公開" | "限定公開"): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    await 新規登録を開く(page, step);
    await step(3, async () => { await 入れる(page, { デッキ名: `${語(n)}-デッキ`, ...標準型丙(), 公開 }); });
    await step(4, async () => { await 新規登録を押す(page); });
    await expected(async () => {
      expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキ編集画面へ移った").toBe(true);
      expect.soft(await f(page, "deckName").inputValue(), "デッキ名").toBe(`${語(n)}-デッキ`);
      expect.soft(await 選択済み(page, "Format"), "フォーマット").toEqual([名("標準")]);
      expect.soft(await 選択済み(page, "Archetype"), "アーキタイプ").toEqual([名("型丙")]);
      expect.soft(await 選択済み(page, "Disp"), "公開状態").toEqual([公開]);
      if (n === "040") {
        expect.soft(await 選択済み(page, "DeckTags"), "タグ（空）").toEqual([]);
        for (const [名前, 欄] of [["プレイヤー名", "playerName"], ["イベント名(日)", "eventNameJp"], ["イベント名(英)", "eventNameEn"], ["イベント開催日", "eventDate"], ["順位", "ranking"], ["成績", "result"], ["引用元URL", "sourceUrl"], ["イベント参加人数", "participants"], ["統率", "textCommand"], ["メインボード", "textMain"], ["サイドボード", "textSide"]]) {
          expect.soft(await f(page, 欄).inputValue(), `${名前}（空）`).toBe("");
        }
      }
    });
  };
}
caseTest("IT-M15-05-040", 必須だけ("040", "非公開"));
caseTest("IT-M15-05-041", 必須だけ("041", "限定公開"));

// ---- 保存されない（検索結果0件） ----
/** 必須の欠けなど。入力を3〜5手順に分けず、case の手順番号に合わせて呼ぶ */
caseTest("IT-M15-05-042", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  let r = { 件数: -1, ID: [] as string[] };
  await step(3, async () => {
    await 入れる(page, { デッキ名: `${語("042")}-デッキ` });
    const 可 = await f(page, "Archetype").isEnabled();
    if (!可) {
      // フォーマット未選択ではアーキタイプの欄が無効で、無効の欄は送られない（アーキタイプも未選択の検査になってしまう）。
      // 開発者ツールで欄を有効にして選ぶのと同じ操作で、「デッキ試験型丙」を選んだ状態にしてから送る
      const 選んだ = await f(page, "Archetype").evaluate((el, label) => {
        const sel = el as HTMLSelectElement;
        sel.disabled = false;
        const all = Array.from(document.querySelectorAll<HTMLOptionElement>("#admin_deck_Archetype option, option[data-format-id]"));
        let opt = Array.from(sel.options).find((o) => o.text.trim() === label);
        if (!opt) {
          // 画面の作りが、フォーマットに合わない選択肢を消している。元の選択肢（画面の読み込み時の写し）が無ければ、値の分からない選択肢は足せない
          const src = all.find((o) => o.text.trim() === label);
          if (src) { opt = src.cloneNode(true) as HTMLOptionElement; sel.appendChild(opt); }
        }
        if (!opt) return false;
        sel.value = opt.value;
        return sel.value !== "";
      }, 名("型丙"));
      if (!選んだ) {
        // フォーマットを一度選んで値を知り、フォーマットを戻してから、欄を有効にして値を入れる
        await f(page, "Format").selectOption({ label: 名("標準") });
        const 値 = await f(page, "Archetype").locator("option").filter({ hasText: 名("型丙") }).first().getAttribute("value");
        await f(page, "Format").selectOption({ value: "" });
        await f(page, "Archetype").evaluate((el, v) => {
          const sel = el as HTMLSelectElement;
          sel.disabled = false;
          if (!Array.from(sel.options).some((o) => o.value === v)) { const o = document.createElement("option"); o.value = v; o.text = "型丙"; sel.appendChild(o); }
          sel.value = v;
        }, 値 ?? "");
      }
      const 値 = await f(page, "Archetype").inputValue();
      const 形 = await f(page, "Format").inputValue();
      note(`フォーマットを選ばないとアーキタイプの選択欄は無効で「デッキ試験型丙」を選べないため、開発者ツールで欄を有効にして選ぶのと同じ操作で選んだ（アーキタイプの値 ${値 || "なし"}、フォーマットの値 ${形 || "未選択"}）`);
      expect(値, "アーキタイプ「デッキ試験型丙」を選んだ状態（送る値がある）").not.toBe("");
      expect(形, "フォーマットは未選択のまま").toBe("");
    } else await f(page, "Archetype").selectOption({ label: 名("型丙") });
  });
  await step(4, async () => { await 新規登録を押す(page); });
  await step(5, async () => { r = await 検索して件数(page, `${語("042")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0); });
});
caseTest("IT-M15-05-043", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  let r = { 件数: -1, ID: [] as string[] };
  await step(3, async () => { await 入れる(page, { デッキ名: `${語("043")}-デッキ`, フォーマット: 名("標準") }); });
  await step(4, async () => { await 新規登録を押す(page); });
  await step(5, async () => { r = await 検索して件数(page, `${語("043")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0); });
});

/** 公開でイベントの3項目のうち一部だけ入れる（044〜046）。入力は手順3・4、登録は5、検索は6 */
function 公開の不足(n: string, イベント: 入力): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    await 新規登録を開く(page, step);
    let r = { 件数: -1, ID: [] as string[] };
    await step(3, async () => { await 入れる(page, { デッキ名: `${語(n)}-デッキ`, ...標準型丙(), 公開: "公開" }); });
    await step(4, async () => { await 入れる(page, イベント); });
    await step(5, async () => { await 新規登録を押す(page); });
    await step(6, async () => { r = await 検索して件数(page, `${語(n)}-デッキ`); });
    await expected(async () => { expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0); });
  };
}
caseTest("IT-M15-05-044", 公開の不足("044", { イベント名英: `${語("044")}-Event`, 開催日: "2026-05-10T13:30" }));
caseTest("IT-M15-05-045", 公開の不足("045", { イベント名日: `${語("045")}-大会`, 開催日: "2026-05-10T13:30" }));
caseTest("IT-M15-05-046", 公開の不足("046", { イベント名日: `${語("046")}-大会`, イベント名英: `${語("046")}-Event` }));

caseTest("IT-M15-05-047", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  const 値 = {
    デッキ名: あ("M1505-047-デッキ", 255), プレイヤー名: あ("M1505-047-", 64), イベント名日: あ("M1505-047-", 255), イベント名英: あ("M1505-047-", 255, "a"),
    成績: あ("M1505-047-", 32), 引用元URL: あ("https://example.com/M1505-047-", 2048, "a"),
  };
  await step(3, async () => { await 入れる(page, 値); });
  await step(4, async () => { await 入れる(page, { ...標準型丙(), 公開: "公開", 開催日: "2026-05-10T13:30" }); await 新規登録を押す(page); });
  await step(5, async () => { await expect(f(page, "deckName"), "登録後の編集画面").toBeVisible(); });
  await expected(async () => {
    expect.soft(/\/deck\/\d+\/edit/.test(page.url()), "デッキ編集画面へ移った").toBe(true);
    for (const [名前, 欄, 期待] of [["デッキ名", "deckName", 値.デッキ名], ["プレイヤー名", "playerName", 値.プレイヤー名], ["イベント名(日)", "eventNameJp", 値.イベント名日], ["イベント名(英)", "eventNameEn", 値.イベント名英], ["成績", "result", 値.成績], ["引用元URL", "sourceUrl", 値.引用元URL]] as const) {
      const 実際 = await f(page, 欄).inputValue();
      expect.soft(実際.length, `${名前}の文字数`).toBe([...期待].length);
      expect.soft(実際 === 期待, `${名前}が入力したとおり欠けずに表示される`).toBe(true);
    }
  });
});

/** 上限を1つ超える値（048〜053）。maxlength を外して入れる */
function 上限超え(n: string, 欄: string, 値: string, 追加: 入力 | null, 手順数: number): CaseBody {
  return async ({ page, step, expected }) => {
    if (n === "052" || n === "053") {
      // 正本の手順は、公開状態を既定の「公開」のままにして、成績に33文字（052）／引用元URLに2049文字（053）を入れる。公開のときはイベント名(日)・(英)・開催日が必須なので、
      // 入れた欄の長さのエラーに加えて必須のエラーも出てしまい、「その欄の上限超えだけで登録が止まった」ことを確かめられない（0件の理由がその欄の長さだけと言えない）。
      // E2E で勝手に手順（公開状態を非公開にする など）を足さないので、正本の手順の不備として注記し、未判定で止める。
      const 欄の名 = n === "052" ? "成績" : "引用元URL";
      test.info().annotations.push({ type: "手順の注記", description: `正本の手順の不備: 公開状態が既定の「公開」のままなので、${欄の名}の長さのエラーに加えて、イベント名(日)・(英)・開催日の必須のエラーも出る。登録が止まったのが${欄の名}の上限超えだけが理由とは言えず、正本の手順では期待結果の確かめにならない（手順の修正は正本の担当。E2E では手順を足さない）` });
      throw new Error(`正本の手順では公開状態が既定の「公開」のままで、${欄の名}の長さのエラーのほかに公開の必須項目のエラーも出るため、「${欄の名}の上限超えだけで登録が止まった」ことを確かめられない。正本の手順の不備として、未判定で止めた`);
    }
    await login(page);
    await 新規登録を開く(page, step);
    let r = { 件数: -1, ID: [] as string[] };
    let s = 3;
    const 名前 = `M1505-${n}-デッキ`;
    const 長い値を入れる = async () => {
      if (欄 === "deckName") await 入れる(page, { デッキ名: 値 }, true);
      else if (欄 === "eventNameJp") await 入れる(page, { イベント名日: 値 }, true);
      else if (欄 === "eventNameEn") await 入れる(page, { イベント名英: 値 }, true);
      else if (欄 === "playerName") await 入れる(page, { プレイヤー名: 値 }, true);
      else if (欄 === "result") await 入れる(page, { 成績: 値 }, true);
      else await 入れる(page, { 引用元URL: 値 }, true);
    };
    if (欄 === "deckName") {
      await step(s++, async () => { await 長い値を入れる(); });
      await step(s++, async () => { await 入れる(page, 標準型丙()); });
    } else {
      await step(s++, async () => { await 入れる(page, { デッキ名: 名前, ...標準型丙() }); });
      await step(s++, async () => { await 長い値を入れる(); });
    }
    if (手順数 === 7) await step(s++, async () => { await 入れる(page, 追加!); });
    await step(s++, async () => { await 新規登録を押す(page); });
    await step(s++, async () => { r = await 検索して件数(page, `M1505-${n}`); });
    await expected(async () => { expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0); });
  };
}
caseTest("IT-M15-05-048", 上限超え("048", "deckName", あ("M1505-048-", 256), null, 6));
caseTest("IT-M15-05-049", 上限超え("049", "playerName", あ("M1505-049-", 65), null, 6));
caseTest("IT-M15-05-050", 上限超え("050", "eventNameJp", あ("M1505-050-", 256), { 公開: "公開", 開催日: "2026-05-10T13:30", イベント名英: "M1505-050-対" }, 7));
caseTest("IT-M15-05-051", 上限超え("051", "eventNameEn", あ("M1505-051-", 256, "a"), { 公開: "公開", 開催日: "2026-05-10T13:30", イベント名日: "M1505-051-対" }, 7));
caseTest("IT-M15-05-052", 上限超え("052", "result", あ("M1505-052-", 33), null, 6));
caseTest("IT-M15-05-053", 上限超え("053", "sourceUrl", あ("https://example.com/M1505-053-", 2049, "a"), null, 6));

// ---- 形式の誤り（開発者ツールで入力欄の種類を変えて入れる） ----
function 形式誤り(n: string, 欄: string, 見出し: string): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    await 新規登録を開く(page, step);
    let r = { 件数: -1, ID: [] as string[] };
    await step(3, async () => { await 入れる(page, { デッキ名: `${語(n)}-デッキ`, ...標準型丙(), 公開: "非公開" }); });
    await step(4, async () => {
      await f(page, 欄).evaluate((e) => { (e as HTMLInputElement).type = "text"; });
      await f(page, 欄).fill("あいう");
      if (欄 === "eventDate") note("「イベント開催日」は日時の入力欄で文字を入れられないため、入力欄の種類を文字入力に変えてから入れた（正本の手順に種類の変更は無い）");
      await 新規登録を押す(page);
    });
    await step(5, async () => { r = await 検索して件数(page, `${語(n)}-デッキ`); });
    await expected(async () => { expect.soft(r.件数, `デッキ一覧の検索結果の件数（${見出し}が数値・日時でない）`).toBe(0); });
  };
}
caseTest("IT-M15-05-054", 形式誤り("054", "ranking", "順位"));
caseTest("IT-M15-05-055", 形式誤り("055", "participants", "イベント参加人数"));
caseTest("IT-M15-05-056", async ({ page, step, expected }) => {
  await login(page);
  await 新規登録を開く(page, step);
  let r = { 件数: -1, ID: [] as string[] };
  await step(3, async () => { await 入れる(page, { デッキ名: `${語("056")}-デッキ`, ...標準型丙(), 公開: "非公開" }); });
  await step(4, async () => {
    await f(page, "eventDate").evaluate((e) => { (e as HTMLInputElement).type = "text"; });
    await f(page, "eventDate").fill("あいう");
    note("「イベント開催日」は日時の入力欄で文字を入れられないため、入力欄の種類を文字入力に変えてから入れた（正本の手順に種類の変更は無い）");
    await 新規登録を押す(page);
  });
  await step(5, async () => { r = await 検索して件数(page, `${語("056")}-デッキ`); });
  await expected(async () => { expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0); });
});

// ---- カードリストの入力チェック ----
function 枚数なし(n: string, 検索する: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page);
    await 新規登録を開く(page, step);
    let r = { 件数: -1, ID: [] as string[] };
    await step(3, async () => { await 入れる(page, { デッキ名: `${語(n)}-デッキ`, ...標準型丙(), 公開: "非公開" }); });
    await step(4, async () => { await 入れる(page, { メイン: `2 ${名("カードA")}\n${名("カードB")}` }); await 新規登録を押す(page); });
    if (検索する) await step(5, async () => { r = await 検索して件数(page, `${語(n)}-デッキ`); });
    await expected(async () => {
      if (検索する) {
        expect.soft(r.件数, "デッキ一覧の検索結果の件数").toBe(0);
      } else {
        expect.soft(await f(page, "deckName").inputValue(), "再表示された画面のデッキ名").toBe(`${語(n)}-デッキ`);
        expect.soft(行(await f(page, "textMain").inputValue()), "メインボード").toEqual([`2 ${名("カードA")}`, 名("カードB")]);
        expect.soft(/\/deck\/new/.test(page.url()), "デッキ新規登録画面のまま").toBe(true);
      }
    });
  };
}
caseTest("IT-M15-05-060", 枚数なし("060", true));
caseTest("IT-M15-05-061", 枚数なし("061", false));

// ---- 最終更新者 ----
caseTest("IT-M15-05-064", async ({ page, step, expected }) => {
  let r = { 件数: -1, ID: [] as string[] }; let 名前一覧: string[] = [];
  await step(1, async () => { await login(page, M1505_U064); await new デッキ一覧(page).開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), new デッキ一覧(page).新規登録.click({ noWaitAfter: true })]); });
  await step(3, async () => { await 入れる(page, { デッキ名: `${語("064")}-デッキ`, ...標準型丙(), 公開: "非公開" }); await 新規登録を押す(page); });
  await step(4, async () => {
    const l = new デッキ一覧(page);
    await l.開く();
    await l.f("member").selectOption({ label: M1505_U064.loginId });
    await l.日付クリア.click(); await l.検索する();
    r = { 件数: await l.件数(), ID: await l.表示されたID() }; 名前一覧 = await l.表示されたデッキ名();
  });
  await expected(async () => {
    expect.soft(名前一覧, "検索結果のデッキ名").toEqual([`${語("064")}-デッキ`]);
    expect.soft(r.件数, "最終更新者が m1505_u064 のデッキの件数").toBe(1);
  });
  note("最終更新者のアカウントは決まった名前で使い回す。前の実行でこのアカウントが最終更新者になったデッキは、シードで試験管理者が開いて「更新」を押し、最終更新者を付け替えた（シードの報告に出る）");
});

caseTest("IT-M15-05-065", async ({ page, notes, step, expected }) => {
  let r = { 件数: -1, ID: [] as string[] }; let 名前一覧: string[] = [];
  const l = new デッキ一覧(page);
  await step(1, async () => {
    await login(page, M1505_U065);
    await l.開く(); await l.f("deck_name").fill(`${語("065")}-デッキ`); await l.日付クリア.click(); await l.検索する();
  });
  await step(2, async () => {
    const 行 = l.行(notes.get("〔デッキID-M1505-065〕"));
    await expect(行, "検索結果のデッキの行").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), 行.locator('a[href$="/edit"]').first().click({ noWaitAfter: true })]);
  });
  await step(3, async () => {
    await f(page, "result").fill(`${語("065")}-更新`);
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.locator('button[type="submit"][form="admin_deck"]').first().click({ noWaitAfter: true })]);
  });
  await step(4, async () => {
    await l.開く();
    await l.f("member").selectOption({ label: M1505_U065.loginId });
    await l.日付クリア.click(); await l.検索する();
    r = { 件数: await l.件数(), ID: await l.表示されたID() }; 名前一覧 = await l.表示されたデッキ名();
  });
  await expected(async () => {
    expect.soft(名前一覧, "検索結果のデッキ名").toEqual([`${語("065")}-デッキ`]);
    expect.soft(r.件数, "最終更新者が m1505_u065 のデッキの件数").toBe(1);
  });
  note("最終更新者のアカウントは決まった名前で使い回す。前の実行でこのアカウントが最終更新者になったデッキは、シードで試験管理者が開いて「更新」を押し、最終更新者を付け替えた（シードの報告に出る）");
});
