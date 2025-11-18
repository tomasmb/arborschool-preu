"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphData<N, L> {
  nodes: N[];
  links: L[];
}

interface NodeObject {
  id?: string | number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface KnowledgeNode {
  id: string;
  name: string;
  exam_level: string[];
  axis: string;
  concept: string | null;
  representation: string | null;
  task: string | null;
  description: string;
  prerequisites: string[];
  co_requisites: string[];
  encompassed_by: string[];
  diagnostic_links: string[];
  skills: string[];
  contexts: string[];
  status: string;
  source_refs: string[];
  examples: number;
}

interface GraphNode extends NodeObject {
  id: string;
  name: string;
  axis: string;
  level: string[];
  val: number;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

const axisColors: Record<string, string> = {
  Números: "#3B82F6",
  "Álgebra y funciones": "#10B981",
  Geometría: "#F59E0B",
  "Probabilidad y estadística": "#EF4444",
};

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<
    GraphData<GraphNode, GraphLink>
  >({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => {
    fetch("/paes_math_kg.json")
      .then((res) => res.json())
      .then((data: KnowledgeNode[]) => {
        const nodes: GraphNode[] = data.map((node) => ({
          id: node.id,
          name: node.name,
          axis: node.axis,
          level: node.exam_level,
          val: 1 + node.prerequisites.length + node.encompassed_by.length,
          color: axisColors[node.axis] || "#6B7280",
        }));

        // Create a Set of valid node IDs for quick lookup
        const validNodeIds = new Set(data.map((node) => node.id));

        const links: GraphLink[] = [];

        data.forEach((node) => {
          node.prerequisites.forEach((prereq) => {
            // Only add link if both source and target exist
            if (validNodeIds.has(prereq)) {
              links.push({
                source: prereq,
                target: node.id,
                type: "prerequisite",
              });
            }
          });

          node.encompassed_by.forEach((parent) => {
            if (validNodeIds.has(parent)) {
              links.push({
                source: parent,
                target: node.id,
                type: "encompassed_by",
              });
            }
          });

          node.diagnostic_links.forEach((link) => {
            if (validNodeIds.has(link)) {
              links.push({
                source: node.id,
                target: link,
                type: "diagnostic",
              });
            }
          });
        });

        setGraphData({ nodes, links });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading knowledge graph:", error);
        setLoading(false);
      });
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    fetch("/paes_math_kg.json")
      .then((res) => res.json())
      .then((data: KnowledgeNode[]) => {
        const fullNode = data.find((n) => n.id === node.id);
        if (fullNode) {
          setSelectedNode(fullNode);
        }
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading knowledge graph...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node) => (node as GraphNode).color || "#6B7280"}
          nodeVal={(node) => (node as GraphNode).val}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkColor={(link) => {
            const l = link as GraphLink;
            return l.type === "prerequisite"
              ? "#9CA3AF"
              : l.type === "encompassed_by"
                ? "#6B7280"
                : "#D1D5DB";
          }}
          onNodeClick={(node) => handleNodeClick(node as GraphNode)}
          width={1200}
          height={800}
          backgroundColor="#F9FAFB"
        />
      </div>

      {selectedNode && (
        <div className="w-96 bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[800px]">
          <div className="mb-4">
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700 mb-2"
            >
              ✕ Close
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {selectedNode.name}
            </h2>
            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
              {selectedNode.id}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Eje</h3>
              <p
                className="text-sm px-2 py-1 rounded inline-block"
                style={{
                  backgroundColor: axisColors[selectedNode.axis] + "20",
                  color: axisColors[selectedNode.axis],
                }}
              >
                {selectedNode.axis}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Descripción</h3>
              <p className="text-sm text-gray-600">{selectedNode.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">
                Nivel de Examen
              </h3>
              <div className="flex gap-2">
                {selectedNode.exam_level.map((level) => (
                  <span
                    key={level}
                    className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>

            {selectedNode.prerequisites.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  Prerequisitos
                </h3>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {selectedNode.prerequisites.map((prereq) => (
                    <li key={prereq}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedNode.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  Habilidades
                </h3>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded bg-green-100 text-green-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.contexts.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Contextos</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.contexts.map((context) => (
                    <span
                      key={context}
                      className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800"
                    >
                      {context}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.concept && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Concepto</h3>
                <p className="text-sm text-gray-600">{selectedNode.concept}</p>
              </div>
            )}

            {selectedNode.representation && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">
                  Representación
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedNode.representation}
                </p>
              </div>
            )}

            {selectedNode.task && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Tarea</h3>
                <p className="text-sm text-gray-600">{selectedNode.task}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
