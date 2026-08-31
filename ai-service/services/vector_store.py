# pyrefly: ignore [missing-import]
from qdrant_client import QdrantClient
# pyrefly: ignore [missing-import]
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
)


COLLECTION_NAME = "candidates"
VECTOR_SIZE = 384


client = QdrantClient(
    url="http://qdrant:6333"
)


def ensure_candidate_collection():
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )


def upsert_candidate(
    candidate_id: str,
    embedding: list[float],
    metadata: dict,
):
    ensure_candidate_collection()

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=candidate_id,
                vector=embedding,
                payload=metadata,
            )
        ],
        wait=True,
    )


def delete_candidate(candidate_id: str):
    ensure_candidate_collection()

    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=[candidate_id],
        wait=True,
    )