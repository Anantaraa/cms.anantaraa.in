/**
 * Date utility functions for consistent date formatting across the application
 * Backend API expects dates in dd/mm/yyyy format (e.g., 25/12/2025)
 */

/**
 * Formats a date string from YYYY-MM-DD or ISO to dd/mm/yyyy
 * @param {string} dateString - Date in YYYY-MM-DD format or ISO format
 * @returns {string} - Date in dd/mm/yyyy format (lowercase as per API)
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        return dateString;
    }
};

/**
 * Formats a date string to DD/MM/YYYY for display
 * Alias for formatDate for better semantic clarity
 * @param {string} dateString - Date string
 * @returns {string} - Date in DD/MM/YYYY format
 */
export const formatDisplayDate = formatDate;

/**
 * Converts YYYY-MM-DD (HTML date input format) to dd/mm/yyyy (API format)
 * @param {string} dateString - Date in YYYY-MM-DD format from HTML date input
 * @returns {string} - Date in dd/mm/yyyy format for API
 */
export const formatApiDate = (dateString) => {
    if (!dateString) return '';

    try {
        // If already in dd/mm/yyyy format, return as is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        // Convert YYYY-MM-DD to dd/mm/yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }

        return dateString;
    } catch (error) {
        return dateString;
    }
};

/**
 * Converts dd/mm/yyyy (API format) to YYYY-MM-DD (HTML date input format)
 * @param {string} dateString - Date in dd/mm/yyyy format from API
 * @returns {string} - Date in YYYY-MM-DD format for HTML date inputs
 */
export const formatInputDate = (dateString) => {
    if (!dateString) return '';

    try {
        // If already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Convert dd/mm/yyyy to YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }

        return dateString;
    } catch (error) {
        return dateString;
    }
};

/**
 * Gets today's date in YYYY-MM-DD format (for input fields)
 * @returns {string} - Today's date in YYYY-MM-DD format
 */
export const getTodayApiDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Gets today's date in DD/MM/YYYY format
 * @returns {string} - Today's date in DD/MM/YYYY format
 */
export const getTodayDisplayDate = () => {
    return formatDate(getTodayApiDate());
};
