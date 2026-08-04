from __future__ import annotations

import argparse
import re
from dataclasses import dataclass

from sqlalchemy import or_, select

from database import SessionLocal
from models import Attraction
from services.featured_targets import FEATURED_TARGETS_2026


def normalize(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[\s\[\]\(\)<>·/_-]+", "", value).lower()


@dataclass
class MatchResult:
    target: dict
    attraction: Attraction | None
    candidates: list[Attraction]


def _score(target: dict, row: Attraction) -> tuple[int, int, str]:
    title = normalize(row.title)
    aliases = [normalize(a) for a in target["aliases"]]
    target_name = normalize(target["name"])

    exact = title in aliases or title == target_name
    contains = any(alias and alias in title for alias in aliases)
    area = row.area_code == target["area_code"]

    # 높은 점수가 우선. 마지막 title은 안정적 정렬용.
    return (
        100 if exact else 0,
        30 if area else 0,
        10 if contains else 0,
        -len(title),
        row.title,
    )


def find_match(session, target: dict) -> MatchResult:
    content_id = target.get("content_id")
    if content_id:
        row = session.get(Attraction, content_id)
        return MatchResult(
            target=target,
            attraction=row,
            candidates=[row] if row else [],
        )

    filters = []
    for alias in target["aliases"]:
        filters.append(Attraction.title.ilike(f"%{alias}%"))
        filters.append(Attraction.address.ilike(f"%{alias}%"))

    rows = session.execute(select(Attraction).where(or_(*filters))).scalars().all()
    rows.sort(key=lambda row: _score(target, row), reverse=True)

    return MatchResult(
        target=target,
        attraction=rows[0] if rows else None,
        candidates=rows[:5],
    )


def format_row(row: Attraction) -> str:
    featured = "featured" if row.is_featured else "not-featured"
    return f"{row.content_id} | {row.title} | {row.address} | {row.area_code} | {featured}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="2026 추천 관광지를 대표 관광지(is_featured=true)로 승격합니다.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="실제로 DB에 반영합니다. 생략하면 dry-run만 수행합니다.",
    )
    args = parser.parse_args()

    matched: list[MatchResult] = []
    missing: list[MatchResult] = []
    already_featured = 0
    changed = 0
    skipped_unverified = 0

    with SessionLocal() as session:
        session.expire_on_commit = False

        for target in FEATURED_TARGETS_2026:
            result = find_match(session, target)
            if result.attraction is None:
                missing.append(result)
                continue

            matched.append(result)
            if result.attraction.is_featured:
                already_featured += 1
            elif args.apply:
                if target.get("content_id"):
                    result.attraction.is_featured = True
                    changed += 1
                else:
                    skipped_unverified += 1

        if args.apply:
            session.commit()

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] targets={len(FEATURED_TARGETS_2026)} matched={len(matched)} missing={len(missing)}")
    print(f"[{mode}] already_featured={already_featured} changed={changed}")
    if skipped_unverified:
        print(f"[{mode}] skipped_unverified={skipped_unverified}")

    print("\n## matched")
    for result in matched:
        print(f"- {result.target['priority']} {result.target['name']} -> {format_row(result.attraction)}")
        alternatives = result.candidates[1:3]
        for alt in alternatives:
            print(f"  alt: {format_row(alt)}")

    if missing:
        print("\n## missing")
        for result in missing:
            print(f"- {result.target['priority']} {result.target['name']} aliases={', '.join(result.target['aliases'])}")


if __name__ == "__main__":
    main()
