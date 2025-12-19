import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Ghost } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Background blobs for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>
      </div>

      <div className="max-w-md w-full relative">
        {/* Animated Ghost Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 blur-xl opacity-50 group-hover:bg-blue-200 transition-colors duration-500"></div>
            <div className="relative animate-bounce duration-[2000ms]">
              <Ghost size={120} className="text-blue-600 drop-shadow-2xl" />
            </div>
          </div>
        </div>

        {/* 404 Text with Gradient */}
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 leading-none mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! You're in Orbit
        </h2>
        
        <p className="text-gray-600 mb-10 leading-relaxed text-lg">
          The page you're looking for was either deleted, moved, or never existed in this universe.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 w-full sm:w-auto"
          >
            <Home size={20} />
            Back to Home
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:-translate-y-1 transition-all active:scale-95 w-full sm:w-auto shadow-sm"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>

        {/* Modern Footer Detail */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
            JCI - Leadership & Growth
          </p>
        </div>
      </div>
    </div>
  );
}
