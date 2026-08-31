# pyrefly: ignore [missing-import]
from qdrant_client.http import models
from services.embedding import generate_embedding
from services.vector_store import client, COLLECTION_NAME


def search_candidates(
    jd_text: str,
    limit: int = 10,
    min_experience: float | None = None,
    max_experience: float | None = None,
    organization_id: str | None = None,
):
    jd_embedding = generate_embedding(jd_text)

    query_filter = None
    must_conditions = []

    if min_experience is not None:
        must_conditions.append(
            models.FieldCondition(
                key="totalExperienceYears",
                range=models.Range(gte=min_experience)
            )
        )
    if max_experience is not None:
        must_conditions.append(
            models.FieldCondition(
                key="totalExperienceYears",
                range=models.Range(lte=max_experience)
            )
        )

    if organization_id is not None:
        must_conditions.append(
            models.FieldCondition(
                key="organizationId",
                match=models.MatchValue(value=organization_id)
            )
        )

    if must_conditions:
        query_filter = models.Filter(must=must_conditions)

    result = client.query_points(
        collection_name=COLLECTION_NAME,
        query=jd_embedding,
        limit=limit,
        query_filter=query_filter,
        with_payload=True,
    )

    return [
        {
            "candidateId": str(point.id),
            "score": point.score,
            "metadata": point.payload,
        }
        for point in result.points
    ]


def search_candidates_by_vector(
    query_vector: list[float],
    limit: int = 10,
    min_experience: float | None = None,
    max_experience: float | None = None,
    organization_id: str | None = None,
):
    """Search candidates using a pre-computed embedding vector."""
    query_filter = None
    must_conditions = []

    if min_experience is not None:
        must_conditions.append(
            models.FieldCondition(
                key="totalExperienceYears",
                range=models.Range(gte=min_experience)
            )
        )
    if max_experience is not None:
        must_conditions.append(
            models.FieldCondition(
                key="totalExperienceYears",
                range=models.Range(lte=max_experience)
            )
        )

    if organization_id is not None:
        must_conditions.append(
            models.FieldCondition(
                key="organizationId",
                match=models.MatchValue(value=organization_id)
            )
        )

    if must_conditions:
        query_filter = models.Filter(must=must_conditions)

    result = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit,
        query_filter=query_filter,
        with_payload=True,
    )

    return [
        {
            "candidateId": str(point.id),
            "score": point.score,
            "metadata": point.payload,
        }
        for point in result.points
    ]


