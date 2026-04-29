import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const DigitalClock = () => {
    const [time, setTime] = useState(new Date());
    const { locale } = useI18n();

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex w-full flex-col items-start sm:w-auto sm:items-end">
            <div className="group flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:border-primary-200 sm:w-auto sm:px-5">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-100 transition-colors">
                    <Clock size={20} className="animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight text-gray-900 tabular-nums sm:text-xl">
                        {formatTime(time)}
                    </span>
                    <span className="-mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {formatDate(time)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DigitalClock;
