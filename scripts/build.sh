#!/bin/bash

set -e

if npm run build > /dev/null 2>&1; then
  echo "build success"
else
  echo "build error"
fi

if npx cap sync > /dev/null 2>&1; then
  echo "sync success"
else
  echo "sync error"
fi
