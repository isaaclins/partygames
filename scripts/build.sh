#!/bin/bash

set -e

if npm run build > /dev/null 2>&1; then
  echo "[1/2] build success"
else
  echo "[1/2] build error"
fi

if npx cap sync > /dev/null 2>&1; then
  echo "[2/2] sync success"
else
  echo "[2/2] sync error"
fi
