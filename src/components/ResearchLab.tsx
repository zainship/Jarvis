import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  FileText,
  Volume2,
  RefreshCw,
  Cloud,
  ChevronDown,
  Printer,
  FileCode,
  History,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { ResearchDossier, GroundingSource } from "../types";
import { SoundFX } from "../utils/soundEffects";
import {
  auth,
  db,
  saveDossierToFirestore,
  deleteDossierFromFirestore,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface ResearchLabProps {
  onJarvisSpeak: (text: string) => void;
  initialTopic?: string | null;
}

interface SavedDossierRecord {
  id: string;
  topic: string;
  title: string;
  executiveSummary: string;
  dossierJson: ResearchDossier;
  createdAt: string;
}

export const ResearchLab: React.FC<ResearchLabProps> = ({ onJarvisSpeak, initialTopic }) => {
  const [topic, setTopic] = useState("Quantum Computing Advancements and Enterprise Applications in 2026");
  const [isLoading, setIsLoading] = useState(false);
  const [dossier, setDossier] = useState<ResearchDossier | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [copied, setCopied] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedDossiers, setSavedDossiers] = useState<SavedDossierRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-execute when initialTopic is passed
  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopic(initialTopic);
      executeResearch(initialTopic);
    }
  }, [initialTopic]);

  // Sync saved dossiers from Firestore for authenticated user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const dossiersPath = `users/${user.uid}/research_dossiers`;
        const q = query(collection(db, dossiersPath), orderBy("createdAt", "desc"));
        const unsubscribeDossiers = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: SavedDossierRecord[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                let parsedDossier: ResearchDossier = {
                  title: data.title || data.topic,
                  executiveSummary: data.executiveSummary || "",
                  keyStatistics: [],
                  mainPillars: [],
                  opportunitiesAndRisks: { opportunities: [], risks: [] },
                  strategicRecommendations: [],
                };
                if (data.dossierJson) {
                  try {
                    parsedDossier = typeof data.dossierJson === "string" ? JSON.parse(data.dossierJson) : data.dossierJson;
                  } catch (e) {
                    console.warn("Could not parse dossierJson", e);
                  }
                }
                return {
                  id: doc.id,
                  topic: data.topic,
                  title: data.title || data.topic,
                  executiveSummary: data.executiveSummary || "",
                  dossierJson: parsedDossier,
                  createdAt: data.createdAt || new Date().toISOString(),
                };
              });
              setSavedDossiers(loaded);
            } else {
              setSavedDossiers([]);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, dossiersPath);
          }
        );
        return () => unsubscribeDossiers();
      } else {
        setSavedDossiers([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeResearch = async (customTopic?: string) => {
    const queryTopic = customTopic || topic;
    if (!queryTopic.trim()) return;

    setIsLoading(true);
    SoundFX.playComputeChime();
    try {
      const res = await fetch("/api/jarvis/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchTopic: queryTopic }),
      });
      const data = await res.json();
      setDossier(data.dossier);
      setSources(data.sources || []);
      SoundFX.playWorkflowSuccess();

      // Persist dossier to Firestore if user is authenticated
      if (auth.currentUser && data.dossier) {
        saveDossierToFirestore(auth.currentUser.uid, {
          topic: queryTopic,
          title: data.dossier.title || queryTopic,
          executiveSummary: data.dossier.executiveSummary || "",
          dossierJson: data.dossier,
        }).catch(console.error);
      }

      if (onJarvisSpeak && data.dossier?.executiveSummary) {
        onJarvisSpeak(
          `Research dossier on ${data.dossier.title} completed, sir. Here is the executive synthesis: ${data.dossier.executiveSummary.slice(0, 300)}`
        );
      }
    } catch (e) {
      console.error("Research error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const copyDossier = () => {
    if (!dossier) return;
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopied(true);
    SoundFX.playTargetClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const generateMarkdownString = (): string => {
    if (!dossier) return "";
    const sanitizedTitle = dossier.title || topic;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let md = `# ${sanitizedTitle}\n\n`;
    md += `> **Report Date**: ${dateStr}\n`;
    md += `> **Classification**: J.A.R.V.I.S. Autonomous Intelligence Dossier\n`;
    md += `> **Research Subject**: ${topic}\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Synthesis\n\n`;
    md += `${dossier.executiveSummary}\n\n`;

    if (dossier.keyStatistics && dossier.keyStatistics.length > 0) {
      md += `## 2. Key Metrics & Industry Statistics\n\n`;
      dossier.keyStatistics.forEach((stat) => {
        md += `- **${stat.metric}**: \`${stat.value}\`${stat.significance ? ` — *${stat.significance}*` : ""}\n`;
      });
      md += `\n`;
    }

    if (dossier.mainPillars && dossier.mainPillars.length > 0) {
      md += `## 3. Core Foundations & Technical Pillars\n\n`;
      dossier.mainPillars.forEach((pillar, index) => {
        md += `### 3.${index + 1} ${pillar.heading}\n\n`;
        md += `${pillar.details}\n\n`;
        if (pillar.bulletPoints && pillar.bulletPoints.length > 0) {
          pillar.bulletPoints.forEach((bp) => {
            md += `- ${bp}\n`;
          });
          md += `\n`;
        }
      });
    }

    if (
      (dossier.opportunitiesAndRisks?.opportunities && dossier.opportunitiesAndRisks.opportunities.length > 0) ||
      (dossier.opportunitiesAndRisks?.risks && dossier.opportunitiesAndRisks.risks.length > 0)
    ) {
      md += `## 4. Strategic Landscape & Trajectory\n\n`;

      if (dossier.opportunitiesAndRisks.opportunities?.length > 0) {
        md += `### High-Impact Opportunities\n\n`;
        dossier.opportunitiesAndRisks.opportunities.forEach((opp) => {
          md += `- [x] ${opp}\n`;
        });
        md += `\n`;
      }

      if (dossier.opportunitiesAndRisks.risks?.length > 0) {
        md += `### Critical Risks & Headwinds\n\n`;
        dossier.opportunitiesAndRisks.risks.forEach((risk) => {
          md += `- [!] ${risk}\n`;
        });
        md += `\n`;
      }
    }

    if (dossier.strategicRecommendations && dossier.strategicRecommendations.length > 0) {
      md += `## 5. JARVIS Strategic Action Recommendations\n\n`;
      dossier.strategicRecommendations.forEach((rec, idx) => {
        md += `${idx + 1}. **Action**: ${rec}\n`;
      });
      md += `\n`;
    }

    if (sources && sources.length > 0) {
      md += `## 6. Grounded Intelligence Sources\n\n`;
      sources.forEach((src, idx) => {
        md += `${idx + 1}. [${src.title}](${src.url})\n`;
      });
      md += `\n`;
    }

    md += `---\n*Generated autonomously by J.A.R.V.I.S. AI System*`;
    return md;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const handleExportMarkdown = () => {
    if (!dossier) return;
    SoundFX.playWorkflowSuccess();
    const mdContent = generateMarkdownString();
    const cleanFilename = (dossier.title || "research-dossier")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    downloadFile(mdContent, `${cleanFilename}.md`, "text/markdown;charset=utf-8;");
    setIsExportMenuOpen(false);
    showExportToast("Markdown (.md) downloaded successfully");
  };

  const handleExportPDF = () => {
    if (!dossier) return;
    SoundFX.playWorkflowSuccess();

    // Create a styled print window for PDF generation
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback: download markdown if popup is blocked
      handleExportMarkdown();
      return;
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${dossier.title} - Research Dossier</title>
  <style>
    @page {
      margin: 20mm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 5px 0 10px 0;
      line-height: 1.2;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #0369a1;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      font-size: 13px;
      margin: 0 0 12px 0;
      color: #334155;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 15px 0;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .stat-metric {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #0284c7;
      margin: 4px 0;
    }
    .stat-sig {
      font-size: 10px;
      color: #94a3b8;
    }
    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 20px;
      font-size: 13px;
      color: #334155;
    }
    li {
      margin-bottom: 4px;
    }
    .sources {
      font-size: 11px;
      color: #0284c7;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">J.A.R.V.I.S. Intelligence Dossier</div>
    <h1>${dossier.title}</h1>
    <div class="meta">
      <strong>Generated:</strong> ${dateStr} &nbsp;|&nbsp; 
      <strong>Subject:</strong> ${topic} &nbsp;|&nbsp; 
      <strong>System:</strong> J.A.R.V.I.S. Autonomous Research Engine
    </div>
  </div>

  <h2>1. Executive Synthesis</h2>
  <p>${dossier.executiveSummary}</p>

  ${
    dossier.keyStatistics && dossier.keyStatistics.length > 0
      ? `
    <h2>2. Key Metrics & Industry Statistics</h2>
    <div class="stats-grid">
      ${dossier.keyStatistics
        .map(
          (s) => `
        <div class="stat-card">
          <div class="stat-metric">${s.metric}</div>
          <div class="stat-value">${s.value}</div>
          ${s.significance ? `<div class="stat-sig">${s.significance}</div>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  ${
    dossier.mainPillars && dossier.mainPillars.length > 0
      ? `
    <h2>3. Technical & Strategic Pillars</h2>
    ${dossier.mainPillars
      .map(
        (p, idx) => `
      <h3>3.${idx + 1} ${p.heading}</h3>
      <p>${p.details}</p>
      ${p.bulletPoints && p.bulletPoints.length > 0 ? `<ul>${p.bulletPoints.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
    `
      )
      .join("")}
  `
      : ""
  }

  ${
    dossier.opportunitiesAndRisks?.opportunities && dossier.opportunitiesAndRisks.opportunities.length > 0
      ? `
    <h2>4. Strategic Opportunities</h2>
    <ul>
      ${dossier.opportunitiesAndRisks.opportunities.map((o) => `<li><strong>Opportunity:</strong> ${o}</li>`).join("")}
    </ul>
  `
      : ""
  }

  ${
    dossier.strategicRecommendations && dossier.strategicRecommendations.length > 0
      ? `
    <h2>5. Strategic Recommendations</h2>
    <ol>
      ${dossier.strategicRecommendations.map((r) => `<li>${r}</li>`).join("")}
    </ol>
  `
      : ""
  }

  ${
    sources && sources.length > 0
      ? `
    <h2>6. Grounded Web Citations</h2>
    <ol class="sources">
      ${sources.map((s) => `<li>${s.title} — ${s.url}</li>`).join("")}
    </ol>
  `
      : ""
  }

  <div class="footer">
    J.A.R.V.I.S. Autonomous Cognitive System &bull; Confidential Intelligence Report &bull; Page 1
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportMenuOpen(false);
    showExportToast("Print / PDF Export dialog launched");
  };

  const handleExportJSON = () => {
    if (!dossier) return;
    SoundFX.playWorkflowSuccess();
    const exportData = {
      title: dossier.title,
      topic,
      generatedAt: new Date().toISOString(),
      executiveSummary: dossier.executiveSummary,
      keyStatistics: dossier.keyStatistics,
      mainPillars: dossier.mainPillars,
      opportunitiesAndRisks: dossier.opportunitiesAndRisks,
      strategicRecommendations: dossier.strategicRecommendations,
      sources,
    };
    const cleanFilename = (dossier.title || "research-dossier")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    downloadFile(JSON.stringify(exportData, null, 2), `${cleanFilename}.json`, "application/json");
    setIsExportMenuOpen(false);
    showExportToast("Raw JSON data exported successfully");
  };

  const showExportToast = (msg: string) => {
    setExportSuccessMessage(msg);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 3500);
  };

  return (
    <div id="research-lab-container" className="w-full flex flex-col gap-6">
      {/* Research Topic Header Card */}
      <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-[inset_0_0_15px_rgba(14,165,233,0.1)]">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-sky-500 font-bold font-mono block mb-0.5">
                Deep Research & Analysis
              </span>
              <h2 className="text-xl font-serif italic text-white tracking-tight flex items-center gap-2">
                Autonomous Intelligence Dossier Lab
              </h2>
            </div>
          </div>
        </div>

        {/* Search Field & Presets */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="research-topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeResearch()}
            placeholder="Enter research subject or prompt JARVIS..."
            className="flex-1 bg-[#050506] border border-white/10 rounded-full px-5 py-3 text-sm font-serif italic text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/40 shadow-inner"
          />
          <button
            id="start-deep-research-btn"
            onClick={() => executeResearch()}
            disabled={isLoading || !topic.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.35)] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>SYNTHESIZING...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>GENERATE DOSSIER</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">Popular Queries:</span>
          {[
            "Solid State Battery Breakthroughs",
            "Multimodal Autonomous Agents",
            "Global Semiconductor Supply Chain 2026",
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopic(item);
                executeResearch(item);
              }}
              className="px-3 py-1 rounded-full bg-[#050506] border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-500/30 transition-all text-xs"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Cloud Dossiers Library */}
      {currentUser && (
        <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                CLOUD RESEARCH ARCHIVE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-mono text-sky-400">
                {savedDossiers.length} Saved
              </span>
            </div>
            <button
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="text-[11px] font-mono text-slate-400 hover:text-sky-300 transition-colors"
            >
              {isHistoryOpen ? "Collapse" : "Expand"}
            </button>
          </div>

          {isHistoryOpen && (
            <div>
              {savedDossiers.length === 0 ? (
                <div className="py-6 text-center text-slate-500 font-mono text-xs">
                  No previous research reports saved yet. Generate your first research dossier above to automatically sync it to your Google Cloud Firestore account.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {savedDossiers.map((item) => (
                    <div
                      key={item.id}
                      className="group p-3.5 rounded-xl bg-[#050506] border border-white/5 hover:border-sky-500/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span className="text-sky-400/80">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentUser) {
                                SoundFX.playTargetClick();
                                deleteDossierFromFirestore(currentUser.uid, item.id).catch(console.error);
                              }
                            }}
                            title="Delete Dossier"
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 transition-all p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <h4 className="text-xs font-serif italic text-slate-200 line-clamp-2 leading-snug group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {item.executiveSummary}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          SoundFX.playComputeChime();
                          setTopic(item.topic);
                          setDossier(item.dossierJson);
                          setSources([]);
                          if (onJarvisSpeak && item.executiveSummary) {
                            onJarvisSpeak(`Loaded research dossier on ${item.title}, sir.`);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-[11px] font-mono transition-all"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>OPEN REPORT</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Research Output View */}
      {isLoading ? (
        <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl py-20 flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">
            JARVIS Autonomous Search Engine querying live internet & synthesizing sources...
          </p>
        </div>
      ) : dossier ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest block mb-1">
                  Confidential Intelligence Dossier
                </span>
                <h3 className="text-2xl font-serif italic text-white">
                  {dossier.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="vocal-summary-btn"
                  onClick={() => onJarvisSpeak(dossier.executiveSummary)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>SPOKEN SUMMARY</span>
                </button>

                <button
                  id="copy-dossier-btn"
                  onClick={copyDossier}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[#050506] border border-white/10 text-slate-300 hover:text-white transition-all"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "COPIED" : "COPY DOSSIER"}</span>
                </button>

                {/* Export Data Button & Dropdown */}
                <div className="relative" ref={exportDropdownRef}>
                  <button
                    id="export-data-btn"
                    onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-sky-500 hover:bg-sky-400 text-black shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT DATA</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isExportMenuOpen && (
                    <div
                      id="export-data-dropdown"
                      className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0C] border border-sky-500/30 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                          Export Research Insights
                        </span>
                      </div>

                      {/* Option 1: Markdown */}
                      <button
                        id="export-markdown-btn"
                        onClick={handleExportMarkdown}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-black transition-all shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-semibold text-white group-hover:text-sky-300">
                            Markdown (.md)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Download structured Markdown note
                          </span>
                        </div>
                      </button>

                      {/* Option 2: PDF */}
                      <button
                        id="export-pdf-btn"
                        onClick={handleExportPDF}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all shrink-0 mt-0.5">
                          <Printer className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-semibold text-white group-hover:text-emerald-300">
                            PDF Document (.pdf)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Print or save formatted report
                          </span>
                        </div>
                      </button>

                      {/* Option 3: JSON */}
                      <button
                        id="export-json-btn"
                        onClick={handleExportJSON}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/5 text-left transition-colors group border-t border-white/5 mt-1 pt-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0 mt-0.5">
                          <FileCode className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-semibold text-white group-hover:text-amber-300">
                            Raw JSON (.json)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Structured schema object
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Success Feedback Toast */}
            {exportSuccessMessage && (
              <div
                id="export-success-toast"
                className="bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs font-mono text-sky-300 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {dossier.executiveSummary}
            </p>

            {/* Key Statistics Grid */}
            {dossier.keyStatistics && dossier.keyStatistics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {dossier.keyStatistics.map((stat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#050506] border border-white/5">
                    <span className="text-xs font-mono text-slate-400 block">{stat.metric}</span>
                    <span className="text-xl font-serif italic font-semibold text-sky-400 block mt-1">
                      {stat.value}
                    </span>
                    {stat.significance && (
                      <span className="text-[11px] font-sans text-slate-500 mt-1 block">
                        {stat.significance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Pillars & Strategic Landscape */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Pillars */}
            <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono block mb-1">
                  Core Foundations
                </span>
                <h4 className="text-base font-serif italic text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  Technical & Industry Pillars
                </h4>
              </div>
              <div className="space-y-4">
                {dossier.mainPillars.map((pillar, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#050506] border border-white/5 space-y-2">
                    <h5 className="text-xs font-serif italic font-semibold text-sky-300">
                      {pillar.heading}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {pillar.details}
                    </p>
                    {pillar.bulletPoints && (
                      <ul className="space-y-1 text-xs text-slate-400 pl-1">
                        {pillar.bulletPoints.map((bp, bidx) => (
                          <li key={bidx} className="flex items-start gap-2">
                            <span className="text-sky-400 mt-0.5">•</span>
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities & Strategic Recommendations */}
            <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono block mb-1">
                  Strategic Horizon
                </span>
                <h4 className="text-base font-serif italic text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Strategic Action Plan & Trajectory
                </h4>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#050506] border border-white/5 space-y-2">
                  <span className="text-xs font-serif italic font-semibold text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> High-Impact Opportunities
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {dossier.opportunitiesAndRisks.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#050506] border border-white/5 space-y-2">
                  <span className="text-xs font-serif italic font-semibold text-sky-400">
                    JARVIS Strategic Recommendations
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {dossier.strategicRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-400 font-serif italic font-bold">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Web Sources Citations */}
              {sources.length > 0 && (
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-2">
                    Verified Grounded Web Sources ({sources.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#050506] border border-white/10 hover:border-sky-500/40 text-[10px] font-mono text-slate-300 hover:text-sky-300 transition-all truncate max-w-[220px]"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl py-16 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
          <BookOpen className="w-10 h-10 mb-2 text-slate-700" />
          <span>Enter any topic above to generate a real-time autonomous research dossier.</span>
        </div>
      )}
    </div>
  );
};
