// app/components/AgentsList.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader } from "lucide-react";

interface Agent {
  name: string;
  expertise: string;
  supported_files?: string[];
  category: string;
  isDocument: boolean;
}

interface AgentsResponse {
  total_agents: number;
  new_agent: Omit<Agent, 'category' | 'isDocument'>;
  master_agent: Omit<Agent, 'category' | 'isDocument'>;
  specialized_agents: Array<Omit<Agent, 'category' | 'isDocument'>>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function AgentsList() {
  const [agents, setAgents] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/agents`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch agents");

        const data: AgentsResponse = await res.json();
        setAgents(data);
      } catch (err) {
        console.error(err);
        setError("Could not load agents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const truncate = (str: string, maxWords = 12) => {
    const words = str.split(" ");
    if (words.length <= maxWords) return str;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 animate-spin text-[#4CBB17]" />
        <p className="mt-4 text-[#b8e6b8]">Loading FarmSmart Agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400 text-lg">{error}</div>
    );
  }

  // Build agent list with metadata
  const allAgents: Agent[] = [
    { ...agents!.new_agent, category: "Document Agent", isDocument: true },
    { ...agents!.master_agent, category: "Master Agent", isDocument: false },
    ...agents!.specialized_agents.map(agent => ({
      ...agent,
      category: "Specialized Agent",
      isDocument: false,
    })),
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#b8e6b8] mb-2">
          FarmSmart AI Agents
        </h1>
        <p className="text-[#b8e6b8]/80">
          {agents?.total_agents} intelligent assistants ready to help with your farming needs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAgents.map((agent, idx) => (
          <div
            key={agent.name}
            className="group relative bg-[#1a3a1a] border border-[#4CBB17]/30 rounded-xl p-5 sm:p-6 
                      shadow-lg hover:shadow-xl transition-all duration-300
                      transform hover:-translate-y-1 opacity-0 animate-fade-in-up
                      hover:outline hover:outline-2 hover:outline-[#4CBB17] hover:outline-offset-2"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Category Badge */}
            <div className="absolute top-3 right-3">
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                agent.isDocument
                  ? 'bg-[#228B22]/80 text-white'
                  : agent.category === 'Master Agent'
                  ? 'bg-[#4CBB17]/80 text-[#0f1f14]'
                  : 'bg-[#4CBB17]/40 text-[#b8e6b8]'
              }`}>
                {agent.category}
              </span>
            </div>

            <h3 className="text-xl font-bold text-[#b8e6b8] mb-2 leading-tight">
              {agent.name}
            </h3>

            <p className="text-[#b8e6b8]/90 text-sm mb-4 line-clamp-3">
              {truncate(agent.expertise, 15)}
            </p>

 
            {/* Supports — hidden for Document Agent */}
            {!agent.isDocument && agent.supported_files && (
              <div className="mb-3">
                <p className="text-[10px] text-[#b8e6b8]/70 mb-1">Supports:</p>
                <div className="flex flex-wrap gap-1">
                  {agent.supported_files.map((ext) => (
                    <span
                      key={ext}
                      className="text-[9px] px-1.5 py-0.5 bg-[#4CBB17]/30 text-[#b8e6b8] rounded whitespace-nowrap"
                    >
                      .{ext.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Urdu — hidden for Document Agent */}
     

            {/* Subtle hover glow overlay */}
            <div className="absolute inset-0 rounded-xl pointer-events-none 
                            group-hover:bg-gradient-to-br group-hover:from-[#4CBB17]/10 group-hover:to-transparent
                            transition-all duration-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
}