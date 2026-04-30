// Get logo from localStorage or use default
const getLogoUrl = () => {
    const savedLogo = localStorage.getItem('erp_logo');
    if (savedLogo) {
        return savedLogo;
    }
    try {
        return new URL('../../public/logo.png', import.meta.url).href;
    } catch (e) {
        return '/logo.png';
    }
};

export const logoUrl = getLogoUrl();

// Function to reload logo (call after logo upload)
export const reloadLogo = () => {
    return getLogoUrl();
};
