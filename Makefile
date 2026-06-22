.PHONY: up down build logs ps test clean env

env:        ## Tạo .env từ .env.example nếu chưa có
	@test -f .env || cp .env.example .env && echo ".env sẵn sàng"

up:         ## Lên toàn bộ stack
	docker compose up -d --build

down:       ## Tắt toàn bộ stack
	docker compose down

build:      ## Build lại images
	docker compose build

logs:       ## Xem log (make logs s=auth-service)
	docker compose logs -f $(s)

ps:         ## Trạng thái container
	docker compose ps

test:       ## Chạy test tất cả service (cần venv hoặc trong container)
	@for d in services/*/; do \
		echo "== $$d =="; \
		(cd $$d && pytest -q || true); \
	done

clean:      ## Xoá container + volume
	docker compose down -v
