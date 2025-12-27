import React from 'react';
import KosisSearch from './KosisSearch';

const Intro = ({ onKosisDataSelect }) => {
  return (
    <div className="w-full max-w-4xl">
      <KosisSearch onDataSelect={onKosisDataSelect} />
    </div>
  );
};

export default Intro;
