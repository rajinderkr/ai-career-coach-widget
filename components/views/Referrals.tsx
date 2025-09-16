
import React from 'react';
import Card from '../shared/Card';

const Referrals: React.FC = () => {
  return (
    <Card title="Recruiter & Agency Database">
      <p className="text-sm text-gray-600 mb-3">
        Access our curated list of top recruiters and agencies to find referrals. This feature requires a premium account.
      </p>
      <button className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors">
        See Plans
      </button>
    </Card>
  );
};

export default Referrals;