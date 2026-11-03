"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export interface CategorySlide {
  slug: string;
  name: string;
  image: string;
}

/** Cards further than this from the centre are hidden. */
const VISIBLE_SIDE = 2;
const SWIPE_PX = 40;

/**
 * "Shop by Category" as a 3D cover-flow: the chosen category sits large in the middle, the
 * neighbours shrink and turn away on both sides, and the list wraps round. Arrows, swipes and
 * tapping a side card bring it to the middle; tapping the middle card opens that category.
 */
export function CategoryCarousel({ categories: list }: { categories: CategorySlide[] }) {
  // With 2-4 categories the list is repeated so both sides of the middle card are filled.
  const categories = list.length > 1 && list.length < 2 * VISIBLE_SIDE + 1
    ? Array.from({ length: Math.ceil((2 * VISIBLE_SIDE + 1) / list.length) }, () => list).flat()
    : list;
  const [active, setActive] = useState(0);
  const swipeStart = useRef<number | null>(null);
  // A drag ends with a click on the card under the pointer; that click must not undo the swipe.
  const swiped = useRef(false);
  const count = categories.length;

  const go = (step: number) => setActive((index) => (index + step + count) % count);

  /** Signed distance from the middle card, going the short way round. */
  function offsetOf(index: number) {
    let offset = (index - active + count) % count;
    if (offset > count / 2) offset -= count;
    return offset;
  }

  return (
    <div
      className="categoryFlow"
      aria-roledescription="carousel"
      aria-label="Shop by category"
      onPointerDown={(event) => {
        swipeStart.current = event.clientX;
        swiped.current = false;
      }}
      onPointerUp={(event) => {
        if (swipeStart.current === null) return;
        const moved = event.clientX - swipeStart.current;
        swipeStart.current = null;
        if (Math.abs(moved) > SWIPE_PX) {
          swiped.current = true;
          go(moved < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => { swipeStart.current = null; }}
    >
      <div className="categoryFlowStage">
        {categories.map((category, index) => {
          const offset = offsetOf(index);
          const distance = Math.abs(offset);
          const hidden = distance > VISIBLE_SIDE;
          return (
            <Link
              key={`${category.slug}-${index}`}
              href={`/shop?category=${category.slug}`}
              className={offset === 0 ? "categoryFlowCard categoryFlowActive" : "categoryFlowCard"}
              style={{ "--offset": offset, "--distance": distance, zIndex: 10 - distance } as React.CSSProperties}
              aria-hidden={hidden || undefined}
              tabIndex={hidden ? -1 : undefined}
              draggable={false}
              onClick={(event) => {
                if (swiped.current) {
                  event.preventDefault();
                  swiped.current = false;
                  return;
                }
                // A side card first comes to the middle; only the middle card opens the category.
                if (offset !== 0) {
                  event.preventDefault();
                  setActive(index);
                }
              }}
            >
              <span className="categoryFlowImage">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="(max-width: 749px) 220px, 320px"
                  draggable={false}
                />
              </span>
              <span className="categoryFlowName">{category.name}</span>
            </Link>
          );
        })}
      </div>
      {count > 1 && (
        <>
          <button className="categoryFlowArrow categoryFlowPrev" type="button" onClick={() => go(-1)} aria-label="Previous category">
            <i className="ri-arrow-left-s-line" aria-hidden="true" />
          </button>
          <button className="categoryFlowArrow categoryFlowNext" type="button" onClick={() => go(1)} aria-label="Next category">
            <i className="ri-arrow-right-s-line" aria-hidden="true" />
          </button>
        </>
      )}
      <p className="visually-hidden" aria-live="polite">{categories[active]?.name}</p>
    </div>
  );
}
