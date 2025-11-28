import React, { useState, useMemo } from 'react';
import type { ConversionResult } from '../types';

// Helper function to get DST start and end dates for a given year in the US.
const getDSTRange = (year: number) => {
  // DST starts on the second Sunday in March at 2:00 AM.
  const marchFirst = new Date(year, 2, 1); // Month is 0-indexed for March
  const dayOfWeekMarchFirst = marchFirst.getDay(); // 0=Sun, 1=Mon, ...
  const firstSundayInMarch = 1 + (7 - dayOfWeekMarchFirst) % 7;
  const secondSundayInMarch = firstSundayInMarch + 7;
  const dstStart = new Date(year, 2, secondSundayInMarch, 2, 0, 0);

  // DST ends on the first Sunday in November at 2:00 AM.
  const novFirst = new Date(year, 10, 1); // Month is 0-indexed for November
  const dayOfWeekNovFirst = novFirst.getDay();
  const firstSundayInNovember = 1 + (7 - dayOfWeekNovFirst) % 7;
  const dstEnd = new Date(year, 10, firstSundayInNovember, 2, 0, 0);

  return { dstStart, dstEnd };
};

// Helper function to check if a specific date is within Daylight Saving Time for US ET.
const isDaylightSavingTime = (dateToCheck: Date): boolean => {
  const year = dateToCheck.getFullYear();
  const { dstStart, dstEnd } = getDSTRange(year);
  return dateToCheck >= dstStart && dateToCheck < dstEnd;
};

// Helper to convert an ET date specification to a JST date object with formatted parts.
const getJstDateTimeParts = (year: number, month: number, day: number, hour: number, minute: number): { date: string, time: string } | null => {
  const etDateForDstCheck = new Date(year, month - 1, day, hour, minute);
  const isEDT = isDaylightSavingTime(etDateForDstCheck);
  const offset = isEDT ? -4 : -5;

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const offsetString = `${offset < 0 ? '-' : '+'}${String(Math.abs(offset)).padStart(2, '0')}:00`;
  const isoString = `${dateStr}T${timeStr}:00${offsetString}`;
  const universalDate = new Date(isoString);

  if (isNaN(universalDate.getTime())) {
    return null;
  }

  const jstMonth = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric' }).format(universalDate);
  const jstDay = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', day: 'numeric' }).format(universalDate);
  const jstTime = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(universalDate);

  return {
    date: `${jstMonth}/${jstDay}`,
    time: jstTime,
  };
};


const TimezoneConverter: React.FC = () => {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // State for batch converter
  const [batchInput, setBatchInput] = useState<string>('');
  const [batchResults, setBatchResults] = useState<string>('');
  const [batchError, setBatchError] = useState<string>('');
  const [copyText, setCopyText] = useState<string>('結果をコピー');


  const handleConvert = () => {
    if (!dateStr || !timeStr) {
      setError('日付と時刻の両方を入力してください。');
      setResult(null);
      return;
    }
    setError('');

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    const etDateObject = new Date(year, month - 1, day, hour, minute);

    const isEDT = isDaylightSavingTime(etDateObject);
    const timezone = isEDT ? 'EDT' : 'EST';
    const offset = isEDT ? -4 : -5;
    const timeDifference = 9 - offset;

    const offsetString = `${offset < 0 ? '-' : '+'}${String(Math.abs(offset)).padStart(2, '0')}:00`;
    const isoString = `${dateStr}T${timeStr}:00${offsetString}`;
    const universalDate = new Date(isoString);

    if (isNaN(universalDate.getTime())) {
      setError('無効な日付または時刻が入力されました。');
      setResult(null);
      return;
    }
    
    const jstDateObj = new Date(universalDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const jstYear = jstDateObj.getFullYear();
    const jstMonth = jstDateObj.getMonth() + 1;
    const jstDay = jstDateObj.getDate();
    const japanDateFormatted = `${jstYear}年${jstMonth}月${jstDay}日`;
    
    const japanDayOfWeek = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(universalDate).replace(/[()]/g, '');
    const japanTime = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(universalDate);
    
    const floridaDayOfWeek = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(etDateObject).replace(/[()]/g, '');
    const floridaDateStr = `${year}年${month}月${day}日`;
    const floridaTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    setResult({
      florida: {
        date: floridaDateStr,
        dayOfWeek: floridaDayOfWeek,
        time: floridaTimeStr,
        timezone: timezone,
        offset: offset,
      },
      japan: {
        date: japanDateFormatted,
        dayOfWeek: japanDayOfWeek,
        time: japanTime,
      },
      timeDifference: timeDifference,
    });
  };
  
  const defaultDateTime = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: '19:00',
    };
  }, []);
  
  React.useEffect(() => {
    setDateStr(defaultDateTime.date);
    setTimeStr(defaultDateTime.time);
  }, [defaultDateTime]);

  const handleBatchConvert = () => {
    setBatchError('');
    setBatchResults('');
    if (!batchInput.trim()) {
      setBatchError('入力がありません。');
      return;
    }

    const year = new Date().getFullYear();
    const lines = batchInput.trim().split('\n');
    const resultsArray: string[] = [];
    const errorsArray: string[] = [];

    const lineRegex = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2})\s*[~-]\s*(\d{1,2})$/;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const match = trimmedLine.match(lineRegex);
      if (!match) {
        errorsArray.push(`行 ${index + 1}: 「${trimmedLine}」は不正な形式です。`);
        return;
      }

      const [, month, day, startHour, endHour] = match.map(Number);
      
      const startJst = getJstDateTimeParts(year, month, day, startHour, 0);
      const endJst = getJstDateTimeParts(year, month, day, endHour, 0);

      if (!startJst || !endJst) {
        errorsArray.push(`行 ${index + 1}: 「${trimmedLine}」の時刻を変換できませんでした。`);
        return;
      }
      
      let resultLine = '';
      if (startJst.date === endJst.date) {
        resultLine = `${startJst.date} ${startJst.time}~${endJst.time} (JST)`;
      } else {
        resultLine = `${startJst.date} ${startJst.time} ~ ${endJst.date} ${endJst.time} (JST)`;
      }
      resultsArray.push(resultLine);
    });

    if (errorsArray.length > 0) {
      setBatchError(errorsArray.join('\n'));
    }
    
    if (resultsArray.length > 0) {
      setBatchResults(resultsArray.join('\n'));
    }
  };

  const handleCopy = () => {
    if (!batchResults) return;
    navigator.clipboard.writeText(batchResults).then(() => {
        setCopyText('コピー完了!');
        setTimeout(() => setCopyText('結果をコピー'), 2000);
    }).catch(err => {
        console.error('Failed to copy results: ', err);
        setCopyText('コピー失敗');
        setTimeout(() => setCopyText('結果をコピー'), 2000);
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 border border-gray-700">
      {/* Single Time Converter */}
      <div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            タイムゾーン変換
          </h1>
          <p className="text-cyan-400 font-semibold mt-1">アメリカ東部時間 → 日本標準時</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="date-input" className="block text-sm font-medium text-gray-300 mb-1">日付 (フロリダ時間)</label>
            <input
              id="date-input"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
          </div>
          <div>
            <label htmlFor="time-input" className="block text-sm font-medium text-gray-300 mb-1">時刻 (フロリダ時間)</label>
            <input
              id="time-input"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <button
          onClick={handleConvert}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
        >
          変換する
        </button>

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

        {result && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4 text-center">
              <p className="text-gray-400 text-sm">元の時刻（フロリダ時間）</p>
              <p className="text-xl font-semibold text-gray-200">
                {result.florida.date} ({result.florida.dayOfWeek}) {result.florida.time} {result.florida.timezone} (UTC{result.florida.offset})
              </p>
            </div>

            <div className="flex justify-center items-center my-2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>

            <div className="bg-cyan-900/30 border border-cyan-500 p-6 rounded-lg text-center shadow-lg">
              <p className="text-cyan-300 text-md font-medium">変換後: 日本時間 (JST)</p>
              <p className="text-3xl font-bold text-white my-2">
                {result.japan.date} ({result.japan.dayOfWeek}) {result.japan.time} JST (UTC+9)
              </p>
              <p className="text-cyan-400 text-sm mt-2">
                (JSTは{result.florida.timezone}より{result.timeDifference}時間進んでいます)
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Batch Converter */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            一括変換
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            候補日時を改行して入力してください (例: 11/12 12-13)。
          </p>
        </div>

        <textarea
          rows={5}
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder={"11/12 12~13\n11/23 12~13\n11/24 11~12"}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition font-mono"
          aria-label="一括変換入力"
        />

        <button
          onClick={handleBatchConvert}
          className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50"
        >
          一括変換する
        </button>

        {batchError && <p className="text-red-400 mt-4 text-center whitespace-pre-wrap">{batchError}</p>}

        {batchResults && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-200">変換結果 (JST)</h3>
              <button
                onClick={handleCopy}
                className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold py-2 px-3 rounded-md transition"
              >
                {copyText}
              </button>
            </div>
            <pre className="bg-gray-900/50 p-4 rounded-lg text-white font-mono whitespace-pre-wrap text-left text-base">
              <code>{batchResults}</code>
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};

export default TimezoneConverter;
