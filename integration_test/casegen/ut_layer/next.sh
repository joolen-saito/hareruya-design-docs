#!/usr/bin/env bash
# next.sh N  まだ流していない束を N 個出して launched.txt に足す
cd "$(dirname "$0")"; awk -F'\t' 'NR>1{print $1}' batches.tsv | grep -vxFf launched.txt | head -"${1:-1}" | tee -a launched.txt
