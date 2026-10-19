# Quor-7 kart CEF preview.
# Web UI lives in web/. CMake copies that folder into the app bundle.
# Nothing is synced from a parent directory.

BUILD_DIR := build
CONFIG ?= Debug
APP := $(BUILD_DIR)/$(CONFIG)/kart_cef.app

.PHONY: all help configure build run clean

all: build

help:
	@printf '%s\n' \
		'Quor-7 kart CEF preview' \
		'' \
		'  make              configure if needed, then build kart_cef.app' \
		'  make configure    generate the CMake build in build/' \
		'  make build        compile kart_cef.app' \
		'  make run          launch the built app' \
		'  make clean        delete build/' \
		'  make help         show this text' \
		'' \
		'Web files are read from ./web. Nothing is copied from a parent folder.'

configure:
	cmake -S . -B "$(BUILD_DIR)" -DCMAKE_BUILD_TYPE="$(CONFIG)"

$(BUILD_DIR)/CMakeCache.txt:
	@$(MAKE) configure

build: $(BUILD_DIR)/CMakeCache.txt
	cmake --build "$(BUILD_DIR)" --config "$(CONFIG)"

run: build
	open "$(APP)"

clean:
	rm -rf "$(BUILD_DIR)"
