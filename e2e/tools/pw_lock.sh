# Playwright のロック（source して使う）。依頼者の承認（2026-10-26）で、同じDBへ3本まで並べて流せるようにした。
#
#   門   .runs/playwright.lock       並べて流す回は共有で、単独の回は排他で持つ（昔からの道具の flock もこれを排他で持つ）
#   順番 .runs/playwright.turn.lock  門を取る前に必ず短く持つ。単独の回が門を待つあいだ、新しい並べる回を止める（単独の回が待たされ続けない）
#   枠   .runs/playwright.slot.<k>.lock（k=1..PW_SLOTS）  並べる回は枠を1つ持つ。test-results は枠ごとに分ける
#
# 呼び方: pw_lock_exclusive <待つ秒> / pw_lock_shared <待つ秒> <枠の数> → 取れたら 0（PW_LOCK_SLOT に枠の名前）、取れなければ 75
#         pw_lock_release
PW_LOCK_DIR=${PW_RUN_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.runs}
PW_LOCK_GATE=${PW_LOCK:-$PW_LOCK_DIR/playwright.lock}
PW_LOCK_TURN=$PW_LOCK_DIR/playwright.turn.lock
PW_LOCK_SLOT=""
_pw_gate_fd=""; _pw_slot_fd=""

_pw_turn_then_gate() { # <モード -s|-x> <待つ秒>
  local mode=$1 wait=$2 turn
  exec {turn}>"$PW_LOCK_TURN"
  if ! flock -w "$wait" "$turn"; then exec {turn}>&-; return 75; fi
  exec {_pw_gate_fd}>"$PW_LOCK_GATE"
  if ! flock "$mode" -w "$wait" "$_pw_gate_fd"; then exec {_pw_gate_fd}>&- {turn}>&-; _pw_gate_fd=""; return 75; fi
  exec {turn}>&-
  return 0
}

pw_lock_exclusive() {
  mkdir -p "$PW_LOCK_DIR"
  _pw_turn_then_gate -x "${1:-3600}" || return 75
  PW_LOCK_SLOT=solo
}

pw_lock_shared() {
  local wait=${1:-3600} slots=${2:-1} start k fd
  mkdir -p "$PW_LOCK_DIR"
  start=$(date +%s)
  while :; do
    for ((k = 1; k <= slots; k++)); do
      exec {fd}>"$PW_LOCK_DIR/playwright.slot.$k.lock"
      if flock -n "$fd"; then _pw_slot_fd=$fd; PW_LOCK_SLOT=$k; break 2; fi
      exec {fd}>&-
    done
    (( $(date +%s) - start >= wait )) && return 75
    sleep 3
  done
  local left=$(( wait - ($(date +%s) - start) )); (( left < 1 )) && left=1
  if ! _pw_turn_then_gate -s "$left"; then exec {_pw_slot_fd}>&-; _pw_slot_fd=""; PW_LOCK_SLOT=""; return 75; fi
  return 0
}

pw_lock_release() {
  [ -n "$_pw_gate_fd" ] && exec {_pw_gate_fd}>&-
  [ -n "$_pw_slot_fd" ] && exec {_pw_slot_fd}>&-
  _pw_gate_fd=""; _pw_slot_fd=""; PW_LOCK_SLOT=""
}
