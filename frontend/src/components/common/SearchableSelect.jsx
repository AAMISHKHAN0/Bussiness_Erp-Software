import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.code && opt.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white cursor-pointer flex items-center justify-between hover:border-primary-400 transition-colors"
            >
                <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-500 text-center italic">No options found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between group hover:bg-primary-50 transition-colors ${value === opt.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{opt.label}</span>
                                        {opt.code && <span className="text-xs text-gray-500 group-hover:text-primary-400">{opt.code}</span>}
                                    </div>
                                    {value === opt.id && <Check size={14} className="text-primary-600" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
