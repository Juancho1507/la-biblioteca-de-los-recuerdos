import {PlayerProfile,Settings} from '../types';
export const SAVE_KEY='library-memory-save-v1';
export const defaultSettings:Settings={music:true,effects:true,volume:70,quality:'high',reducedMotion:false};
export function freshProfile(username=''):PlayerProfile{return {username,currentLevel:1,completedLevels:[],starsByLevel:{},bestScores:{},bestTimes:{},bestMoves:{},unlockedAchievements:[],selectedMode:'archive',totalGames:0,totalMatches:0,totalAttempts:0,settings:defaultSettings};}
export function loadProfile():PlayerProfile|null{try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;const p=JSON.parse(raw);if(!p||typeof p.username!=='string')return null;return {...freshProfile(p.username),...p,settings:{...defaultSettings,...p.settings}};}catch{return null}}
export function saveProfile(p:PlayerProfile){try{localStorage.setItem(SAVE_KEY,JSON.stringify(p));}catch{/* storage unavailable */}}
