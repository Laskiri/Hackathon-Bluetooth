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
      question: 'Vikings often believed that symbols carved into their weapons could protect them in battle or bring them fortune. What did they commonly carve on their axes to channel luck or faith?',
      answers: [
        { id: 'a1', text: 'Runes (or Crosses)' },
        { id: 'a2', text: 'Dragon scales' },
        { id: 'a3', text: 'Knot patterns' },
        { id: 'a4', text: 'Sun symbols' },
      ],
      correctAnswerId: 'a1',
    },
    {
      id: 'q2',
      artifactId: 'artifact-1',
      question: 'Not every warrior could wield the finest weapons. Among Vikings, which weapon was considered a mark of the elite, symbolizing status and honor in battle?:',
      answers: [
        { id: 'a1', text: 'Spears' },
        { id: 'a2', text: 'Bows' },
        { id: 'a3', text: 'Swords' },
        { id: 'a4', text: 'Axes' },
      ],
      correctAnswerId: 'a3',
    },
  ],
};

export default QUIZ_DATA;
