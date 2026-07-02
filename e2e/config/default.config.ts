/**
 * 接続先・資格情報は環境変数で与える（秘密情報はコミットしない）。
 * 既定の対象はローカル開発環境（http://localhost:8080）。
 * 別環境を使う場合は E2E_BASE_URL / ECCUBE_ADMIN_ROUTE / ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS を上書きする。
 */
process.env.E2E_BASE_URL ||= "http://localhost:8080";
process.env.ECCUBE_ADMIN_ROUTE ||= "admin";
process.env.ECCUBE_ADMIN_USER ||= "admin";
process.env.ECCUBE_ADMIN_PASS ||= "password";
process.env.ECCUBE_FRONT_LOCALE ||= "ja";
process.env.ECCUBE_FRONT_SHOP ||= "";
process.env.ECCUBE_FRONT_USER ||= "";
process.env.ECCUBE_FRONT_PASS ||= "";

export const E2E_BASE_URL = process.env.E2E_BASE_URL;

export const ECCUBE_ADMIN_ROUTE = process.env.ECCUBE_ADMIN_ROUTE;

// 認証テストで使用。安全な初期表示テストでは不要。ロックを避けるため専用テストアカウント推奨。
export const ECCUBE_ADMIN_USER = process.env.ECCUBE_ADMIN_USER;
export const ECCUBE_ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS;

// フロント会員テストで使用。カード登録/削除系は決済代行・専用シードが必要なため共有環境では実行しない。
export const ECCUBE_FRONT_LOCALE = process.env.ECCUBE_FRONT_LOCALE;
export const ECCUBE_FRONT_SHOP = process.env.ECCUBE_FRONT_SHOP;
export const ECCUBE_FRONT_USER = process.env.ECCUBE_FRONT_USER;
export const ECCUBE_FRONT_PASS = process.env.ECCUBE_FRONT_PASS;
