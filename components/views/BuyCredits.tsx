import React from 'react';
import Card from '../shared/Card';
import { UserProfile, ActiveView } from '../../types';
import { Zap } from 'lucide-react';

interface BuyCreditsProps {
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
  profile: UserProfile;
}

const creditPackages = [
  { credits: 50, price: '$5.00', popular: false },
  { credits: 100, price: '$9.00', popular: true },
  { credits: 250, price: '$20.00', popular: false },
];

const BuyCredits: React.FC<BuyCreditsProps> = ({ updateProfile, setActiveView, profile }) => {
  const handlePurchase = (amount: number) => {
    // This is a simulation. In a real app, this would involve a payment gateway.
    updateProfile({ credits: profile.credits + amount });
    setActiveView('welcome');
  };

  return (
    <Card title="Buy More Credits">
      <p className="text-sm text-gray-600 mb-6 text-center">
        Your current balance is {profile.credits} credits. Choose a package below to top up.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {creditPackages.map((pkg, index) => (
          <div
            key={index}
            className={`relative border-2 p-6 rounded-lg text-center flex flex-col justify-between
              ${pkg.popular ? 'bg-purple-50 border-brand' : 'bg-white border-gray-200'}`}
          >
            {pkg.popular && (
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            <div>
              <div className="flex justify-center items-center gap-2 mb-2">
                <Zap className="w-8 h-8 text-amber-400" />
                <h3 className="text-4xl font-bold">{pkg.credits}</h3>
              </div>
              <p className="text-lg text-gray-700 mb-4">Credits</p>
              <p className="text-2xl font-semibold mb-6">{pkg.price}</p>
            </div>
            <button
              onClick={() => handlePurchase(pkg.credits)}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors
                ${pkg.popular ? 'bg-brand hover:bg-brand-dark text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-center mt-6 text-gray-500">
        This is a simulated transaction. No real payment is required.
      </p>
    </Card>
  );
};

export default BuyCredits;