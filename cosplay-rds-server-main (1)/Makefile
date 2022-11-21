# This Makefile is a remnant from when using Node.js 14.
# The current Node.js 16 natively supports Apple Silicon Mac, so Rosetta is not needed.

# Mac: Darwin
PC_TYPE=$(shell uname)
# Mac:
# 	x86_64: Intel
# 	arm64: Apple Silicon
PC_ARCH=$(shell uname -m)

# Automatically use Rosetta when executing commands on Apple Silicon Mac
define run_as_x86_64
	if [[ "${PC_TYPE}" = "Darwin" ]] && [[ "${PC_ARCH}" = "arm64" ]]; then \
		echo "[INFO] Run as x86_64";\
		arch --x86_64 $1; \
	else \
		echo $1; \
	fi
endef

.DEFAULT_GOAL:=setup
.PHONY: setup clean \
		yarn-dev yarn-start yarn-start-dev yarn-build yarn-test yarn-lint yarn-fix yarn-bundle-dev yarn-bundle-prod \
		yarn-generate yarn-migrate yarn-migrate-test yarn-migrate-deploy yarn-seed-test yarn-setup-test yarn-reset-test npx-prisma

setup:
	@$(call run_as_x86_64, yarn)
clean:
	@$(call run_as_x86_64, yarn clean)

yarn-dev:
	@$(call run_as_x86_64, yarn dev)
yarn-start:
	@$(call run_as_x86_64, yarn start)
yarn-start-dev:
	@$(call run_as_x86_64, yarn start:dev)
yarn-build:
	@$(call run_as_x86_64, yarn build)
yarn-test:
	@$(call run_as_x86_64, yarn test)
yarn-lint:
	@$(call run_as_x86_64, yarn lint)
yarn-fix:
	@$(call run_as_x86_64, yarn fix)
yarn-bundle-dev:
	@$(call run_as_x86_64, yarn bundle:dev)
yarn-bundle-prod:
	@$(call run_as_x86_64, yarn bundle:prod)

yarn-generate:
	@$(call run_as_x86_64, yarn generate)
yarn-migrate:
	@$(call run_as_x86_64, yarn migrate)
yarn-migrate-test:
	@$(call run_as_x86_64, yarn migrate:test)
yarn-migrate-deploy:
	@$(call run_as_x86_64, yarn migrate:deploy)
yarn-seed-test:
	@$(call run_as_x86_64, yarn seed:test)
yarn-setup-test:
	@$(call run_as_x86_64, yarn setup:test)
yarn-reset-test:
	@$(call run_as_x86_64, yarn reset:test)

npx-prisma:
	@$(call run_as_x86_64, npx prisma studio)
