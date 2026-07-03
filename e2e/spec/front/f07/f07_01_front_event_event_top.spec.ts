/**
 * フロント イベント「イベント大会TOP」（F07-01）E2E。
 * integration_test/e2e/f07_01_front_event_event_top_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f07-01_front_event_event_top.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本画面はログイン不要の公開閲覧画面のため @playwright/test を直接使う（管理fixture不要）。
 * シード/実機依存が無い初回表示・UI部品・月切替リンク・公開閲覧・no-modal・404（存在しない店舗/
 * 不正な日別パス）を live とする。特定イベント/店舗/祝日シードが要るケースは test.fixme（理由付き）で
 * 保留し、手動・対象外を含む全量はケース表（付帯表）で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontEventTopPage } from "../../../pages/front/f07/f07_01_front_event_event_top.page";

test.describe("フロント > イベント > イベント大会TOP", { tag: ["@front", "@event"] }, () => {
  test("E2E-F07-01-002 未ログインでもイベント大会TOPを閲覧できる", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    const res = await top.gotoTop();
    expect(res?.status()).toBeLessThan(400);
    await expect(top.monthLabel).toContainText(FrontEventTopPage.currentMonthLabel());
  });

  test("E2E-F07-01-006 初回アクセスで当月カレンダーと月ラベルを表示する", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await top.seeMonthlyCalendar(FrontEventTopPage.currentMonthLabel());
  });

  test("E2E-F07-01-011 表示要素（カレンダー・月ラベル・月切替リンク）が表示される", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await expect(top.calendar).toBeVisible();
    await top.seeMonthNavLinks();
  });

  test("E2E-F07-01-012 店舗切替セレクトが表示される", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await top.seeShopSelect();
  });

  test("E2E-F07-01-008 前月・翌月への月切替リンク（date クエリ付き）が存在する", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await top.seeMonthNavLinks();
    // 月切替リンクは同一パスへ date クエリ付きで遷移する（画面遷移: 前月・翌月）。
    await expect(top.monthNavLinks.first()).toHaveAttribute("href", /date=\d{6}/);
  });

  test("E2E-F07-01-021 date未指定なら当月（Y年n月）を表示する", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await expect(top.monthLabel).toContainText(FrontEventTopPage.currentMonthLabel());
  });

  test("E2E-F07-01-023 遠い未来月を指定してもカレンダーを表示する（イベント0件でも描画）", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    const res = await top.gotoTop("?date=209912");
    expect(res?.status()).toBeLessThan(400);
    await expect(top.monthLabel).toContainText("2099年12月");
  });

  test("E2E-F07-01-014 モーダル・ポップアップ・トーストを表示しない", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    await top.gotoTop();
    await top.seeNoModal();
  });

  test("E2E-F07-01-031 存在しない店舗IDを指定すると404となる", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    const res = await top.gotoTop("?shop=99999999");
    expect(res?.status()).toBe(404);
  });

  test("E2E-F07-01-024 日別パスの eventDate が Ymd/all いずれでもない場合は404となる", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    const res = await top.gotoDaily("1", "not-a-date");
    expect(res?.status()).toBe(404);
  });

  test("E2E-F07-01-025 日別パスの eventId が数値形式でない場合は404となる", async ({ page }) => {
    const top = new FrontEventTopPage(page);
    const res = await top.gotoDaily("abc", "all");
    expect(res?.status()).toBe(404);
  });

  // --- 要シード/要実機。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F07-01-007 店舗切替で指定店舗の当月イベントを表示し店舗IDをクッキーへ保存する（要: 店舗シード/クッキー確認）", async () => {});
  test.fixme("E2E-F07-01-009 複数日程イベント押下で日別画面へ遷移する（要: 複数日程イベントシード）", async () => {});
  test.fixme("E2E-F07-01-010 単一日程イベント押下でイベント詳細（F07-03）へ遷移する（要: 単一日程イベントシード）", async () => {});
  test.fixme("E2E-F07-01-013 当日より前の日付セルは非リンクの過去表示になる（要: 実機描画/日付シード）", async () => {});
  test.fixme("E2E-F07-01-016 同一日・同一イベントの複数日程を1回だけ表示する（要: 同一日複数日程シード）", async () => {});
  test.fixme("E2E-F07-01-017 表示月の祝日で日付セルの装飾が変わる（要: 祝日シード）", async () => {});
  test.fixme("E2E-F07-01-020 クエリ店舗が現在のクッキーと異なる場合のみクッキーshopを更新する（要: クッキー確認/実機）", async () => {});
  test.fixme("E2E-F07-01-022 カレンダーリストにイベント名を表示し単一日程は開始時刻も表示する（要: イベントシード）", async () => {});
  test.fixme("E2E-F07-01-061 日別で該当1件ならイベント詳細（F07-03）へリダイレクトする（要: 1件該当シード）", async () => {});
  test.fixme("E2E-F07-01-062 日別で該当0件なら最新日程の詳細へリダイレクトする（要: 0件該当+最新日程シード）", async () => {});
});
