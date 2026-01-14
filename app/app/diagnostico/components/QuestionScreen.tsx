import {
  AXIS_NAMES,
  SKILL_NAMES,
  type MSTQuestion,
} from "@/lib/diagnostic/config";

interface QuestionScreenProps {
  question: MSTQuestion;
  questionIndex: number;
  selectedAnswer: string | null;
  isDontKnow: boolean;
  onSelectAnswer: (answer: string) => void;
  onSelectDontKnow: () => void;
  onNext: () => void;
}

// Mock question content generator (replace with DB fetch in production)
function getQuestionContent(question: MSTQuestion, index: number) {
  const questionBank = [
    {
      text: "Si f(x) = 2x² - 3x + 1, ¿cuál es el valor de f(2)?",
      options: ["3", "5", "7", "9"],
      image: null,
    },
    {
      text: "Un rectángulo tiene un perímetro de 24 cm. Si su largo es el doble de su ancho, ¿cuál es su área?",
      options: ["32 cm²", "36 cm²", "40 cm²", "48 cm²"],
      image: null,
    },
    {
      text: "¿Cuál de las siguientes expresiones es equivalente a (x + 2)(x - 3)?",
      options: ["x² - x - 6", "x² + x - 6", "x² - 5x - 6", "x² - x + 6"],
      image: null,
    },
    {
      text: "En una urna hay 4 bolas rojas y 6 bolas azules. Si se extrae una bola al azar, ¿cuál es la probabilidad de que sea roja?",
      options: ["2/5", "3/5", "2/3", "4/6"],
      image: null,
    },
    {
      text: "Si el 30% de un número es 45, ¿cuál es el número?",
      options: ["135", "150", "165", "180"],
      image: null,
    },
    {
      text: "Un triángulo tiene ángulos que miden x°, 2x° y 3x°. ¿Cuál es el valor de x?",
      options: ["20°", "30°", "36°", "45°"],
      image: null,
    },
    {
      text: "¿Cuál es la pendiente de la recta que pasa por los puntos (1, 3) y (4, 9)?",
      options: ["2", "3", "4", "6"],
      image: null,
    },
    {
      text: "Si √(x + 5) = 4, ¿cuál es el valor de x?",
      options: ["9", "11", "16", "21"],
      image: null,
    },
  ];

  // Use question axis/skill combo to get more variety
  void question;
  return questionBank[index % questionBank.length];
}

/**
 * Question display with answer options
 */
export function QuestionScreen({
  question,
  questionIndex,
  selectedAnswer,
  isDontKnow,
  onSelectAnswer,
  onSelectDontKnow,
  onNext,
}: QuestionScreenProps) {
  const options = ["A", "B", "C", "D"];
  const canProceed = selectedAnswer !== null || isDontKnow;
  const questionContent = getQuestionContent(question, questionIndex);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="card p-6 sm:p-10">
        {/* Question metadata */}
        <div className="flex items-center gap-2 mb-6 text-sm text-cool-gray">
          <span className="px-2 py-1 bg-off-white rounded-md font-medium">
            {AXIS_NAMES[question.axis]}
          </span>
          <span className="px-2 py-1 bg-off-white rounded-md font-medium">
            {SKILL_NAMES[question.skill]}
          </span>
        </div>

        {/* Question content */}
        <div className="prose prose-lg max-w-none mb-8">
          <p className="text-charcoal text-lg leading-relaxed">
            {questionContent.text}
          </p>
          {questionContent.image && (
            <div className="my-6 p-4 bg-off-white rounded-xl text-center">
              <span className="text-cool-gray text-sm">
                [Imagen: {questionContent.image}]
              </span>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map((letter, idx) => (
            <button
              key={letter}
              onClick={() => onSelectAnswer(letter)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                ${
                  selectedAnswer === letter
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-primary/50 hover:bg-off-white"
                }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors
                ${selectedAnswer === letter ? "bg-primary text-white" : "bg-off-white text-charcoal"}`}
              >
                {letter}
              </span>
              <span className="text-left text-charcoal">
                {questionContent.options[idx]}
              </span>
            </button>
          ))}
        </div>

        {/* Don't know button */}
        <button
          onClick={onSelectDontKnow}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all duration-200
            ${
              isDontKnow
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-300 text-cool-gray hover:border-amber-400 hover:bg-amber-50/50"
            }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          No lo sé
        </button>

        {/* Next button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200
              ${
                canProceed
                  ? "btn-primary"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            Siguiente
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
