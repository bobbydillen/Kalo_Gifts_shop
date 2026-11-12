#!/usr/bin/env bash
# Calls the place_order function the way a visitor's browser would (public key only).
# Usage: bash tools/test_place_order.sh <step>
U=https://fnmgiehjwkoilfxjhand.supabase.co/rest/v1/rpc/place_order
K=sb_publishable__SQpPRrYZN53DuM2AhXsLA_xsOmqgDF

call() { # label, json
  printf "%-34s -> " "$1"
  curl -s -X POST "$U" -H "apikey: $K" -H "Content-Type: application/json" -d "{\"p\":$2}" | head -c 230
  echo
}

ADDR='"phone":"9876543210","name":"Test Buyer (delete me)","line1":"12 Test Street","line2":"","city":"Chennai","state":"Tamil Nadu","pincode":"600001"'

case "$1" in
  closed)
    call "orders closed" "{$ADDR,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1}]}"
    ;;
  refusals)
    call "bad phone" "{\"phone\":\"12345\",\"name\":\"Test Buyer\",\"line1\":\"12 Test Street\",\"city\":\"Chennai\",\"state\":\"Tamil Nadu\",\"pincode\":\"600001\",\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1}]}"
    call "bad pincode" "{\"phone\":\"9876543210\",\"name\":\"Test Buyer\",\"line1\":\"12 Test Street\",\"city\":\"Chennai\",\"state\":\"Tamil Nadu\",\"pincode\":\"012345\",\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1}]}"
    call "empty bag" "{$ADDR,\"items\":[]}"
    call "unknown product" "{$ADDR,\"items\":[{\"slug\":\"nope\",\"qty\":1}]}"
    call "missing size" "{$ADDR,\"items\":[{\"slug\":\"grace-tee\",\"colour\":\"Cream\",\"qty\":1}]}"
    call "colour not offered" "{$ADDR,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Purple\",\"qty\":1}]}"
    call "sold out variant" "{$ADDR,\"items\":[{\"slug\":\"grace-tee\",\"colour\":\"Cream\",\"size\":\"XS\",\"qty\":1}]}"
    call "quantity 99" "{$ADDR,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":99}]}"
    call "card message too long" "{$ADDR,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1,\"note\":\"$(printf 'x%.0s' $(seq 1 300))\"}]}"
    call "price changed (expects 499)" "{$ADDR,\"expected_total\":1,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1}]}"
    ;;
  orders)
    call "cap + wrap + card (expect 599)" "{$ADDR,\"expected_total\":599,\"items\":[{\"slug\":\"light-cap\",\"colour\":\"Cream\",\"qty\":1,\"wrap\":true,\"note\":\"Happy Christmas!\"}]}"
    call "tee Ink XXL x1 (stock 2 -> 1)" "{$ADDR,\"items\":[{\"slug\":\"grace-tee\",\"colour\":\"Ink\",\"size\":\"XXL\",\"qty\":1}]}"
    call "tee Ink XXL x2 (only 1 left)" "{$ADDR,\"items\":[{\"slug\":\"grace-tee\",\"colour\":\"Ink\",\"size\":\"XXL\",\"qty\":2}]}"
    call "hamper + wrap ignored (2199)" "{$ADDR,\"items\":[{\"slug\":\"joy-hamper\",\"size\":\"M\",\"qty\":1,\"wrap\":true}]}"
    ;;
esac
