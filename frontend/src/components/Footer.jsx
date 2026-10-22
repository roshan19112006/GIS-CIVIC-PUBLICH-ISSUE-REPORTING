import React from 'react';
import { MapPin, Heart, Shield, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <MapPin className="w-5 h-5 text-civic-400" /> CivicGIS Platform
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-Stack GIS-Based Civic Issue Reporting & Municipal Complaint Management Platform. Built for FSD College Demonstration.
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Key Features</h4>
            <ul className="text-xs space-y-2">
              <li>Interactive OpenStreetMap & Geolocation</li>
              <li>Role-Based Access (Citizen, Officer, Admin)</li>
              <li>Dual Photograph Verification Workflow</li>
              <li>Dynamic Heatmap & Audit Trails</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Tech Stack</h4>
            <ul className="text-xs space-y-2">
              <li>React.js & Vite + Tailwind CSS</li>
              <li>Node.js & Express.js REST API</li>
              <li>MySQL Relational Database</li>
              <li>Leaflet.js + Recharts + JWT</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Academic Project</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Demonstrates end-to-end relational database persistence, parameterized transactions, and real-time municipal workflow state transitions.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-center text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} GIS-Based Civic Issue Reporting Platform. All rights reserved.</span>
          <span className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for civic empowerment.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
