"""Đồng bộ embedding profile lên Qdrant (index cho RAG).

STUB: chưa nối Qdrant thật. Interface đã cố định để repository gọi sau mỗi lần
ghi profile; khi có model embedding + Qdrant client thì hiện thực hoá hàm dưới.
Xem API_CONTRACT §A2: embedding là side-effect nội bộ của PUT /profile.
"""

import uuid


def sync_profile_embedding(profile_id: uuid.UUID, text: str) -> None:
    """Sinh embedding từ `text` và upsert lên Qdrant theo `profile_id`.

    TODO: embed(text) -> vector; qdrant_client.upsert(collection, profile_id, vector).
    Hiện là no-op để pipeline profile chạy được mà không phụ thuộc Qdrant.
    """
    return None
