/**
 * 接続先と資格情報。
 *
 * 環境は E2E_ENV で切り替える（既定は local）。
 *   E2E_ENV=local  手元の開発用コンテナ（http://localhost:8000）
 *   E2E_ENV=dev    開発環境（https://replace-dev.hareruyamtg.com:8443）
 * 個々の値は環境変数で上書きできる。パスワードなどの秘密情報はコミットせず、環境変数で与える。
 */
import path from "node:path";

type Profile = {
  /** フロントのURL。管理画面は <baseUrl>/<adminRoute>/ */
  baseUrl: string;
  adminRoute: string;
  /** 複数人が使う環境か。画面からテストデータを作るので、共有環境では明示の同意を求める */
  shared: boolean;
  /** DB確認の方法。docker: 手元のコンテナの psql／url: 接続URL（E2E_DB_URL）で psql／none: DB確認なし */
  db: "docker" | "url" | "none";
};

const PROFILES: Record<string, Profile> = {
  local: { baseUrl: "http://localhost:8000", adminRoute: "admin", shared: false, db: "docker" },
  dev: { baseUrl: "https://replace-dev.hareruyamtg.com:8443", adminRoute: "admin", shared: true, db: "none" },
};

export const ENV_NAME = process.env.E2E_ENV || "local";
const profile = PROFILES[ENV_NAME];
if (!profile) throw new Error(`E2E_ENV=${ENV_NAME} は未定義。使えるのは ${Object.keys(PROFILES).join(" / ")}`);

const env = (k: string, d: string) => process.env[k] || d;

export const BASE_URL = env("E2E_BASE_URL", profile.baseUrl).replace(/\/$/, "");
export const ADMIN_ROUTE = env("E2E_ADMIN_ROUTE", profile.adminRoute);
/** 手元（ループバック）以外へ向けたら、プロファイルが何であっても共有環境として扱う（E2E_BASE_URL の上書きで確認を素通りさせない） */
const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/;
export const SHARED_ENV = profile.shared || !LOOPBACK.test(BASE_URL);

/**
 * シード（店舗・メンバーなど）を画面から作るための管理者。全権限を持つこと。ケースの操作には使わない。
 * local の既定値は開発用コンテナの初期アカウント。それ以外の環境では必ず環境変数で与える。
 */
export const SETUP_ADMIN = {
  loginId: env("E2E_SETUP_ADMIN_USER", ENV_NAME === "local" ? "admin" : ""),
  password: env("E2E_SETUP_ADMIN_PASS", ENV_NAME === "local" ? "password" : ""),
};

/**
 * 会員登録済みの会員の名前（イベント申込を画面から登録するときにプレイヤー検索で選ぶ）。2人以上をカンマ区切りで与える。
 * 与えないときは、シード表の「該当する会員が無ければ、フロントの新規会員登録画面で会員を登録しておく」に従い、
 * E2E が試験用の会員をフロントの会員登録画面で登録して使う（本登録のメールを読むので local だけ。seeds/members.ts）。
 */
export const MEMBER_NAMES = env("E2E_MEMBER_NAMES", "").split(",").map((v) => v.trim()).filter(Boolean);

/** 手元の環境のメールの受け口（mailcatcher）。会員の本登録のメールを読む。local でだけ使う */
export const MAIL_URL = env("E2E_MAIL_URL", ENV_NAME === "local" ? "http://localhost:1080" : "").replace(/\/$/, "");

/** DB確認（実行区分が「ブラウザ+DB確認」のケースの照会）。参照だけに使う */
const dbMode = process.env.E2E_DB_URL ? "url" : env("E2E_DB_MODE", profile.db);
if (dbMode !== "docker" && dbMode !== "url" && dbMode !== "none") throw new Error(`E2E_DB_MODE=${dbMode} は未定義。使えるのは docker / url / none`);
export const DB_MODE: Profile["db"] = dbMode;
export const DB_URL = process.env.E2E_DB_URL || "";
export const DB_CONTAINER = env("E2E_DB_CONTAINER", "ec-cube-enterprise-postgres_primary-1");
/** 管理画面に項目が無いアプリの設定値を確かめる（読み取りだけ）ときの、手元のアプリのコンテナ。local でだけ使う */
export const APP_CONTAINER = env("E2E_APP_CONTAINER", "ec-cube-enterprise-ec-cube-1");

export const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const CASEGEN_DIR = path.join(REPO_ROOT, "integration_test", "casegen");
export const STATE_DIR = path.resolve(__dirname, "..", ".state");

/** 実行前の確認。設定の不足を、テストの途中ではなく最初に知らせる */
export function assertRunnable(): void {
  if (!SETUP_ADMIN.loginId || !SETUP_ADMIN.password) {
    throw new Error(`E2E_ENV=${ENV_NAME}: シードを作る管理者を E2E_SETUP_ADMIN_USER / E2E_SETUP_ADMIN_PASS で与える`);
  }
  if (DB_MODE === "url" && !DB_URL) throw new Error("E2E_DB_MODE=url のときは E2E_DB_URL を与える");
  // ブラウザは共有環境、DB確認は手元のコンテナ、という取り違えを止める
  if (SHARED_ENV && DB_MODE === "docker") {
    throw new Error(`接続先 ${BASE_URL} は手元の環境ではないのに、DB確認が手元のコンテナ（docker）を向いている。E2E_DB_URL を与えるか E2E_DB_MODE=none にする`);
  }
  if (SHARED_ENV && process.env.E2E_CONFIRM_SHARED_ENV !== "1") {
    throw new Error(
      `E2E_ENV=${ENV_NAME}（${BASE_URL}）は複数人が使う環境。テストは画面から店舗・メンバー・イベントなどのデータを作り、消さない` +
      "（データを消すシードを使うケースは、共有環境では実行しない）。" +
      "承知のうえで流すときは E2E_CONFIRM_SHARED_ENV=1 を付ける",
    );
  }
}
