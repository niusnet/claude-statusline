#!/bin/bash
# Test harness for statusline.sh helper functions
# Usage: bash tests/test_helpers.sh

pass=0
fail=0

assert_eq() {
    local description="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" = "$expected" ]; then
        echo "  ✓ $description"
        (( pass++ ))
    else
        echo "  ✗ $description"
        echo "    expected: '$expected'"
        echo "    actual:   '$actual'"
        (( fail++ ))
    fi
}

# ── format_tokens (copy from bin/statusline.sh — keep in sync) ───────────────

format_tokens() {
    local num=$1
    if [ "$num" -ge 1000000 ]; then
        if [ $(( num % 1000000 )) -eq 0 ]; then
            awk "BEGIN {printf \"%dM\", $num / 1000000}"
        else
            awk "BEGIN {printf \"%.1fM\", $num / 1000000}"
        fi
    elif [ "$num" -ge 1000 ]; then
        awk "BEGIN {printf \"%.0fk\", $num / 1000}"
    else
        printf "%d" "$num"
    fi
}

# ── format_tokens tests ───────────────────────────────────────────────────────

echo "format_tokens:"
assert_eq "420k"       "420k"  "$(format_tokens 420000)"
assert_eq "200k"       "200k"  "$(format_tokens 200000)"
assert_eq "500 raw"    "500"   "$(format_tokens 500)"
assert_eq "1M exact"   "1M"    "$(format_tokens 1000000)"
assert_eq "1.4M frac"  "1.4M"  "$(format_tokens 1400000)"
assert_eq "2M exact"   "2M"    "$(format_tokens 2000000)"

echo ""
echo "Results: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
