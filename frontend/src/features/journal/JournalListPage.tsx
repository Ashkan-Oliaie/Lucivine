import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listDreams } from "@/api/journal";
import { cn } from "@/lib/cn";

export default function JournalListPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const lucid = params.get("lucid") === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["journal", Object.fromEntries(params)],
    queryFn: () =>
      listDreams({
        is_lucid: lucid || undefined,
        search: params.get("search") ?? undefined,
      }),
  });

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput) next.set("search", searchInput);
    else next.delete("search");
    setParams(next);
  }

  function toggleLucid() {
    const next = new URLSearchParams(params);
    if (lucid) next.delete("lucid");
    else next.set("lucid", "true");
    setParams(next);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono uppercase tracking-ritual text-[10px] text-ink-secondary mb-3">
            Journal
          </p>
          <h1 className=" text-4xl md:text-5xl font-light text-ink-primary">
            What did you <em className="text-accent-lavender">remember</em>?
          </h1>
        </div>
        <Link to="/journal/new">
          <Button>+ New</Button>
        </Link>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center">
        <form onSubmit={applySearch} className="flex-1">
          <input
            type="search"
            placeholder="Search dreams…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-md px-4 py-3 text-ink-primary placeholder:text-ink-muted/60 focus:outline-none focus:border-accent-lavender/60"
          />
        </form>
        <button
          onClick={toggleLucid}
          className={cn(
            "px-5 py-3 rounded-md border font-mono uppercase tracking-ritual text-[10px] transition-colors",
            lucid
              ? "border-accent-amethyst/60 bg-accent-amethyst/10 text-ink-primary"
              : "border-white/10 text-ink-secondary",
          )}
        >
          Lucid only
        </button>
      </div>

      <ul className="mt-8 space-y-3">
        {isLoading && (
          <Card>
            <p className=" italic text-ink-secondary">Listening…</p>
          </Card>
        )}
        {!isLoading && !data?.results.length && (
          <Card>
            <p className=" italic text-ink-secondary">
              No entries yet. <Link to="/journal/new" className="text-ink-primary underline">
                Begin one
              </Link>
              .
            </p>
          </Card>
        )}
        {data?.results.map((d) => (
          <Link key={d.id} to={`/journal/${d.id}`} className="block">
            <Card className="hover:border-accent-lavender/30 transition-colors">
              <div className="flex items-baseline justify-between gap-3">
                <p className=" text-lg text-ink-primary truncate">
                  {d.title}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-ritual text-ink-muted shrink-0">
                  {d.dream_date}
                </p>
              </div>
              {d.content && (
                <p className=" text-sm text-ink-secondary mt-2 line-clamp-2">
                  {d.content}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 font-mono text-[10px] uppercase tracking-ritual text-ink-muted">
                {d.is_lucid && (
                  <span className="text-accent-amber">Lucid</span>
                )}
                {d.technique_used && <span>{d.technique_used}</span>}
                {d.vividness != null && <span>{d.vividness}/10</span>}
              </div>
            </Card>
          </Link>
        ))}
      </ul>
    </motion.div>
  );
}
