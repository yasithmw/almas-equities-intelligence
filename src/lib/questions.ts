import type { Question } from './answers'

export const QUESTIONS: Question[] = [
  {
    id: 'q01',
    text: 'Which listed bank stocks have the highest dividend yield right now?',
    aliases: ['dividend yield', 'bank dividend', 'highest yield', 'best yielding bank'],
  },
  {
    id: 'q02',
    text: 'How do COMB and HNB compare on P/E and dividend yield?',
    aliases: ['comb vs hnb', 'comb hnb', 'compare comb', 'pe comparison'],
  },
  {
    id: 'q03',
    text: 'What are foreign investors buying and selling this week?',
    aliases: ['foreign flows', 'foreign buying', 'foreign investors', 'foreign net'],
  },
  {
    id: 'q04',
    text: 'Show me the gain since purchase on A/C 10482',
    aliases: ['10482', 'client gain', 'gain since purchase', 'account gain'],
  },
  {
    id: 'q05',
    text: 'Which sectors are driving the ASPI this month?',
    aliases: ['sector performance', 'driving the aspi', 'sector contribution'],
  },
  {
    id: 'q06',
    text: 'How is brokerage revenue tracking against turnover?',
    aliases: ['brokerage revenue', 'revenue trend', 'revenue against turnover'],
  },
]
