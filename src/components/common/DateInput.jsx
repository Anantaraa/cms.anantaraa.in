import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDisplayDate, formatInputDate } from '../../utils/dateUtils';
import './DateInput.css';

export default function DateInput({
    value,
    onChange,
    name,
    required = false,
    placeholder = "dd/mm/yyyy",
    className = "",
    style = {},
    min,
    max
}) {
    const [textValue, setTextValue] = useState('');
    const dateInputRef = useRef(null);

    // Sync prop value (YYYY-MM-DD) to text display (dd/mm/yyyy)
    useEffect(() => {
        if (value) {
            setTextValue(formatDisplayDate(value)); // Convert YYYY-MM-DD to dd/mm/yyyy
        } else {
            setTextValue('');
        }
    }, [value]);

    const handleTextChange = (e) => {
        const newVal = e.target.value;
        setTextValue(newVal);

        // Attempt to parse and emit change if valid (dd/mm/yyyy)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(newVal)) {
            const isoDate = formatInputDate(newVal);
            // Basic validity check
            const dateObj = new Date(isoDate);
            if (!isNaN(dateObj.getTime())) {
                onChange({ target: { name, value: isoDate } });
            }
        } else if (newVal === '') {
            onChange({ target: { name, value: '' } });
        }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        // Construct a synthetic event with the correct name and value
        // The parent expects { target: { name, value } }
        const syntheticEvent = {
            target: {
                name: name,
                value: newDate,
                type: 'date'
            }
        };
        onChange(syntheticEvent);
    };

    const triggerDatePicker = () => {
        try {
            if (dateInputRef.current) {
                if (dateInputRef.current.showPicker) {
                    dateInputRef.current.showPicker();
                } else {
                    // Fallback for older browsers
                    dateInputRef.current.focus();
                    dateInputRef.current.click();
                }
            }
        } catch (error) {
            console.error("Failed to open date picker", error);
        }
    };

    return (
        <div className={`date-input-container ${className}`} style={style}>
            <input
                type="text"
                name={name} // Name on text input for form handling if needed, though usually hidden input carries value? 
                // Actually, standard forms might pick up the text input. 
                // But usually we manage state via React.
                value={textValue}
                onChange={handleTextChange}
                placeholder={placeholder}
                required={required}
                className="date-input-text"
                maxLength={10}
                autoComplete="off"
            />
            <button
                type="button"
                className="date-input-icon-btn"
                onClick={triggerDatePicker}
                tabIndex={-1}
                title="Select Date"
            >
                <Calendar size={16} />
            </button>

            {/* Hidden Date Input for Picker */}
            <input
                ref={dateInputRef}
                type="date"
                value={value || ''}
                onChange={handleDateChange}
                min={min}
                max={max}
                className="date-input-hidden"
                tabIndex={-1}
            // We don't put 'name' here to avoid duplicate form submission values if standard form usage
            // But for React state forms it doesn't matter.
            />
        </div>
    );
}
