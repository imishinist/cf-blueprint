
.PHONY: build
build:
	GOOS=linux GOARCH=amd64	go build -o build/print/ ./handler/print
