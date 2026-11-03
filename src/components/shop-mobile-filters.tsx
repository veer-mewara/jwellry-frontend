"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface FilterOption {
  value: string;
  label: string;
}

/** One shop filter (a sidebar dropdown on desktop, a tab in the mobile sheet). */
export interface FilterGroup {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
}

const AVAILABILITY_TAB = "availability";

/**
 * Phones and tablets: a search box above the products and a "Filter | Sort By" bar fixed to the
 * bottom of the screen. Filter opens a sheet with the desktop sidebar's filters, one tab each;
 * Sort By opens a short list that applies as soon as one is tapped.
 */
export function ShopMobileFilters({
  groups,
  search: currentSearch,
  inStock: currentInStock,
  onlyNew,
}: {
  groups: FilterGroup[];
  search: string;
  inStock: boolean;
  onlyNew: boolean;
}) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const current = Object.fromEntries(groups.map((group) => [group.name, group.value]));
  const sortGroup = groups.find((group) => group.name === "sort");
  const filterGroups = groups.filter((group) => group.name !== "sort");
  const [sheet, setSheet] = useState<"filter" | "sort" | null>(null);
  const [tab, setTab] = useState(filterGroups[0]?.name ?? AVAILABILITY_TAB);
  const [values, setValues] = useState<Record<string, string>>(current);
  const [inStock, setInStock] = useState(currentInStock);
  const [search, setSearch] = useState(currentSearch);

  const activeCount = filterGroups.filter((group) => group.value).length + (currentInStock ? 1 : 0);

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [sheet]);

  /** Same address the desktop form builds. */
  function shopHref(chosen: Record<string, string>, stock: boolean, searchText: string) {
    const params = new URLSearchParams();
    if (onlyNew) params.set("new", "true");
    if (searchText) params.set("search", searchText);
    groups.forEach((group) => chosen[group.name] && params.set(group.name, chosen[group.name]));
    if (stock) params.set("availability", "in-stock");
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  function openSheet(kind: "filter" | "sort", event: React.MouseEvent<HTMLElement>) {
    openerRef.current = event.currentTarget;
    setValues(current);
    setInStock(currentInStock);
    setSheet(kind);
  }

  function apply() {
    setSheet(null);
    router.push(shopHref(values, inStock, currentSearch));
  }

  function chooseSort(value: string) {
    setSheet(null);
    router.push(shopHref({ ...current, sort: value }, currentInStock, currentSearch));
  }

  function clearAll() {
    setValues({ ...Object.fromEntries(filterGroups.map((group) => [group.name, ""])), sort: current.sort ?? "" });
    setInStock(false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(shopHref(current, currentInStock, search.trim().slice(0, 100)));
  }

  const closeOnBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setSheet(null);
  };

  const shownGroup = filterGroups.find((group) => group.name === tab);

  return (
    <>
      <form className="mobileShopSearch" role="search" onSubmit={submitSearch}>
        <input
          type="search"
          maxLength={100}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, SKU or category"
          aria-label="Search"
        />
        <button type="submit" aria-label="Search"><i className="ri-search-line" aria-hidden="true" /></button>
      </form>

      <div className="shopBottomBar">
        <button type="button" onClick={(event) => openSheet("filter", event)} aria-haspopup="dialog">
          <i className="ri-filter-3-line" aria-hidden="true" /> Filter{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
        {sortGroup && (
          <button type="button" onClick={(event) => openSheet("sort", event)} aria-haspopup="dialog">
            <i className="ri-arrow-up-down-line" aria-hidden="true" /> Sort By
          </button>
        )}
      </div>

      {sheet === "sort" && sortGroup && (
        <div className="filterSheet" onClick={closeOnBackdrop}>
          <div className="filterSheetPanel sortSheetPanel" role="dialog" aria-modal="true" aria-labelledby="sort-sheet-title">
            <div className="filterSheetHead">
              <h2 id="sort-sheet-title">Sort By</h2>
              <button ref={closeRef} type="button" onClick={() => setSheet(null)} aria-label="Close sorting">
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
            <div className="sheetOptions">
              {sortGroup.options.map((option) => (
                <label className="sheetOption" key={option.value || "featured"}>
                  <input
                    type="radio"
                    name="sheet-sort"
                    checked={(current.sort ?? "") === option.value}
                    onChange={() => chooseSort(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {sheet === "filter" && (
        <div className="filterSheet" onClick={closeOnBackdrop}>
          <div className="filterSheetPanel" role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title">
            <div className="filterSheetHead">
              <h2 id="filter-sheet-title">Filter</h2>
              <button ref={closeRef} type="button" onClick={() => setSheet(null)} aria-label="Close filters">
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>

            <div className="filterSheetBody">
              <div className="filterSheetTabs" role="tablist" aria-orientation="vertical">
                {[...filterGroups.map((group) => ({ name: group.name, label: group.label, chosen: Boolean(values[group.name]) })),
                  { name: AVAILABILITY_TAB, label: "In stock only", chosen: inStock }].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.name}
                    className={tab === item.name ? "active" : undefined}
                    onClick={() => setTab(item.name)}
                  >
                    {item.label}
                    {item.chosen && <span className="sheetDot" aria-label="(chosen)" />}
                  </button>
                ))}
              </div>

              <div className="filterSheetPane" role="tabpanel">
                <div className="sheetOptions">
                  {shownGroup ? shownGroup.options.map((option) => (
                    <label className="sheetOption" key={option.value || "all"}>
                      <input
                        type="radio"
                        name={`sheet-${shownGroup.name}`}
                        checked={(values[shownGroup.name] ?? "") === option.value}
                        onChange={() => setValues((state) => ({ ...state, [shownGroup.name]: option.value }))}
                      />
                      {option.label}
                    </label>
                  )) : (
                    <label className="sheetOption">
                      <input type="checkbox" checked={inStock} onChange={() => setInStock((state) => !state)} />
                      In stock only
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="filterSheetFoot">
              <button className="sheetClear" type="button" onClick={clearAll}>Clear All</button>
              <button className="sheetApply" type="button" onClick={apply}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
