export type GameMode = 'archive' | 'chronos' | 'arcane';
export type Screen = 'home'|'modes'|'map'|'game'|'profile'|'achievements'|'settings';
export type SpecialCard = 'mirror'|'time'|'shadow'|'oracle'|'portal'|'phoenix'|'rune';
export interface Level {id:number; difficulty:number; pairs:number; timeLimit:number; multiplier:number; specialCards:SpecialCard[]; targetScore:number; targetMoves:number; room:string; title:string}
export interface Card {id:string; pairId:number; symbol:string; flipped:boolean; matched:boolean; special?:SpecialCard}
export interface PlayerProfile {username:string; currentLevel:number; completedLevels:number[]; starsByLevel:Record<number,number>; bestScores:Record<number,number>; bestTimes:Record<number,number>; bestMoves:Record<number,number>; unlockedAchievements:string[]; selectedMode:GameMode; totalGames:number; totalMatches:number; totalAttempts:number; settings:Settings}
export interface Settings {music:boolean; effects:boolean; volume:number; quality:'high'|'balanced'|'low'; reducedMotion:boolean}
export interface Achievement {id:string; title:string; description:string; icon:string}
export interface Result {score:number; stars:number; time:number; moves:number; matches:number; mistakes:number}
