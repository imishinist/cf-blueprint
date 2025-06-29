#!/bin/bash

set -e

echo "Installing k6..."
curl -sL https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/
k6 version

echo "Installing Goss..."
curl -sL https://github.com/goss-org/goss/releases/download/v0.4.4/goss-linux-amd64 -o /usr/local/bin/goss
chmod +x /usr/local/bin/goss
goss --version

echo "All tools installed successfully!"
