
import React from 'react';
import QuickStudyFeatures from './study/QuickStudyFeatures';

interface StudyFeaturesProps {
  onFeatureSelect: (message: string) => void;
}

const StudyFeatures: React.FC<StudyFeaturesProps> = ({ onFeatureSelect }) => {
  return (
    <div className="w-full">
      <QuickStudyFeatures onFeatureSelect={onFeatureSelect} />
    </div>
  );
};

export default StudyFeatures;
