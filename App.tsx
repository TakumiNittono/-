
import React from 'react';
import TimezoneConverter from './components/TimezoneConverter';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <main className="w-full max-w-xl mx-auto">
        <TimezoneConverter />
      </main>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>
          フロリダ（米国東部時間）から日本標準時へのタイムゾーンコンバーター
        </p>
      </footer>
    </div>
  );
}

export default App;
