/** F07-02 大会詳細検索。正本: cases/F07-02_test_cases.tsv */
import { caseTest, CaseBody, expect } from "../../lib/case";
import { 条件, EventSearchPage } from "../../pages/front/f07_02_event_search";
import { 語, 識別語 } from "../../seeds/f07-02";
import { BASE_URL } from "../../config/env";
import { Notes } from "../../lib/notes";

/**
 * 詳細検索モーダルで条件を入れて検索し、結果に出る日程が、期待の集まりと一致することを確かめるケース。
 * 手順1＝大会詳細検索画面でモーダルを開く、手順2〜(最後の1つ前)＝入力（入力の並び）、最後の手順＝「検索」を押す。
 * seedNo＝シード表の番号（日程IDの呼び名に使う）、出る・出ない＝日程IDの呼び名の末尾の英字。
 */
function 検索ケース(seedNo: string, 入力指定: 条件[] | ((n: Notes) => 条件[]), 出る: string[], 出ない: string[] = []): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const s = new EventSearchPage(page);
    const 入力 = typeof 入力指定 === "function" ? 入力指定(notes) : 入力指定;
    const id = (l: string) => notes.get(`〔イベント詳細ID-F0702-${seedNo}${l}〕`);
    await step(1, async () => { await s.open(); await s.モーダルを開く(); });
    for (const [i, c] of 入力.entries()) await step(i + 2, async () => { await s.条件を入れる(c); });
    let ids: string[] = [];
    await step(入力.length + 2, async () => { await s.検索する(); ids = await s.結果の日程ID(); });
    await expected(async () => {
      expect.soft([...ids].sort(), "検索結果に出た日程（期待の日程だけ）").toEqual(出る.map(id).sort());
      for (const l of 出ない) expect.soft(ids.includes(id(l)), `検索結果に出ていない日程（末尾 ${l}）`).toBe(false);
    });
  };
}
const AtoH = ["A", "B", "C", "D", "E", "F", "G", "H"];

caseTest("IT-F07-02-006", 検索ケース("006", [{ キーワード: 語("青空検索語", "006") }], AtoH));
caseTest("IT-F07-02-008", 検索ケース("008", [{ キーワード: 語("期間確認", "008") }, { 下限: "2030/10/10", 上限: "2030/10/20" }], ["B"], ["A", "C"]));
caseTest("IT-F07-02-009", 検索ケース("009", [{ キーワード: 語("カテゴリ確認", "009") }, { カテゴリ: ["beginner", "competitive"] }], ["A", "D", "C"], ["B"]));
caseTest("IT-F07-02-010", 検索ケース("010", [{ キーワード: 語("カテゴリ確認", "010") }, { カテゴリ: ["beginner", "casual", "reservation"] }], ["A", "B"], ["C", "D"]));
caseTest("IT-F07-02-013", 検索ケース("013", [{ キーワード: 語("詳細条件確認", "013") }, { 休日: false, 平日: true }], ["A"]));
caseTest("IT-F07-02-014", 検索ケース("014", [{ キーワード: 語("詳細条件確認", "014") }, { 平日: false, 休日: true }], ["B"]));
caseTest("IT-F07-02-015", 検索ケース("015", [{ キーワード: 語("詳細条件確認", "015") }], ["A", "B"]));
caseTest("IT-F07-02-016", 検索ケース("016", [{ キーワード: 語("詳細条件確認", "016") }, { 平日: false, 休日: false }], ["A", "B"]));
caseTest("IT-F07-02-017", 検索ケース("017", [{ キーワード: 語("詳細条件確認", "017") }], ["A", "B"]));
caseTest("IT-F07-02-018", 検索ケース("018", [{ キーワード: 語("詳細条件確認", "018") }, { 過去: true }], ["A", "B", "C", "D", "E", "F"]));
caseTest("IT-F07-02-019", 検索ケース("019", [{ キーワード: 語("詳細条件確認", "019") }, { 過去: true, 大型: true }], ["C", "E", "F"]));
caseTest("IT-F07-02-020", 検索ケース("020", [{ キーワード: 語("詳細条件確認", "020") }, { 過去: true, 無料: true }], ["C", "D", "E"]));
caseTest("IT-F07-02-021", 検索ケース("021", [{ キーワード: 語("詳細条件確認", "021") }, { 休日: false }, { 過去: true, 大型: true, 無料: true }], ["A"]));
caseTest("IT-F07-02-024", 検索ケース("024", [{ キーワード: 語("表示区分確認", "024") }], ["A"], ["B", "C"]));

caseTest("IT-F07-02-036", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  const responses: { url: string; status: number }[] = [];
  await step(1, async () => { page.on("response", (r) => { if (r.request().isNavigationRequest()) responses.push({ url: r.url(), status: r.status() }); }); });
  await step(2, async () => { await s.open(); await s.モーダルを開く(); await s.条件を入れる({ キーワード: "存在しない検索語7202" }); await s.検索する(); });
  let 件数 = -1;
  await step(3, async () => { 件数 = (await s.結果の日程ID()).length; });
  await expected(async () => {
    const doc = responses.filter((r) => r.url.includes("/events/list")).at(-1);
    expect.soft(doc?.status, "検索結果の画面（ドキュメント要求）のHTTPの状態").toBe(404);
    expect.soft(件数, "検索結果一覧に出たイベントの数").toBe(0);
  });
});

caseTest("IT-F07-02-037", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(); await s.モーダルを開く(); await s.条件を入れる({ キーワード: "存在しない検索語7202" }); });
  await step(2, async () => { await s.検索する(); });
  await expected(async () => {
    expect.soft(await s.総件数の文字(), "検索結果の総件数").toBe("0");
    expect.soft(new URL(page.url()).pathname, "表示している画面（検索結果一覧）").toMatch(/\/events\/list$/);
    expect.soft(await s.結果の日程ID(), "一覧に出たイベント").toEqual([]);
  });
});

caseTest("IT-F07-02-040", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await s.open(`term=${encodeURIComponent(語("不正日付確認", "040"))}&from=invalid-date`); ids = await s.結果の日程ID(); });
  await expected(async () => {
    expect.soft([...ids].sort(), "検索結果に出た日程").toEqual([notes.get("〔イベント詳細ID-F0702-040A〕"), notes.get("〔イベント詳細ID-F0702-040B〕")].sort());
  });
});

// ---------------------------------------------------------------------------------------------
// 共有の選択肢（OPTIONS）を使うケース。フォーマット・会場の名前は、シードが控えた既存の先頭3件（スタンダード試験などの読み替え。シードの注記）
// ---------------------------------------------------------------------------------------------
const 形式ID = (n: Notes, l: "A" | "B" | "C") => n.get(`〔フォーマットID-F0702-共有${l}〕`);
const 形式名 = (n: Notes, l: "A" | "B" | "C") => n.get(`〔フォーマット名-F0702-共有${l}〕`);
const 会場ID = (n: Notes, l: "A" | "B" | "C") => n.get(`〔会場ID-F0702-共有${l}〕`);
const 会場名 = (n: Notes, l: "A" | "B" | "C") => n.get(`〔会場名-F0702-共有${l}〕`);
const 日程 = (n: Notes, no: string) => n.get(`〔イベント詳細ID-F0702-${no}〕`);

caseTest("IT-F07-02-001", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.モーダルを開く(); });
  await expected(async () => {
    await expect.soft(s.モーダル, "詳細検索モーダルウィンドウ").toHaveClass(/is-visible/);
  });
});

caseTest("IT-F07-02-002", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  const 語_ = 語("統合条件", "002");
  let ids: string[] = [];
  await step(1, async () => { await page.goto(`${BASE_URL}/ja/events`, { timeout: 60_000 }); await page.waitForLoadState("load"); });
  await step(2, async () => { await s.モーダルを開く(); });
  await step(3, async () => { await s.条件を入れる({ キーワード: 語_ }); });
  await step(4, async () => { await s.検索する(); ids = await s.結果の日程ID(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示している画面").toBe("/ja/events/list");
    expect.soft(new URL(page.url()).searchParams.get("term"), "検索条件のキーワード").toBe(語_);
    expect.soft(await s.チップの文字(), "検索条件のボタン").toContain(語_);
    expect.soft(ids, "検索結果に出た日程（統合条件のイベント1件）").toEqual([日程(notes, "002")]);
  });
});

caseTest("IT-F07-02-003", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  let 状態: boolean[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.モーダルを開く(); });
  await step(3, async () => { 状態 = [await s.チェック状態("平日"), await s.チェック状態("休日"), await s.チェック状態("過去")]; });
  await expected(async () => {
    expect.soft(状態[0], "「平日のイベントを表示する」のチェック").toBe(true);
    expect.soft(状態[1], "「休日のイベントを表示する」のチェック").toBe(true);
    expect.soft(状態[2], "「過去のイベントを表示する」のチェック").toBe(false);
  });
});

caseTest("IT-F07-02-004", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  let フォーマット: string[] = [];
  let 会場: string[] = [];
  await step(1, async () => { await s.open(); await s.モーダルを開く(); });
  await step(2, async () => {
    フォーマット = (await s.フォーマットの選択肢()).map((x) => x.名前);
    会場 = (await s.会場の選択肢()).map((x) => x.名前);
  });
  await expected(async () => {
    // 期待の並びは、シードがDBの参照で控えた（「イベントに表示」のフォーマットを並び順に、開店中の会場の全部）
    expect.soft(フォーマット, "フォーマットの並び（表示順）").toEqual(notes.get("〔フォーマット表示順-F0702〕").split("／"));
    expect.soft([...会場].sort(), "開催場所（開店中の全会場）").toEqual(notes.get("〔開店中の会場-F0702〕").split("／").sort());
  });
});

caseTest("IT-F07-02-005", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(); await s.モーダルを開く(); });
  await step(2, async () => { await s.条件を入れる({ キーワード: "リセット確認", 下限: "2030/10/01", 上限: "2030/10/31" }); });
  await step(3, async () => {
    await s.条件を入れる({ カテゴリ: ["beginner"], フォーマットID: [形式ID(notes, "A")], 会場ID: [会場ID(notes, "A")], 過去: true, 大型: true, 無料: true });
  });
  await step(4, async () => { await s.条件を入れる({ 平日: false }); });
  // 画面のボタンの表示名は「クリア」（正本の「リセット」）
  await step(5, async () => { await s.クリアする(); });
  await expected(async () => {
    expect.soft(await s.入力欄の文字("term"), "キーワード検索").toBe("");
    expect.soft(await s.入力欄の文字("from"), "開催日時の下限").toBe("");
    expect.soft(await s.入力欄の文字("to"), "開催日時の上限").toBe("");
    expect.soft(await s.チェックされた選択肢("category"), "チェックされたカテゴリ").toEqual([]);
    expect.soft(await s.チェックされた選択肢("format"), "チェックされたフォーマット").toEqual([]);
    expect.soft(await s.チェックされた選択肢("venue"), "チェックされた開催場所").toEqual([]);
    expect.soft(await s.チェック状態("平日"), "「平日のイベントを表示する」のチェック（初期はチェック済み）").toBe(true);
    expect.soft(await s.チェック状態("休日"), "「休日のイベントを表示する」のチェック（初期はチェック済み）").toBe(true);
    expect.soft(await s.チェック状態("過去"), "「過去のイベントを表示する」のチェック").toBe(false);
    expect.soft(await s.チェック状態("大型"), "「大型のイベントを表示する」のチェック").toBe(false);
    expect.soft(await s.チェック状態("無料"), "「参加無料のイベントを表示する」のチェック").toBe(false);
  });
});

caseTest("IT-F07-02-011", 検索ケース("011", (n) => [{ キーワード: 語("形式場所確認", "011") }, { フォーマットID: [形式ID(n, "A"), 形式ID(n, "B")] }], ["A", "B"], ["C"]));
caseTest("IT-F07-02-012", 検索ケース("012", (n) => [{ キーワード: 語("形式場所確認", "012") }, { 会場ID: [会場ID(n, "A"), 会場ID(n, "B")] }], ["A", "B"], ["C"]));
caseTest("IT-F07-02-022", 検索ケース("022", (n) => [
  { キーワード: 語("統合条件", "022"), 下限: "2030/10/10", 上限: "2030/10/20" },
  { カテゴリ: ["beginner", "reservation"], フォーマットID: [形式ID(n, "A")], 会場ID: [会場ID(n, "A")] },
  { 休日: false, 大型: true, 無料: true },
], ["A"], ["B", "C", "D", "E", "F", "G", "H", "I"]));

caseTest("IT-F07-02-023", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  let ids: string[] = [];
  await step(1, async () => {
    const q = `term=${encodeURIComponent(語("統合条件", "023"))}&from=2030%2F10%2F10&to=2030%2F10%2F20&formats%5B%5D=${形式ID(notes, "A")}&venues%5B%5D=${会場ID(notes, "A")}&isWeekday=true&isHoliday=false&allowPast=false`;
    await s.open(q);
    ids = await s.結果の日程ID();
  });
  await expected(async () => {
    expect.soft(ids, "検索結果に出た日程（全条件を満たす1件だけ）").toEqual([日程(notes, "023A")]);
    expect.soft(await s.チップの文字(), "検索条件のボタンに、キーワードが使われている").toContain(語("統合条件", "023"));
  });
});

/** 結果表示のケース（026〜028・035・046）の共通の入り口: 検索語で検索する */
async function 結果を検索する(s: EventSearchPage, 検索語: string): Promise<string[]> {
  await s.open();
  await s.モーダルを開く();
  await s.条件を入れる({ キーワード: 検索語 });
  await s.検索する();
  return s.結果の日程ID();
}

caseTest("IT-F07-02-026", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await 結果を検索する(s, 語("結果表示確認", "026")); });
  let 文字 = "";
  await step(2, async () => { 文字 = await s.カードの文字(日程(notes, "026A")); });
  await expected(async () => {
    expect.soft(文字, "イベント名").toContain(`${語("結果表示確認", "026")} EARLY`);
    expect.soft(文字, "フォーマット").toContain(形式名(notes, "A"));
    // ルール適用度は、カードでは「初心者向け」の札で表示される（初心者歓迎）
    expect.soft(文字, "ルール適用度（初心者歓迎の札）").toContain("初心者向け");
    expect.soft(文字, "開催日時（年月日と時）").toContain("2030年12月01日 09時〜");
    expect.soft(文字, "開催店舗").toContain(会場名(notes, "A"));
  });
});

caseTest("IT-F07-02-027", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await 結果を検索する(s, 語("結果表示確認", "027")); });
  let 札: string[] = [];
  await step(2, async () => { 札 = (await s.カード(日程(notes, "027A")).locator(".p-hareruya-event-label").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(札, "フォーマットが1件だけ設定されたイベントのフォーマット表示").toEqual([形式名(notes, "A")]);
  });
});

caseTest("IT-F07-02-028", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await 結果を検索する(s, 語("結果表示確認", "028")); });
  let 札: string[] = [];
  await step(2, async () => { 札 = (await s.カード(日程(notes, "028B")).locator(".p-hareruya-event-label").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(札, "フォーマットが2件設定されたイベントのフォーマット表示").toEqual(["混合フォーマット"]);
  });
});

caseTest("IT-F07-02-033", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  const 語_ = 語("チップ確認", "033");
  await step(1, async () => { await s.open(); await s.モーダルを開く(); });
  await step(2, async () => { await s.条件を入れる({ キーワード: 語_, 下限: "2030/11/01", 上限: "2030/11/30" }); });
  await step(3, async () => { await s.条件を入れる({ カテゴリ: ["beginner"], フォーマットID: [形式ID(notes, "A")], 会場ID: [会場ID(notes, "A")] }); });
  await step(4, async () => { await s.検索する(); });
  await expected(async () => {
    const チップ = await s.チップの文字();
    expect.soft(チップ[0], "キーワードのボタンの内容").toBe(語_);
    for (const 文字 of ["2030/11/01〜2030/11/30", "初心者歓迎", 形式名(notes, "A"), 会場名(notes, "A")]) {
      expect.soft(チップ, `検索項目のボタン「${文字}」`).toContain(文字);
    }
  });
});

caseTest("IT-F07-02-034", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  const 語_ = 語("チップ確認", "034");
  await step(1, async () => {
    await s.open(); await s.モーダルを開く();
    await s.条件を入れる({ キーワード: 語_, 下限: "2030/11/01", 上限: "2030/11/30", カテゴリ: ["beginner"], フォーマットID: [形式ID(notes, "A")], 会場ID: [会場ID(notes, "A")] });
    await s.検索する();
  });
  await step(2, async () => { await s.チップを外す(形式名(notes, "A")); });
  let 選択: string[] = [];
  let ids: string[] = [];
  await step(3, async () => { await s.モーダルを開く(); 選択 = await s.チェックされた選択肢("format"); ids = await s.結果の日程ID(); });
  await expected(async () => {
    expect.soft(選択, "チェックされたフォーマット（未選択）").toEqual([]);
    expect.soft([...ids].sort(), "検索結果に出た日程").toEqual([日程(notes, "034A"), 日程(notes, "034B")].sort());
  });
});

caseTest("IT-F07-02-035", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await 結果を検索する(s, 語("結果表示確認", "035")); });
  await step(2, async () => { await s.カード(日程(notes, "035A")).locator("a.p-hareruya-event-card__link").click({ timeout: 20_000 }); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（大会詳細）").toMatch(new RegExp(`/events/${日程(notes, "035A")}/detail$`));
  });
});

caseTest("IT-F07-02-042", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(`term=${encodeURIComponent(識別語("042"))}`); });
  let robots: string[] = [];
  await step(2, async () => { robots = await page.locator('meta[name="robots"]').evaluateAll((es) => es.map((e) => e.getAttribute("content") ?? "")); });
  await expected(async () => {
    expect.soft(robots.join(","), "検索エンジン向けの指定（robots）").toContain("noindex");
  });
});

caseTest("IT-F07-02-043", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(`term=${encodeURIComponent(識別語("043"))}`); });
  let 項目: { 文字: string; リンク: boolean }[] = [];
  await step(2, async () => {
    項目 = await page.locator(".p-hareruya-breadcrumb__item").evaluateAll((es) => es.map((e) => ({ 文字: (e.textContent ?? "").replace(/\s+/g, " ").trim(), リンク: e.querySelector("a[href]") !== null })));
  });
  await expected(async () => {
    expect.soft(項目.map((x) => x.文字), "パンくずリストの並び").toEqual(["ホーム", "イベントTOP", "イベント詳細検索"]);
    expect.soft(項目.map((x) => x.リンク), "リンクになっている項目（ホームとイベントTOP）").toEqual([true, true, false]);
  });
});

caseTest("IT-F07-02-044", async ({ page, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await s.open(`term=${encodeURIComponent(識別語("044"))}`); });
  let 件数 = "";
  await step(2, async () => { 件数 = await s.総件数の文字(); });
  await expected(async () => {
    expect.soft(件数, "検索結果の総件数").toBe("3");
  });
});

caseTest("IT-F07-02-045", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  const 語_ = 識別語("045");
  await step(1, async () => {
    // フォーマットは、表示順の後ろ（C）、前（A）の順に指定する
    await s.open(`term=${encodeURIComponent(語_)}&formats%5B%5D=${形式ID(notes, "C")}&formats%5B%5D=${形式ID(notes, "A")}`);
  });
  let 表題 = "";
  let 説明 = "";
  await step(2, async () => {
    表題 = await page.title();
    説明 = (await page.locator('meta[name="description"]').first().getAttribute("content")) ?? "";
  });
  await expected(async () => {
    for (const [名, 文] of [["ページの表題", 表題], ["説明文", 説明]] as const) {
      const a = 文.indexOf(語_), 先 = 文.indexOf(形式名(notes, "A")), 後 = 文.indexOf(形式名(notes, "C"));
      expect.soft(a >= 0 && 先 >= 0 && 後 >= 0, `${名}に、検索語と2つのフォーマットが含まれる`).toBe(true);
      expect.soft(a < 先 && 先 < 後, `${名}で、検索語、表示順の前のフォーマット、後ろのフォーマットの順に並ぶ`).toBe(true);
      expect.soft(文.includes(形式名(notes, "B")), `${名}に、指定していないフォーマットが含まれない`).toBe(false);
    }
  });
});

caseTest("IT-F07-02-046", async ({ page, notes, step, expected }) => {
  const s = new EventSearchPage(page);
  await step(1, async () => { await 結果を検索する(s, 語("フォーマット未設定確認", "046")); });
  let 札: string[] = [];
  await step(2, async () => { 札 = (await s.カード(日程(notes, "046")).locator(".p-hareruya-event-label").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(札, "フォーマットが1件も設定されていないイベントのフォーマット表示").toEqual(["混合フォーマット"]);
  });
});
