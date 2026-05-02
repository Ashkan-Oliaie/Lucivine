import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listDreams } from "@/api/journal";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JournalListPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const lucid = params.get("lucid") === "true";
  const activeSearch = params.get("search") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["journal", Object.fromEntries(params)],
    queryFn: () =>
      listDreams({
        is_lucid: lucid || undefined,
        search: activeSearch || undefined,
      }),
  });

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput) next.set("search", searchInput);
    else next.delete("search");
    setParams(next);
  }

  function clearSearch() {
    setSearchInput("");
    const next = new URLSearchParams(params);
    next.delete("search");
    setParams(next);
  }

  function toggleLucid() {
    const next = new URLSearchParams(params);
    if (lucid) next.delete("lucid");
    else next.set("lucid", "true");
    setParams(next);
  }

  const entries = data?.results ?? [];
  const total = data?.count ?? entries.length;
  const hasFilters = lucid || Boolean(activeSearch);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <p className="ritual-eyebrow mb-3">Journal</p>
          <h1 className="text-4xl md:text-5xl font-light text-ink-primary leading-tight">
            What did you <em className="text-accent-lavender">remember</em>?
          </h1>
          {!isLoading && (
            <p className="mt-3 text-sm text-ink-muted">
              {total} {total === 1 ? "entry" : "entries"}
              {hasFilters && " · filtered"}
            </p>
          )}
        </div>
        <Link to="/journal/new" className="self-start md:self-auto">
          <Button>+ New entry</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center">
        <form onSubmit={applySearch} className="flex-1 relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted"
          >
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search dreams…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-md pl-10 pr-10 py-3 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60 transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute inset-y-0 right-3 flex items-center text-ink-muted hover:text-ink-primary"
            >
              ×
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={toggleLucid}
          aria-pressed={lucid}
          className={cn(
            "px-5 py-3 rounded-md border font-mono uppercase tracking-ritual text-[10px] transition-colors",
            lucid
              ? "border-accent-amethyst/60 bg-accent-amethyst/10 text-ink-primary"
              : "border-white/10 text-ink-secondary hover:border-white/25 hover:text-ink-primary",
          )}
        >
          Lucid only
        </button>
      </div>

      <ul className="mt-8 space-y-3">
        {isLoading && (
          <Card>
            <p className="italic text-ink-secondary">Listening…</p>
          </Card>
        )}
        {!isLoading && !entries.length && (
          <Card>
            <p className="italic text-ink-secondary">
              {hasFilters ? (
                <>No entries match those filters.</>
              ) : (
                <>
                  No entries yet.{" "}
                  <Link
                    to="/journal/new"
                    className="text-ink-primary underline"
                  >
                    Begin one
                  </Link>
                  .
                </>
              )}
            </p>
          </Card>
        )}
        {entries.map((d, i) => (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.2), duration: 0.3 }}
          >
            <Link to={`/journal/${d.id}`} className="block group">
              <Card className="hover:border-accent-lavender/30 group-hover:-translate-y-0.5 transition-all">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-lg text-ink-primary truncate font-medium">
                    {d.title || <span className="italic text-ink-muted">Untitled</span>}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-ritual text-ink-muted shrink-0">
                    {formatDate(d.dream_date)}
                  </p>
                </div>
                {d.content && (
                  <p className="text-sm text-ink-secondary mt-2 line-clamp-2">
                    {d.content}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-3 font-mono text-[10px] uppercase tracking-ritual text-ink-muted">
                  {d.is_lucid && (
                    <span className="inline-flex items-center gap-1.5 text-accent-amber">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-amber shadow-[0_0_8px_currentColor]" />
                      Lucid
                    </span>
                  )}
                  {d.technique_used && <span>{d.technique_used}</span>}
                  {d.vividness != null && (
                    <span>vividness {d.vividness}/10</span>
                  )}
                  {d.emotions?.length > 0 && (
                    <span className="text-ink-secondary normal-case tracking-normal">
                      {d.emotions.slice(0, 3).join(" · ")}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
