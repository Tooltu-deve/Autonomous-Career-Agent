# Hướng dẫn Setup Môi Trường

Làm theo đúng thứ tự bên dưới. Ước tính: **15–20 phút** lần đầu.

---

## Yêu cầu

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|-------------------|---------|
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| Git | bất kỳ | `git --version` |

---

## 1. Clone repo

```bash
git clone <repo-url>
cd <tên-thư-mục>
```

---

## 2. Tạo file `.env`

```bash
make env
```

Lệnh này tạo `.env` từ `.env.example`. Sau đó mở file `.env` và điền các giá trị thật:

```
ANTHROPIC_API_KEY=sk-ant-...     # lấy từ trưởng nhóm
OPENAI_API_KEY=sk-...            # nếu dùng OpenAI thay Claude
JWT_SECRET=<chuỗi-bí-mật-bất-kỳ>
```

> ⚠️ Không commit file `.env`. File này đã có trong `.gitignore`.

---

## 3. Khởi động toàn bộ stack

```bash
make up
```

Lần đầu sẽ mất vài phút để pull image và build. Kiểm tra tất cả container đang chạy:

```bash
make ps
```

Các service URLs sau khi lên:

| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8000 |
| Frontend | http://localhost:3000 |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |
| Qdrant Dashboard | http://localhost:6333/dashboard |

---

## 4. Cài pre-commit (bắt buộc)

Pre-commit tự động kiểm tra code trước mỗi commit.

```bash
pip install pre-commit
pre-commit install                          # hook chạy trước commit
pre-commit install --hook-type commit-msg  # hook kiểm tra commit message
```

Kiểm tra hoạt động:

```bash
pre-commit run --all-files
```

---

## 5. Cài dependencies để dev local (tuỳ chọn)

Chỉ cần nếu muốn chạy/test service trực tiếp ngoài Docker.

**Python (mỗi service):**

```bash
cd services/<tên-service>
pip install -r requirements.txt
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev   # chạy tại http://localhost:3000
```

---

## Các lệnh thường dùng

```bash
make up                    # khởi động stack
make down                  # tắt stack
make logs s=api-gateway    # xem log một service
make ps                    # trạng thái tất cả container
make clean                 # xoá container + volume (reset hoàn toàn)

# Chạy test
make test                              # tất cả service
cd services/<tên> && pytest -q        # một service

# Lint / format Python
black .
ruff check --fix .

# Lint frontend
cd frontend && npm run lint
```

---

## Quy trình làm việc

```bash
# 1. Tạo branch mới từ main
git checkout main && git pull
git checkout -b feat/tên-tính-năng

# 2. Code, commit theo Conventional Commits
git add .
git commit -m "feat(auth): thêm endpoint login"

# 3. Mở Pull Request vào main khi xong
```

Xem thêm quy ước code và git: [CODING_CONVENTION.md](CODING_CONVENTION.md)
