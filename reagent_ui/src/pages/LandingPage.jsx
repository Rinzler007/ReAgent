import { Link } from "react-router-dom";
import DotsPattern from "../components/DotsPattern";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            ReAgent
          </span>
          <div className="flex items-center gap-6">
            <Link
              to="/explorer"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Explorer
            </Link>
            <Link
              to="/run"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Run agent
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <DotsPattern id="hero-dots" opacity={0.18} />
        <div className="absolute top-16 left-16 w-80 h-80 rounded-full bg-[#4285F4]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-24 w-72 h-72 rounded-full bg-[#EA4335]/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-8 left-1/3 w-96 h-96 rounded-full bg-[#FBBC05]/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 right-16 w-64 h-64 rounded-full bg-[#34A853]/8 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 text-sky-600 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              LangGraph regression harness
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900">
              Did your prompt change
              <span className="block bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                break anything ?
              </span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              ReAgent records every LangGraph agent run as a structured trace.
              Replay any past run against a new model or prompt, with original
              tool outputs locked in as fixtures and get an exact diff of the
              LLM's reasoning. No more guessing.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/explorer"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-200/60"
              >
                Open Explorer
              </Link>
              <Link
                to="/run"
                className="px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                Run agent
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-sky-200/25 via-indigo-200/15 to-emerald-200/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xl shadow-sky-100/50">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-sky-50/40">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="ml-3 text-xs text-gray-400 font-mono">
                  Replay diff · LLM call 2
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <div className="p-4 bg-gradient-to-b from-white to-red-50/20">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                    Original
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono">
                    Based on my knowledge,{" "}
                    <mark className="bg-red-100 text-red-700 rounded px-0.5 not-italic">
                      the 2008 financial crisis was caused by multiple
                      interconnected factors:
                    </mark>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono mt-2">
                    <mark className="bg-red-100 text-red-700 rounded px-0.5">
                      1. Subprime mortgage lending
                    </mark>
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-b from-white to-emerald-50/20">
                  <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                    Replay
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono">
                    Based on my knowledge,{" "}
                    <mark className="bg-emerald-100 text-emerald-700 rounded px-0.5 not-italic">
                      I can provide a comprehensive explanation of what caused
                      the 2008 financial crisis:
                    </mark>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed font-mono mt-2">
                    <mark className="bg-emerald-100 text-emerald-700 rounded px-0.5">
                      1. Housing bubble and subprime mortgages
                    </mark>
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/30 flex gap-4 text-xs text-gray-400">
                <span>1 LLM output changed</span>
                <span>1 tool call fixtured</span>
                <span className="ml-auto bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent font-medium">
                  claude-haiku vs claude-haiku
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-20 border-t border-gray-100 overflow-hidden">
        <div className="absolute -left-20 top-0 w-72 h-72 rounded-full bg-[#34A853]/6 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 bottom-0 w-64 h-64 rounded-full bg-[#4285F4]/6 blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            You spend an afternoon tuning your agent's prompt. Tests pass. You
            ship it. A few days later someone reports the agent gives worse
            answers. You swap model versions. Did that help or hurt ?
          </p>
          <p className="text-gray-400 leading-relaxed">
            Without deterministic replay you're just running the agent again and
            hoping the tool calls come back the same. They don't. ReAgent
            removes that variable entirely.
          </p>
        </div>
      </section>

      <section className="relative px-6 py-20 border-t border-gray-100 bg-gradient-to-b from-sky-50/40 via-white to-indigo-50/30 overflow-hidden">
        <DotsPattern id="how-dots" opacity={0.12} />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-12">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              label="Record"
              headline="Your agent, unchanged"
              body="Add ReAgentCallbackHandler to your LangGraph config. Every node, LLM call and tool call is captured automatically with no boilerplate in your agent code."
              accent="sky"
            />
            <FeatureCard
              label="Replay"
              headline="Tool outputs become fixtures"
              body="When you replay a run, the original tool responses are served back deterministically. The only thing that can differ is the LLM's reasoning, which is exactly what you want to measure."
              accent="indigo"
            />
            <FeatureCard
              label="Diff"
              headline="See exactly what changed"
              body="Character-level side-by-side comparison for every LLM call. The exact words that were added, removed or rewritten, call by call."
              accent="emerald"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
              Instrumentation
            </p>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Two lines. That's it.
            </h2>
            <p className="text-gray-500 leading-relaxed text-sm">
              Pass the callback handler in the config dict LangGraph already
              accepts. Your node functions, your graph definition, your tools.
              None of that changes. Traces appear in the explorer immediately.
            </p>
          </div>
          <pre className="bg-gray-900 rounded-xl p-5 text-xs leading-relaxed text-gray-300 font-mono overflow-x-auto whitespace-pre shadow-lg shadow-gray-900/10">
            {`from reagent_sdk import Recorder, ReAgentCallbackHandler

recorder = Recorder(agent_name="my-agent")

with recorder.run(metadata={"model": "claude-haiku"}) as run:
    handler = ReAgentCallbackHandler(run)
    app.invoke(
        initial_state,
        config={"callbacks": [handler]},
    )`}
          </pre>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-gray-100 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-emerald-50/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          <StatCard
            value="~30s"
            label="from docker compose up to first trace"
            gradient="from-sky-600 to-sky-400"
          />
          <StatCard
            value="0"
            label="changes to your agent code"
            gradient="from-indigo-600 to-indigo-400"
          />
          <StatCard
            value="100%"
            label="tool call variance eliminated"
            gradient="from-emerald-600 to-emerald-400"
          />
        </div>
      </section>

      <section className="relative px-6 py-20 border-t border-gray-100 overflow-hidden">
        <div className="absolute left-10 top-10 w-56 h-56 rounded-full bg-[#FBBC05]/8 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-10 w-56 h-56 rounded-full bg-[#EA4335]/6 blur-3xl pointer-events-none" />
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Self-hosted, no account needed
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10">
            Runs entirely on your machine. One command brings up the whole
            stack.
          </p>
          <pre className="text-left bg-gray-900 rounded-xl p-5 text-xs text-gray-300 font-mono mb-8 whitespace-pre shadow-lg shadow-gray-900/10">
            {`docker compose up -d`}
          </pre>
          <Link
            to="/explorer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-200/60"
          >
            Open Explorer
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent font-semibold">
            ReAgent
          </span>
          <span>Deterministic replay and diff for LangGraph agents</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ label, headline, body, accent }) {
  const styles = {
    sky: {
      tag: "bg-sky-50 text-sky-600 border border-sky-100",
      bg: "bg-gradient-to-br from-sky-50/70 to-white hover:from-sky-50 hover:shadow-sky-100/50",
    },
    indigo: {
      tag: "bg-indigo-50 text-indigo-600 border border-indigo-100",
      bg: "bg-gradient-to-br from-indigo-50/70 to-white hover:from-indigo-50 hover:shadow-indigo-100/50",
    },
    emerald: {
      tag: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      bg: "bg-gradient-to-br from-emerald-50/70 to-white hover:from-emerald-50 hover:shadow-emerald-100/50",
    },
  }[accent];

  return (
    <div
      className={`p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all ${styles.bg}`}
    >
      <span
        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${styles.tag}`}
      >
        {label}
      </span>
      <p className="text-gray-900 font-semibold mb-2">{headline}</p>
      <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function StatCard({ value, label, gradient }) {
  return (
    <div className="p-6 rounded-xl bg-white border border-gray-200 text-center shadow-sm">
      <p
        className={`text-3xl font-extrabold mb-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        {value}
      </p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}
