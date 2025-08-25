
import React from 'react';
import { 
  Clock, 
  BarChart2, 
  Target, 
  ListTodo, 
  Trophy, 
  Calendar 
} from 'lucide-react';

export interface IconProps {
  className?: string;
}

export const TimerIcon: React.FC<IconProps> = ({ className }) => {
  return <Clock className={`text-purple-600 dark:text-purple-400 ${className}`} />;
};

export const ChartBarIcon: React.FC<IconProps> = ({ className }) => {
  return <BarChart2 className={`text-blue-600 dark:text-blue-400 ${className}`} />;
};

export const TargetIcon: React.FC<IconProps> = ({ className }) => {
  return <Target className={`text-green-600 dark:text-green-400 ${className}`} />;
};

export const ListTodoIcon: React.FC<IconProps> = ({ className }) => {
  return <ListTodo className={`text-amber-600 dark:text-amber-400 ${className}`} />;
};

export const TrophyIcon: React.FC<IconProps> = ({ className }) => {
  return <Trophy className={`text-yellow-600 dark:text-yellow-400 ${className}`} />;
};

export const CalendarIcon: React.FC<IconProps> = ({ className }) => {
  return <Calendar className={`text-indigo-600 dark:text-indigo-400 ${className}`} />;
};
