import React from 'react';
import Card from './Card';

const WorkshopCtaCard: React.FC = () => {
  return (
    <Card className="mt-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Want a Personalized Career Plan?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Go beyond AI tools. Join our 4-Day Job Winning Workshop for live, hands-on training with career expert Rajinder Kumar and get a complete system to land your dream job.
          </p>
          <a
            href="https://brainyscout.com/job-success-system-webinar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
            Learn More & Register
          </a>
        </div>
        <div className="w-full md:w-64 lg:w-80 flex-shrink-0">
          <div className="aspect-w-16 rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <iframe
              src="https://player.vimeo.com/video/1014374153?h=e7a4edb030"
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Job Winning Workshop"
            ></iframe>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WorkshopCtaCard;