
export interface ConversionResult {
  florida: {
    date: string;
    time: string;
    dayOfWeek: string;
    timezone: 'EDT' | 'EST';
    offset: number;
  };
  japan: {
    date: string;
    time: string;
    dayOfWeek: string;
  };
  timeDifference: number;
}
