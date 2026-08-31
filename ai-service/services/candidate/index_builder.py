def build_candidate_index(profile: dict, organization_id: str = None) -> dict:
    parts = []

    for experience in profile.get("experience", []):
        title = experience.get("title")
        organization = experience.get("organization")

        if title:
            parts.append(f"Role: {title}")

        if organization:
            parts.append(f"Organization: {organization}")

        parts.extend(experience.get("description", []))

    skills = list(dict.fromkeys(profile.get("skills", [])))

    if skills:
        parts.append(f"Skills: {', '.join(skills)}")

    for project in profile.get("projects", []):
        name = project.get("name")

        if name:
            parts.append(f"Project: {name}")

        parts.extend(project.get("description", []))

        project_skills = project.get("skills", [])

        if project_skills:
            parts.append(
                f"Project skills: {', '.join(project_skills)}"
            )

    for certification in profile.get("certifications", []):
        name = certification.get("name")

        if name:
            parts.append(f"Certification: {name}")

    for license_item in profile.get("licenses", []):
        name = license_item.get("name")

        if name:
            parts.append(f"License: {name}")

    return {
        "embeddingText": "\n".join(parts),
        "metadata": {
            "name": profile.get("candidate", {}).get("name"),
            "location": profile.get("candidate", {}).get("location"),
            "role": profile.get("experience", [{}])[0].get("title") if profile.get("experience") else None,
            "skills": skills,
            "totalExperienceYears": profile.get("computed", {}).get("totalExperienceYears"),
            "organizationId": organization_id,
        },
    }
