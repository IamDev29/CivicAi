/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Send, 
  CheckCircle, 
  Loader2, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueCategory, IssueSeverity, CivicIssue } from '../types';

interface ReportFormProps {
  onSubmitIssue: (issue: Partial<CivicIssue>) => void;
  onAddPoints: (pts: number) => void;
}

// Beautiful stock images representing typical Indian civic issues for easy testing
const SAMPLE_PHOTOS = [
  {
    category: 'Pothole' as IssueCategory,
    name: 'Asphalt Pothole',
    url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    description: 'Deep road crater'
  },
  {
    category: 'Water Leak' as IssueCategory,
    name: 'Pipeline Rupture',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    description: 'Ruptured water main'
  },
  {
    category: 'Streetlight' as IssueCategory,
    name: 'Dark Lightpost',
    url: 'https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=600',
    description: 'Flickering/dead fixture'
  },
  {
    category: 'Waste' as IssueCategory,
    name: 'Trash Pileup',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    description: 'Overflowing dump heap'
  }
];

export default function ReportForm({ onSubmitIssue, onAddPoints }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Pothole');
  const [severity, setSeverity] = useState<IssueSeverity>('Medium');
  const [location, setLocation] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pointsGained, setPointsGained] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect GPS with loading simulation and nice Indian reverse geocoding mock
  const handleDetectLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGps({ lat, lng });

          // Mock reverse-geocoding depending on if they are actually in Bengaluru or elsewhere,
          // but we give a gorgeous localized landmark with high-precision mock details!
          setTimeout(() => {
            setIsLocating(false);
            // Dynamic Indian address based on GPS or pretty default
            const randomLandmark = [
              'Opposite To Metro Pillar 114, 100 Feet Rd, Indiranagar, Bengaluru, 560038',
              'Near Sony World Signal, 80 Feet Rd, 4th Block, Koramangala, Bengaluru, 560034',
              'Next to Mahatma Gandhi Statue, MG Road, Ashok Nagar, Bengaluru, 560001',
              'Commercial Street, near police booth, Tasker Town, Shivaji Nagar, Bengaluru, 560001'
            ][Math.floor(Math.random() * 4)];
            setLocation(randomLandmark);
          }, 1500);
        },
        (error) => {
          console.error('Error fetching location', error);
          // Fallback simulation in case geolocation permission denied in iframe
          setTimeout(() => {
            setIsLocating(false);
            const fallbackLat = 12.9716 + (Math.random() - 0.5) * 0.02;
            const fallbackLng = 77.5946 + (Math.random() - 0.5) * 0.02;
            setGps({ lat: fallbackLat, lng: fallbackLng });
            setLocation('12th Main Road, near post office, Indiranagar, Bengaluru, Karnataka');
          }, 1200);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (url: string, cat: IssueCategory) => {
    setPhotoUrl(url);
    setCategory(cat);
    // Autofill an elegant title based on category
    if (!title) {
      if (cat === 'Pothole') setTitle('Severe pothole on main road crossing');
      if (cat === 'Water Leak') setTitle('BWSSB drinking water pipeline burst');
      if (cat === 'Streetlight') setTitle('Multiple streetlights dark and dead');
      if (cat === 'Waste') setTitle('Garbage dumped illegally on footpath');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      const pts = 50; // Report issue rewards 50 points!
      onAddPoints(pts);
      setPointsGained(pts);

      onSubmitIssue({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        location: location.trim(),
        gps: gps || { lat: 12.9719 + (Math.random() - 0.5) * 0.05, lng: 77.5937 + (Math.random() - 0.5) * 0.05 },
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
        upvotes: 0,
        status: 'Open',
        reporterName: 'You (Ankit Kumar)',
        comments: []
      });

      setIsSubmitting(false);
      setShowSuccess(true);

      // Reset form fields
      setTitle('');
      setDescription('');
      setLocation('');
      setGps(null);
      setPhotoUrl('');
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 max-w-lg mx-auto">
      
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Form Header */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>File a Civic Report</span>
              </h2>
              <p className="text-xs text-gray-500">
                Help validate and fix local community infrastructure issues.
              </p>
            </div>

            {/* 1. Photo Selection & Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Add Issue Photo <span className="text-red-500">*</span>
              </label>
              
              {/* Image Preview / Upload Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  photoUrl ? 'border-green-300 bg-green-50/20' : 'border-gray-300 hover:border-[#1a73e8] bg-gray-50'
                }`}
              >
                {photoUrl ? (
                  <div className="w-full text-center space-y-2">
                    <img 
                      src={photoUrl} 
                      alt="Preview" 
                      className="max-h-48 rounded-lg mx-auto object-cover border border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs text-green-600 font-semibold flex items-center justify-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Photo loaded successfully! Click to change.</span>
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-3 rounded-full shadow-xs inline-flex text-gray-400">
                      <Camera className="w-6 h-6 text-[#1a73e8]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Tap to upload / take picture</p>
                      <p className="text-[10px] text-gray-400">Supports JPG, PNG, Camera access</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Quick sample pickers (AMAZING UX for iframe preview) */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#1a73e8]" />
                  <span>Quick Test Photos (For Iframe Testing):</span>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {SAMPLE_PHOTOS.map((sample) => (
                    <button
                      key={sample.category}
                      type="button"
                      onClick={() => handleSelectSamplePhoto(sample.url, sample.category)}
                      className={`text-left p-1 rounded-lg border text-[10px] bg-white transition hover:border-[#1a73e8] flex flex-col justify-between h-14 ${
                        photoUrl === sample.url ? 'border-2 border-[#1a73e8] bg-blue-50/30' : 'border-gray-200'
                      }`}
                    >
                      <span className="font-bold text-gray-700 block truncate">{sample.category}</span>
                      <span className="text-[8px] text-gray-400 block truncate leading-tight">{sample.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Category & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:border-[#1a73e8]"
                >
                  <option value="Pothole">🕳️ Pothole</option>
                  <option value="Water Leak">💧 Water Leak</option>
                  <option value="Streetlight">💡 Streetlight</option>
                  <option value="Waste">🗑️ Waste</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Severity <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                  {(['Low', 'Medium', 'High'] as IssueSeverity[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-1.5 rounded-md text-[10px] font-bold transition-all ${
                        severity === sev
                          ? sev === 'Low'
                            ? 'bg-green-600 text-white shadow-xs'
                            : sev === 'Medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-red-600 text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Auto-GPS & Location Landmark */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                2. Location Landmarks <span className="text-red-500">*</span>
              </label>
              
              {/* GPS Action button */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="flex items-center space-x-1.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] px-3.5 py-2.5 rounded-lg text-xs font-bold transition duration-150 disabled:opacity-75 cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locating...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Auto-detect GPS</span>
                    </>
                  )}
                </button>

                {gps && (
                  <span className="text-[10px] text-green-600 font-semibold self-center flex items-center space-x-1 bg-green-50 border border-green-100 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3" />
                    <span>GPS Signal Locked ({gps.lat.toFixed(4)}, {gps.lng.toFixed(4)})</span>
                  </span>
                )}
              </div>

              {/* Text Input */}
              <input
                type="text"
                required
                placeholder="Enter exact landmark or street name..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs p-3 bg-[#f1f3f4] border-none rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </div>

            {/* 4. Title & Description */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Huge water waste from broken BWSSB line"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-[#f1f3f4] border-none rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue. How is it impacting citizens? Mention if it is a major hazard to motorists or pedestrians."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-[#f1f3f4] border-none rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] resize-none"
                />
              </div>
            </div>

            {/* Alert on Rewards */}
            <div className="flex items-start space-x-2 bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <Info className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-normal font-medium">
                <strong>BBMP Civic Points:</strong> Submitting verified issues adds <strong>+50 points</strong> to your leaderboard score and starts the validation process instantly!
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Community Report...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Verified Civic Report</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Submission success state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10 space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 border-4 border-green-50 shadow-md">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-950">Civic Report Received!</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Your report has been logged successfully and is now live on the public dashboard. Citizens in your ward can upvote and add validating comments.
              </p>
            </div>

            {/* Point Bonus Card */}
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 border border-amber-100 p-4 rounded-xl max-w-xs mx-auto flex items-center justify-center space-x-3 shadow-xs"
            >
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <Sparkles className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Citizen Contribution</p>
                <p className="text-sm font-extrabold text-gray-900">+{pointsGained} BBMP Points Added!</p>
              </div>
            </motion.div>

            <button
              onClick={() => {
                setShowSuccess(false);
              }}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold text-xs hover:bg-gray-800 transition"
            >
              File Another Report
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
