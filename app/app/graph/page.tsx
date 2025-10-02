import KnowledgeGraph from "./KnowledgeGraph";

export default function GraphPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          PAES Math Knowledge Graph
        </h1>
        <KnowledgeGraph />
      </div>
    </div>
  );
}
