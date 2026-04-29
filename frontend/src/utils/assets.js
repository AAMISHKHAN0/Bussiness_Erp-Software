// Get logo from localStorage or use default
const getLogoUrl = () => {
    const savedLogo = localStorage.getItem('erp_logo');
    if (savedLogo) {
        return savedLogo;
    }
    return new URL('../../public/logo.png', import.meta.url).href;
};

export const logoUrl = getLogoUrl();

// Function to reload logo (call after logo upload)
export const reloadLogo = () => {
    return getLogoUrl();
};
