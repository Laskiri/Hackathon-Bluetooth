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
  runestoneName: 'Artifacts Runestone',
  questions: [
    {
      id: 'q1',
      artifactId: 'artifact-2',
      question: 'What was the most luxurious fruit for vikings',
      answers: [
        { id: 'a1', text: 'Oranges' },
        { id: 'a2', text: 'Figgs' },
        { id: 'a3', text: 'Grapes' },
        { id: 'a4', text: 'We still dont know' },
      ],
      correctAnswerId: 'a4',
    },
  ],
};

export default QUIZ_DATA;
