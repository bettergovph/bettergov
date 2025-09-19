import React from 'react';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const PromotionBanner: React.FC = () => {
  return (
    <section className="bg-accent-500 py-12 text-white">
      <div className="container mx-auto px-4">
        <div className="md:flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">PhilSys National ID Registration</h2>
            <p className="text-white/90 mb-6 md:mb-0 max-w-xl">
              Register for your Philippine Identification System (PhilSys) ID card today. 
              The national ID serves as a single government-issued identification document for all citizens.
            </p>
          </div>
          <div>
            <Link to="https://philsys.gov.ph/registration-process">
              <Button
                className="bg-white text-accent-600 hover:bg-gray-100 shadow-lg px-8 py-3 text-lg"
                size="lg"
              >
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionBanner;