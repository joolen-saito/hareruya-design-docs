/**
 * F06-22 お問い合わせのシード（画面操作）。正本: cases/F06-22_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）: テストデータは「既存データ または 自分で画面から作ったデータ」に読み替えてよい。DB へは書き込まない。
 * 共有の設定・共有のマスタは書き換えない（いまの値が前提と同じかを画面で確かめて使い、違えば止める）。読み替えたことは、
 * シードの注記（エビデンスの「シード作成時の問題」）に残す。
 *
 * - お問い合わせ件名（S-F06-22-SUBJECTS）: 共有のマスタ。MTGマスターデータ画面を読むだけで、登録・空にする（削除）操作はしない。
 *   ID 1〜8 の件名（日本語）・並び・英語名称の有無・ID 3 の店舗別問い合わせ・ID 1/2/7 の付帯情報名がシード表と同じかを確かめ、違えば止める。
 *   受付アドレス（ID 1・3）は、それを確かめるケース（メールの宛先 042〜045）を書いていないので、違っても止めずに注記に残す。
 * - 店舗（S-F06-22-STORES）: 共有の環境に店舗を増やさないよう、4店舗は登録せず既存の店舗を使う（店舗IDは画面が振った既存の番号）。
 *   公開営業店10 = お問い合わせ画面の「お問い合わせ店舗選択」の先頭の店舗、公開営業店20 = それより表示順が大きい、営業中・公開の店舗、
 *   閉店店舗30 = 公開・閉店の店舗、非公開店舗40 = 非公開・開店の店舗（どれも店舗登録画面で公開・開店・表示順を読んで選ぶ）。
 *   「登録済み店舗はこの4件だけ」は満たせない（ほかの店舗は消さない）。受付アドレス（store-r10・空）は、確かめるケース（メールの宛先）を書いていないので見ない。
 *   ケースの値「公開営業店10」などは、選んだ店舗のお問い合わせ画面での表示名（ショップ名略称）として読む。
 * - 会員A・B（MEMBER-A/B）: フロントの会員情報登録画面で登録して本会員にする（本登録のメールを読めない環境は管理画面で本会員にする）。
 *   メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。パスワードには付けない。
 * - お問い合わせ出力領域（CONTACT-…・FORM-…）: 「一致する既存のお問い合わせを削除する」は、実行の印を付けたメールアドレスで送ることに読み替える（削除はしない）。
 * - メール確認環境（S-F06-22-MAIL）: ショップ基本情報の受付アドレス（共有の設定）は書き換えない。メール試験設備は開発環境に無い。
 *   使うケースのうち書いたもの（026・031・035〜039・041・046・047）は、メールの宛先・受信を確かめない。
 * - 非表示のイベント詳細・非表示のイベント（055・056）: F06-22 の試験管理者（シード表に無い。前例 F07-03）で、公開営業店10 を実施店舗にして登録する。
 *   イベント名(日)に実行の印を付ける。
 * - 書かないシード: S-F06-22-EVENT・ENTRY（事前予約期間の終了 2099-12-31 23:59 を DB で設定）、CUSTOMER-MATCH（同じメールアドレスの会員3件を DB で設定）、
 *   CBSUBJ-059（共有のマスタに件名を足す）・CBCONTACT-059。使うケース（012・040・059）は書いていない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { F0622_ADMIN, イベントを登録する, お問い合わせ件名を読む, 店舗の設定, 店舗の設定を読む, 試験管理者を用意する } from "../pages/admin/f06_22_setup";
import { ContactPage } from "../pages/front/f06_22_contact_k";
import { EventDetailPage } from "../pages/front/f07_03_event_detail";
import { フロントで会員登録する } from "../pages/front/m08_member";

// ---------------------------------------------------------------------------
// 値（ケースが使う）
// ---------------------------------------------------------------------------

/** メールアドレスの前半に実行の印を付ける（ドメインはシード表のまま） */
export const 印つきメール = (addr: string): string => {
  const [前半, ドメイン] = addr.split("@");
  return `${rc(前半)}@${ドメイン}`;
};

export type 試験会員 = { メール: string; パスワード: string; 会員ID: string };
const 会員一覧 = new Map<"A" | "B", 試験会員>();
export function 会員(k: "A" | "B"): 試験会員 {
  const m = 会員一覧.get(k);
  if (!m) throw new Error(`会員${k}を、この実行のシードが作っていない`);
  return m;
}

export type 使う店舗 = { 店舗ID: string; 表示: string; 店名: string; 表示順: number };
/** S-F06-22-STORES が選んだ既存の店舗。前提に合う店舗が無かったものは null */
const 店舗一覧 = new Map<"A" | "B" | "C" | "D", 使う店舗 | null>();
export function 店舗(k: "A" | "B" | "C" | "D"): 使う店舗 | null {
  if (!店舗一覧.has(k)) throw new Error(`店舗${k}を、この実行のシードが選んでいない`);
  return 店舗一覧.get(k) ?? null;
}
/** 前提に合う既存の店舗が無かったときに控える値 */
export const 該当なし = "なし";

/** ケースが入力する件名などの正本の値 */
export const 件名 = [
  "通販に関するお問い合わせ", "ネット買取に関するお問い合わせ", "店舗でのお買い物・イベントに関するお問い合わせ", "委託販売に関するお問い合わせ",
  "デッキ構築機能に関するお問い合わせ", "記事・動画に関するお問い合わせ", "その他のお問い合わせ", "協賛関連",
] as const;

const 管理画面 = <T>(browser: Browser, fn: (page: import("@playwright/test").Page) => Promise<T>) =>
  withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); page.setDefaultNavigationTimeout(120_000); return fn(page); });

// ---------------------------------------------------------------------------
// 会員
// ---------------------------------------------------------------------------

/** 管理画面の会員一覧でメールアドレスを検索して会員IDを読む（登録直後は検索に出るまで遅れることがあるので、間をおいて検索し直す） */
async function 会員IDを探す(browser: Browser, メール: string): Promise<string> {
  return 管理画面(browser, async (page) => {
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      const id = await resultCustomerId(page, メール);
      if (id) return id;
      if (i >= 5) throw new Error(`登録した会員 ${メール} を会員一覧で探せない（約1分おいて検索し直しても同じ）`);
      await page.waitForTimeout(10_000);
    }
  });
}

type 会員の値 = { 姓: string; 名: string; セイ: string; メイ: string; 電話番号: string; メール: string; パスワード: string };

/** 会員を登録して本会員にし、会員IDを控える */
const 会員を作る = (k: "A" | "B", v: 会員の値) => async ({ browser, seed, notes }: SeedCtx): Promise<void> => {
  const m = 印つきメール(v.メール);
  await フロントで会員登録する(browser, { 姓: v.姓, 名: v.名, セイ: v.セイ, メイ: v.メイ, メール: m, パスワード: v.パスワード, 電話番号: v.電話番号 });
  const 会員ID = await 会員IDを探す(browser, m);
  notes.set(`〔会員ID-F0622-共有${k}〕`, 会員ID);
  会員一覧.set(k, { メール: m, パスワード: v.パスワード, 会員ID });
  reportSeedIssue(seed.シードID, `メールアドレスの前半に実行の印を付けて登録した（${m}）。ほかの必須項目（生年月日・住所など）は任意の有効な値`);
};
defineSeed("S-F06-22-MEMBER-A", 会員を作る("A", { 姓: "晴屋", 名: "太郎", セイ: "ハレヤ", メイ: "タロウ", 電話番号: "0312345678", メール: "member-a@example.test", パスワード: "Passw0rd!F0622A" }));
defineSeed("S-F06-22-MEMBER-B", 会員を作る("B", { 姓: "別会員", 名: "次郎", セイ: "ベツカイイン", メイ: "ジロウ", 電話番号: "0398765432", メール: "member-b@example.test", パスワード: "Passw0rd!F0622B" }));

// ---------------------------------------------------------------------------
// お問い合わせ出力領域・入力領域（実行の印つきのメールアドレスで分ける。削除はしない）
// ---------------------------------------------------------------------------

const 印つきで分ける = async ({ seed }: SeedCtx): Promise<void> => {
  reportSeedIssue(seed.シードID, "「一致する既存のお問い合わせを削除する」は、メールアドレスの前半に実行の印を付けて送る（入れる）ことに読み替えた（印つきのメールアドレスのお問い合わせは0件。削除はしない）");
};
defineSeed("S-F06-22-CONTACT-026", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-031", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-035", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-036", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-037", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-038", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-046", 印つきで分ける);
defineSeed("S-F06-22-CONTACT-047", 印つきで分ける);
defineSeed("S-F06-22-FORM-049", 印つきで分ける);
defineSeed("S-F06-22-FORM-050", 印つきで分ける);
defineSeed("S-F06-22-FORM-051", 印つきで分ける);
defineSeed("S-F06-22-FORM-052", 印つきで分ける);
defineSeed("S-F06-22-FORM-053", 印つきで分ける);
defineSeed("S-F06-22-FORM-054", 印つきで分ける);

defineSeed("S-F06-22-CONTACT-041", async ({ browser, seed }) => {
  const m = 印つきメール("no-customer-f0622@example.test");
  const id = await 管理画面(browser, async (page) => { await searchCustomer(page, m); return resultCustomerId(page, m); });
  if (id) throw new Error(`${seed.シードID}: 印つきのメールアドレス ${m} の会員がいる（会員ID ${id}）。削除はしないので止める`);
  reportSeedIssue(seed.シードID, `会員の削除・お問い合わせの削除はせず、メールアドレスの前半に実行の印を付けた ${m} を使った。管理画面の会員一覧で、このメールアドレスの会員がいないことを確かめた`);
});

defineSeed("S-F06-22-FORM-058", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "ケースは新しいブラウザ（Cookie・セッションなし）で始まるので、会員としてログインしていない状態になっている");
});

// ---------------------------------------------------------------------------
// クエリで指定するイベント詳細（055・056・057）
// ---------------------------------------------------------------------------

/** 公開営業店10 を実施店舗にした大会と日程を登録し、イベント詳細IDを控える */
const イベントを作る = (n: "055" | "056", 大会の公開: "公開" | "非公開", 開始時間: string, 日程の公開: "公開" | "非公開") =>
  async ({ browser, seed, notes }: SeedCtx): Promise<void> => {
    const A = 店舗("A");
    if (!A) throw new Error(`${seed.シードID}: 公開営業店10 に当たる店舗が無い`);
    await 管理画面(browser, (page) => 試験管理者を用意する(page, A.店名));
    const r = await withAdminSession(browser, F0622_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      return イベントを登録する(page, { イベント名日: rc(`F0622-${n}-EVENT`), 店名: A.店名, 大会の公開, 開始時間, 日程の公開 });
    });
    for (const m of r.直したこと) reportSeedIssue(seed.シードID, m);
    notes.set(`〔イベント詳細ID-F0622-${n}〕`, r.日程ID);
    reportSeedIssue(seed.シードID, `実施店舗（公開営業店10＝既存の店舗「${A.店名}」）を編集できる F06-22 の試験管理者（シード表に無い。あれば使う）で登録した。イベント名(日)に実行の印を付けた。フォーマット・ルール適用度・定員16・参加費0は任意の有効な値`);
  };
defineSeed("S-F06-22-HIDDETAIL-055", { needs: ["S-F06-22-STORES"] }, イベントを作る("055", "公開", "2026-10-20 11:30", "非公開"));
defineSeed("S-F06-22-HIDEVENT-056", { needs: ["S-F06-22-STORES"] }, イベントを作る("056", "非公開", "2026-10-21 12:30", "公開"));
