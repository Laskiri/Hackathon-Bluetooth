export interface Answer {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  artifactId?: string;
  question: string;
  answers: Answer[];
  correctAnswerId: string;
}

export interface QuizData {
  questions: Question[];
  runestoneName?: string;
}

export const QUIZ_DATA: QuizData = {
  runestoneName: 'Artefacts Runestone',
  questions: [
    {
      id: 'q1',
      artifactId: 'artifact-1',
      question: 'Which material was commonly used to make Viking swords?',
      answers: [
        { id: 'a1', text: 'Bronze' },
        { id: 'a2', text: 'Iron/Steel' },
        { id: 'a3', text: 'Wood' },
      ],
      correctAnswerId: 'a2',
    },
    {
      id: 'q2',
      artifactId: 'artifact-3',
      question: 'Runestones were primarily used to:',
      answers: [
        { id: 'a1', text: 'Record important events or memorials' },
        { id: 'a2', text: 'Store grain' },
        { id: 'a3', text: 'Weave fabrics' },
      ],
      correctAnswerId: 'a1',
    },
    {
      id: 'q3',
      artifactId: 'artifact-4',
      question: 'Which of these items is commonly found as a grave good in Viking burials?',
      answers: [
        { id: 'a1', text: 'Smartphone' },
        { id: 'a2', text: 'Brooch' },
        { id: 'a3', text: 'Plastic bottle' },
        { id: 'a4', text: 'Glass jar' },
      ],
      correctAnswerId: 'a2',
    },
  ],
};

export default QUIZ_DATA;
