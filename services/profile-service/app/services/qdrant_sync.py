"""Đồng bộ embedding profile lên Qdrant (index cho RAG).

Sinh embedding bằng OpenAI (text-embedding-3-small) rồi upsert lên Qdrant theo
`profile_id`. Model + collection + số chiều lấy từ settings — phải KHỚP với cv-agent
(bên đọc), nếu không query RAG sẽ sai/không so được vector.

Embedding là side-effect NỘI BỘ của PUT /profile (xem API_CONTRACT §A2): lỗi ở đây
KHÔNG được làm hỏng việc lưu profile. Repository gọi hàm này sau khi commit Postgres;
mọi lỗi (OpenAI/Qdrant down, thiếu API key) được log + nuốt, profile vẫn lưu thành công.
"""

import logging
import uuid

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from libs.common.config import settings

logger = logging.getLogger(__name__)

# Khởi tạo lazy (một lần) để không tạo client lúc import — tránh phụ thuộc lúc test.
_openai: OpenAI | None = None
_qdrant: QdrantClient | None = None
_collection_ready = False


def _get_openai() -> OpenAI:
    global _openai
    if _openai is None:
        _openai = OpenAI(api_key=settings.openai_api_key)
    return _openai


def _get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    return _qdrant


def _ensure_collection(client: QdrantClient) -> None:
    """Tạo collection `profiles` nếu chưa có (cosine, đúng số chiều model)."""
    global _collection_ready
    if _collection_ready:
        return
    name = settings.qdrant_profiles_collection
    if not client.collection_exists(name):
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=settings.embedding_dim, distance=Distance.COSINE
            ),
        )
    _collection_ready = True


def _embed(text: str) -> list[float]:
    """Gọi OpenAI sinh vector embedding cho `text`."""
    resp = _get_openai().embeddings.create(model=settings.embedding_model, input=text)
    return resp.data[0].embedding


def sync_profile_embedding(
    profile_id: uuid.UUID, user_id: uuid.UUID, text: str
) -> bool:
    """Sinh embedding từ `text` và upsert lên Qdrant theo `profile_id`.

    Payload lưu `user_id` (để cv-agent lọc đúng user khi RAG) và `profile_text`
    (để đưa thẳng vào prompt, khỏi quay lại Postgres). Point id = profile_id.

    Trả True nếu upsert thành công, False nếu lỗi (đã log). KHÔNG raise —
    caller (repository) dựa vào giá trị trả về để set `embedding_synced_at`.
    """
    if not text.strip():
        return False
    try:
        client = _get_qdrant()
        _ensure_collection(client)
        vector = _embed(text)
        client.upsert(
            collection_name=settings.qdrant_profiles_collection,
            points=[
                PointStruct(
                    id=str(profile_id),
                    vector=vector,
                    payload={
                        "profile_id": str(profile_id),
                        "user_id": str(user_id),
                        "profile_text": text,
                    },
                )
            ],
        )
        return True
    except Exception:  # OpenAI/Qdrant down, thiếu key... — không làm hỏng PUT
        logger.exception("Embedding sync thất bại cho profile %s", profile_id)
        return False
