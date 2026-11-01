from functools import lru_cache
from sentence_transformers import SentenceTransformer


model = SentenceTransformer("BAAI/bge-small-en-v1.5")


@lru_cache(maxsize=512)
def _cached_embedding(text: str) -> tuple[float, ...]:
    vector = model.encode(
        text,
        normalize_embeddings=True
    )
    return tuple(vector.tolist())


def generate_embedding(text: str) -> list[float]:
    return list(_cached_embedding(text))
