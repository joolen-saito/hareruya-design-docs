/** F07-02 大会詳細検索。正本: cases/F07-02_test_cases.tsv */
import { caseTest, CaseBody, expect } from "../../lib/case";
import { 条件, EventSearchPage } from "../../pages/front/f07_02_event_search";
import { 語 } from "../../seeds/f07-02";

/**
 * 詳細検索モーダルで条件を入れて検索し、結果に出る日程が、期待の集まりと一致することを確かめるケース。
 * 手順1＝大会詳細検索画面でモーダルを開く、手順2〜(最後の1つ前)＝入力（入力の並び）、最後の手順＝「検索」を押す。
 * seedNo＝シード表の番号（日程IDの呼び名に使う）、出る・出ない＝日程IDの呼び名の末尾の英字。
 */
function 検索ケース(seedNo: string, 入力: 条件[], 出る: string[], 出ない: string[] = []): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const s = new EventSearchPage(page);
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
